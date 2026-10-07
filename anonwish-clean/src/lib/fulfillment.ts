import { randomUUID } from "node:crypto";
import { and, count, eq, isNull, ne } from "drizzle-orm";
import { z } from "zod";
import { db, type Tx } from "@/db";
import { adminLogs, donorReceipts, fulfillments, users, wishes } from "@/db/schema";
import { decrypt, encrypt, hashToken } from "./crypto";
import { sendEmail } from "./email";
import { siteUrl } from "./env";
import { UserError } from "./errors";
import { decide } from "./fulfillment-logic";
import { formatMoney } from "./money";
import { getProvider, pickProvider } from "./payments";
import type { NormalizedEvent, ProviderId } from "./payments/types";

type StartInput = {
  wishId: string;
  donorToken: string;
  privateMessage?: string;
  receiptEmail?: string;
  phone?: string | null;
};

/** Creates a pending fulfillment and a hosted checkout. No donor identity is attached to the wish. */
export async function startFulfillment(input: StartInput): Promise<{ redirectUrl: string }> {
  const [wish] = await db
    .select({ id: wishes.id, status: wishes.status, amount: wishes.estimatedMax, currency: wishes.currency })
    .from(wishes)
    .where(and(eq(wishes.id, input.wishId), isNull(wishes.deletedAt)))
    .limit(1);
  if (!wish || wish.status !== "open") throw new UserError("This wish is no longer open.", 409);

  let provider;
  try {
    provider = pickProvider(wish.currency);
  } catch {
    throw new UserError("No payment method is available for this currency yet.", 503);
  }
  if (provider.id === "mpesa" && !input.phone) throw new UserError("Enter your M-Pesa phone number.");

  const id = randomUUID();
  await db.transaction(async (tx) => {
    await tx.insert(fulfillments).values({
      id,
      wishId: wish.id,
      provider: provider.id,
      providerRef: `pending:${id}`,
      amount: wish.amount,
      currency: wish.currency,
      donorTokenHash: hashToken(input.donorToken),
      privateMessage: input.privateMessage ?? null,
    });
    if (input.receiptEmail) await tx.insert(donorReceipts).values({ fulfillmentId: id, emailEncrypted: encrypt(input.receiptEmail) });
  });

  try {
    const r = await provider.createCheckout({
      fulfillmentId: id,
      wishId: wish.id,
      amount: wish.amount,
      currency: wish.currency,
      returnUrl: `${siteUrl()}/thanks?f=${id}`,
      cancelUrl: `${siteUrl()}/wishes/${wish.id}`,
      receiptEmail: input.receiptEmail,
      phone: input.phone ?? undefined,
    });
    await db.update(fulfillments).set({ providerRef: r.providerRef }).where(eq(fulfillments.id, id));
    return { redirectUrl: r.redirectUrl };
  } catch (e) {
    console.error("checkout failed", provider.id, e);
    await db.update(fulfillments).set({ status: "failed" }).where(eq(fulfillments.id, id));
    await db.delete(donorReceipts).where(eq(donorReceipts.fulfillmentId, id));
    throw new UserError("Could not start the payment. Please try again or use a different method.", 502);
  }
}

export async function reopenWishIfUnfunded(tx: Tx, wishId: string, exceptFulfillmentId: string): Promise<void> {
  const [others] = await tx
    .select({ n: count() })
    .from(fulfillments)
    .where(and(eq(fulfillments.wishId, wishId), eq(fulfillments.status, "paid"), ne(fulfillments.id, exceptFulfillmentId)));
  if ((others?.n ?? 0) === 0) {
    await tx
      .update(wishes)
      .set({ status: "open", updatedAt: new Date() })
      .where(and(eq(wishes.id, wishId), eq(wishes.status, "funded")));
  }
}

async function findFulfillment(provider: ProviderId, e: NormalizedEvent) {
  const cols = { id: fulfillments.id, wishId: fulfillments.wishId, provider: fulfillments.provider };
  if (e.fulfillmentId) {
    if (!z.string().uuid().safeParse(e.fulfillmentId).success) return null;
    const [f] = await db.select(cols).from(fulfillments).where(eq(fulfillments.id, e.fulfillmentId)).limit(1);
    return f?.provider === provider ? f : null;
  }
  const [f] = await db
    .select(cols)
    .from(fulfillments)
    .where(and(eq(fulfillments.provider, provider), eq(fulfillments.providerRef, e.providerRef)))
    .limit(1);
  return f ?? null;
}

type Effect =
  | { kind: "fund"; fulfillmentId: string; amount: number; currency: string; wishTitle: string; ownerId: string }
  | { kind: "refund"; fulfillmentId: string; providerRef: string };

/** Applies a verified, normalized webhook event. Safe to call repeatedly with the same event. */
export async function applyEvent(providerId: ProviderId, e: NormalizedEvent): Promise<void> {
  const found = await findFulfillment(providerId, e);
  if (!found) {
    console.warn("Webhook for unknown fulfillment", providerId, e.providerRef);
    return;
  }

  const effect = await db.transaction(async (tx): Promise<Effect | null> => {
    const [f] = await tx.select().from(fulfillments).where(eq(fulfillments.id, found.id)).for("update");
    const [w] = await tx
      .select({ id: wishes.id, status: wishes.status, userId: wishes.userId, title: wishes.title })
      .from(wishes)
      .where(eq(wishes.id, found.wishId))
      .for("update");
    if (!f || !w) return null;

    switch (decide(f, w, e)) {
      case "fund":
        await tx.update(fulfillments).set({ status: "paid" }).where(eq(fulfillments.id, f.id));
        await tx.update(wishes).set({ status: "funded", updatedAt: new Date() }).where(eq(wishes.id, w.id));
        return { kind: "fund", fulfillmentId: f.id, amount: f.amount, currency: f.currency, wishTitle: w.title, ownerId: w.userId };
      case "refund_duplicate":
        await tx.update(fulfillments).set({ status: "paid" }).where(eq(fulfillments.id, f.id));
        return { kind: "refund", fulfillmentId: f.id, providerRef: f.providerRef };
      case "fail":
        await tx.update(fulfillments).set({ status: "failed" }).where(eq(fulfillments.id, f.id));
        return null;
      case "mark_refunded":
        await tx.update(fulfillments).set({ status: "refunded" }).where(eq(fulfillments.id, f.id));
        await reopenWishIfUnfunded(tx, w.id, f.id);
        return null;
      case "amount_mismatch":
        await tx.insert(adminLogs).values({
          adminId: null,
          action: "payment_amount_mismatch",
          targetType: "fulfillment",
          targetId: f.id,
          meta: { expected: f.amount, got: e.amount, currency: e.currency },
        });
        return null;
      default:
        return null;
    }
  });

  if (effect?.kind === "fund") await notifyFunded(effect);
  if (effect?.kind === "refund") await refundDuplicate(providerId, effect);
}

async function notifyFunded(x: Extract<Effect, { kind: "fund" }>): Promise<void> {
  try {
    const [owner] = await db.select({ email: users.email }).from(users).where(eq(users.id, x.ownerId)).limit(1);
    if (owner) {
      await sendEmail(
        owner.email,
        "Your wish has been funded",
        `Good news: your wish "${x.wishTitle}" was funded by an anonymous donor.\n\nNext steps are on your dashboard: ${siteUrl()}/dashboard`,
      );
    }
    const [receipt] = await db.select().from(donorReceipts).where(eq(donorReceipts.fulfillmentId, x.fulfillmentId)).limit(1);
    if (receipt) {
      await sendEmail(
        decrypt(receipt.emailEncrypted),
        "Your AnonWish receipt",
        `Thank you. We received ${formatMoney(x.amount, x.currency)} toward a wish. Reference: ${x.fulfillmentId}`,
      );
      // Data minimisation: the donor email is kept only until the receipt is sent.
      await db.delete(donorReceipts).where(eq(donorReceipts.fulfillmentId, x.fulfillmentId));
    }
  } catch (err) {
    console.error("Post-funding notification failed", err);
  }
}

async function refundDuplicate(providerId: ProviderId, x: Extract<Effect, { kind: "refund" }>): Promise<void> {
  const log = (action: string, meta?: Record<string, unknown>) =>
    db.insert(adminLogs).values({ adminId: null, action, targetType: "fulfillment", targetId: x.fulfillmentId, meta });
  try {
    const result = await getProvider(providerId).refund(x.providerRef);
    if (result === "done") {
      await db.update(fulfillments).set({ status: "refunded" }).where(eq(fulfillments.id, x.fulfillmentId));
      await log("auto_refund_duplicate");
    } else {
      await log("manual_refund_required", { provider: providerId });
    }
  } catch (err) {
    console.error("Auto-refund failed", err);
    await log("auto_refund_failed", { provider: providerId });
  }
}
