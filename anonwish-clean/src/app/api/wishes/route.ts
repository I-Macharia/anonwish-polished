import { eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, wishes } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { errorResponse, json, sameOrigin } from "@/lib/http";
import { validImageUrls } from "@/lib/images";
import { moderate } from "@/lib/moderation";
import { toMinor } from "@/lib/money";
import { rateLimit } from "@/lib/ratelimit";
import { wishInput } from "@/lib/validation";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: "Forbidden" }, 403);
  const user = await getCurrentUser();
  if (!user) return json({ error: "Sign in required" }, 401);
  if (!rateLimit(`wish:${user.id}`, 5, 3_600_000)) return json({ error: "You are creating wishes too quickly. Try again later." }, 429);

  const parsed = wishInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, 400);
  const v = parsed.data;

  if (!validImageUrls(v.imageUrls, user.id)) return json({ error: "Invalid image" }, 400);
  const verdict = await moderate(`${v.title}\n${v.description}`);
  if (!verdict.ok) return json({ error: verdict.reason }, 400);

  try {
    const [cat] = await db.select({ id: categories.id }).from(categories).where(eq(categories.id, v.categoryId)).limit(1);
    if (!cat) return json({ error: "Unknown category" }, 400);
    const [row] = await db
      .insert(wishes)
      .values({
        userId: user.id,
        title: v.title,
        description: v.description,
        categoryId: v.categoryId,
        estimatedMin: toMinor(v.estimatedMin),
        estimatedMax: toMinor(v.estimatedMax),
        currency: v.currency,
        urgency: v.urgency,
        imageUrls: v.imageUrls,
      })
      .returning({ id: wishes.id });
    return json({ id: row?.id }, 201);
  } catch (e) {
    return errorResponse(e);
  }
}
