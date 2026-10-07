import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { reports, wishes } from "@/db/schema";
import { errorResponse, json, sameOrigin } from "@/lib/http";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { reportInput } from "@/lib/validation";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: "Forbidden" }, 403);
  if (!rateLimit(`report:${clientIp(req)}`, 10, 3_600_000)) return json({ error: "Too many reports. Try again later." }, 429);
  const parsed = reportInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, 400);
  try {
    const [w] = await db
      .select({ id: wishes.id })
      .from(wishes)
      .where(and(eq(wishes.id, parsed.data.wishId), isNull(wishes.deletedAt)))
      .limit(1);
    if (!w) return json({ error: "Wish not found" }, 404);
    await db.insert(reports).values(parsed.data);
    return json({ ok: true }, 201);
  } catch (e) {
    return errorResponse(e);
  }
}
