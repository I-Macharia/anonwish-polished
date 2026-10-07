import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { users, wishes } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { UserError } from "@/lib/errors";
import { errorResponse, json, sameOrigin } from "@/lib/http";
import { IMAGE_BUCKET } from "@/lib/images";
import { supabaseAdmin } from "@/lib/supabase/admin";

/** GDPR erasure: anonymise the user, blank their wishes, delete images and the auth identity. */
export async function DELETE(req: Request) {
  if (!sameOrigin(req)) return json({ error: "Forbidden" }, 403);
  const user = await getCurrentUser();
  if (!user) return json({ error: "Sign in required" }, 401);
  try {
    const [funded] = await db
      .select({ id: wishes.id })
      .from(wishes)
      .where(and(eq(wishes.userId, user.id), eq(wishes.status, "funded")))
      .limit(1);
    if (funded) throw new UserError("You have funded wishes awaiting fulfilment. Contact support to close them first.", 409);

    const now = new Date();
    await db.transaction(async (tx) => {
      await tx.update(wishes).set({ status: "cancelled" }).where(and(eq(wishes.userId, user.id), eq(wishes.status, "open")));
      // Paid fulfilment records are kept for financial/legal reasons, but the personal content is erased.
      await tx
        .update(wishes)
        .set({ title: "[deleted]", description: "[deleted]", imageUrls: [], deletedAt: now })
        .where(eq(wishes.userId, user.id));
      await tx
        .update(users)
        .set({ email: `deleted+${user.id}@deleted.invalid`, name: null, country: null, deletedAt: now })
        .where(eq(users.id, user.id));
    });

    const admin = supabaseAdmin();
    const { data: files } = await admin.storage.from(IMAGE_BUCKET).list(user.id);
    if (files?.length) await admin.storage.from(IMAGE_BUCKET).remove(files.map((f) => `${user.id}/${f.name}`));
    await admin.auth.admin.deleteUser(user.id);
    return json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
