import type { NormalizedEvent } from "./payments/types";

export type FulfillmentState = { status: "pending" | "paid" | "failed" | "refunded"; amount: number; currency: string };
export type WishState = { status: "open" | "funded" | "fulfilled" | "cancelled" | "expired" };
export type Decision = "ignore" | "amount_mismatch" | "fund" | "refund_duplicate" | "fail" | "mark_refunded";

/** Pure state machine for webhook events. Idempotent: replays of the same event decide "ignore". */
export function decide(f: FulfillmentState, w: WishState, e: NormalizedEvent): Decision {
  switch (e.type) {
    case "payment.succeeded":
      if (f.status === "paid" || f.status === "refunded") return "ignore";
      if (e.amount !== f.amount || e.currency !== f.currency) return "amount_mismatch";
      // A second payment, or a payment for a wish that was removed meanwhile, is refunded.
      return w.status === "open" ? "fund" : "refund_duplicate";
    case "payment.failed":
      return f.status === "pending" ? "fail" : "ignore";
    case "refund.completed":
      return f.status === "paid" ? "mark_refunded" : "ignore";
  }
}
