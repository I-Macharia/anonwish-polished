import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { wishes } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { errorResponse, json, sameOrigin } from "@/lib/http";
import { validImageUrls } from "@/lib/images";
import { moderate } from "@/lib/moderation";
import { toMinor } from "@/lib/money";
import { wishInput } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

async function loadOwned(id: string, userId: string) {
  if (!z.string().uuid().safeParse(id).success) return null;
  const [w] = await db
    .select({ id: wishes.id, status: wishes.status })
    .from(wishes)
    .where(and(eq(wishes.id, id), eq(wishes.userId, userId), isNull(wishes.deletedAt)))
    .limit(1);
  return w ?? null;
}

export async function PATCH(req: Request, { params }: Ctx) {
  if (!sameOrigin(req)) return json({ error: "Forbidden" }, 403);
  const user = await getCurrentUser();
  if (!user) return json({ error: "Sign in required" }, 401);
  const wish = await loadOwned((await params).id, user.id);
  if (!wish) return json({ error: "Not found" }, 404);
  if (wish.status !== "open") return json({ error: "Only open wishes can be edited" }, 409);

  const parsed = wishInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, 400);
  const v = parsed.data;
  if (!validImageUrls(v.imageUrls, user.id)) return json({ error: "Invalid image" }, 400);
  const verdict = await moderate(`${v.title}\n${v.description}`);
  if (!verdict.ok) return json({ error: verdict.reason }, 400);

  try {
    await db
      .update(wishes)
      .set({
        title: v.title,
        description: v.description,
        categoryId: v.categoryId,
        estimatedMin: toMinor(v.estimatedMin),
        estimatedMax: toMinor(v.estimatedMax),
        currency: v.currency,
        urgency: v.urgency,
        imageUrls: v.imageUrls,
        updatedAt: new Date(),
      })
      .where(eq(wishes.id, wish.id));
    return json({ id: wish.id });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(req: Request, { params }: Ctx) {
  if (!sameOrigin(req)) return json({ error: "Forbidden" }, 403);
  const user = await getCurrentUser();
  if (!user) return json({ error: "Sign in required" }, 401);
  const wish = await loadOwned((await params).id, user.id);
  if (!wish) return json({ error: "Not found" }, 404);
  if (wish.status !== "open") return json({ error: "Funded wishes cannot be deleted. Contact support." }, 409);
  await db.update(wishes).set({ status: "cancelled", deletedAt: new Date(), updatedAt: new Date() }).where(eq(wishes.id, wish.id));
  return json({ ok: true });
}
