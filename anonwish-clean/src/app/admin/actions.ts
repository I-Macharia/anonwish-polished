"use server";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { adminLogs, fulfillments, reports, wishes } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { reopenWishIfUnfunded } from "@/lib/fulfillment";
import { getProvider } from "@/lib/payments";

const idOf = (fd: FormData) => z.string().uuid().parse(fd.get("id"));

const log = (adminId: string, action: string, targetType: string, targetId: string, meta?: Record<string, unknown>) =>
  db.insert(adminLogs).values({ adminId, action, targetType, targetId, meta });

export async function dismissReport(fd: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = idOf(fd);
  await db.update(reports).set({ status: "dismissed" }).where(eq(reports.id, id));
  await log(admin.id, "dismiss_report", "report", id);
  revalidatePath("/admin");
}

/** Takes down an open wish. Funded wishes must be refunded first so money is never orphaned. */
export async function removeWish(fd: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = idOf(fd);
  const removed = await db.transaction(async (tx) => {
    const rows = await tx
      .update(wishes)
      .set({ status: "cancelled", deletedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(wishes.id, id), eq(wishes.status, "open")))
      .returning({ id: wishes.id });
    if (rows.length) await tx.update(reports).set({ status: "actioned" }).where(eq(reports.wishId, id));
    return rows.length > 0;
  });
  if (!removed) throw new Error("Only open wishes can be removed. Refund funded wishes first.");
  await log(admin.id, "remove_wish", "wish", id);
  revalidatePath("/admin");
}

export async function markFulfilled(fd: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = idOf(fd);
  await db.update(wishes).set({ status: "fulfilled", updatedAt: new Date() }).where(and(eq(wishes.id, id), eq(wishes.status, "funded")));
  await log(admin.id, "mark_fulfilled", "wish", id);
  revalidatePath("/admin");
}

/** Refunds a paid fulfillment. M-Pesa has no refund API here: refund in the portal first, then record it. */
export async function refundFulfillment(fd: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = idOf(fd);
  const [f] = await db.select().from(fulfillments).where(eq(fulfillments.id, id)).limit(1);
  if (!f || f.status !== "paid") throw new Error("Only paid fulfillments can be refunded");

  const result = await getProvider(f.provider).refund(f.providerRef);
  await db.transaction(async (tx) => {
    await tx.update(fulfillments).set({ status: "refunded" }).where(eq(fulfillments.id, f.id));
    await reopenWishIfUnfunded(tx, f.wishId, f.id);
  });
  await log(admin.id, "refund_fulfillment", "fulfillment", id, { manual: result === "manual" });
  revalidatePath("/admin");
}
