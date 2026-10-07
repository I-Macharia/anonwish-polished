import { describe, expect, it } from "vitest";
import { decide, type FulfillmentState, type WishState } from "@/lib/fulfillment-logic";
import type { NormalizedEvent } from "@/lib/payments/types";

const f = (over: Partial<FulfillmentState> = {}): FulfillmentState => ({ status: "pending", amount: 5000, currency: "USD", ...over });
const w = (status: WishState["status"] = "open"): WishState => ({ status });
const ev = (over: Partial<NormalizedEvent> = {}): NormalizedEvent => ({ type: "payment.succeeded", providerRef: "r", amount: 5000, currency: "USD", ...over });

describe("decide", () => {
  it("funds an open wish on matching payment", () => expect(decide(f(), w(), ev())).toBe("fund"));
  it("is idempotent: replays of a paid fulfillment are ignored", () => expect(decide(f({ status: "paid" }), w("funded"), ev())).toBe("ignore"));
  it("flags amount or currency mismatches instead of funding", () => {
    expect(decide(f(), w(), ev({ amount: 100 }))).toBe("amount_mismatch");
    expect(decide(f(), w(), ev({ currency: "EUR" }))).toBe("amount_mismatch");
  });
  it.each(["funded", "fulfilled", "cancelled", "expired"] as const)("refunds a payment for a %s wish", (s) =>
    expect(decide(f(), w(s), ev())).toBe("refund_duplicate"));
  it("marks failures only while pending", () => {
    expect(decide(f(), w(), ev({ type: "payment.failed" }))).toBe("fail");
    expect(decide(f({ status: "paid" }), w("funded"), ev({ type: "payment.failed" }))).toBe("ignore");
  });
  it("records refunds only for paid fulfillments", () => {
    expect(decide(f({ status: "paid" }), w("funded"), ev({ type: "refund.completed" }))).toBe("mark_refunded");
    expect(decide(f({ status: "refunded" }), w(), ev({ type: "refund.completed" }))).toBe("ignore");
  });
});
