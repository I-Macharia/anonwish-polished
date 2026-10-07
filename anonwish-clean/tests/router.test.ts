import { afterEach, describe, expect, it } from "vitest";
import { pickProvider, registerProvider } from "@/lib/payments/router";
import type { PaymentProvider, ProviderId } from "@/lib/payments/types";

const stub = (id: ProviderId, currencies: string[], configured = true): PaymentProvider => ({
  id, currencies, isConfigured: () => configured,
  createCheckout: async () => ({ providerRef: "x", redirectUrl: "https://pay.test" }),
  parseWebhook: async () => null,
  refund: async () => "done",
});

function setup(mpesa = true) {
  process.env.PAYMENTS_ENABLED = "stripe,flutterwave,paystack,mpesa";
  registerProvider(stub("mpesa", ["KES"], mpesa));
  registerProvider(stub("paystack", ["NGN", "GHS", "ZAR", "KES", "USD"]));
  registerProvider(stub("flutterwave", ["NGN", "KES", "UGX", "USD"]));
  registerProvider(stub("stripe", ["USD", "EUR", "GBP"]));
}
afterEach(() => { process.env.PAYMENTS_ENABLED = "stripe,flutterwave,paystack,mpesa"; });

describe("pickProvider", () => {
  it("routes KES to M-Pesa first", () => { setup(); expect(pickProvider("KES").id).toBe("mpesa"); });
  it("falls back when M-Pesa is not configured", () => { setup(false); expect(pickProvider("KES").id).toBe("paystack"); });
  it("routes NGN to Paystack and USD to Stripe", () => {
    setup();
    expect(pickProvider("NGN").id).toBe("paystack");
    expect(pickProvider("USD").id).toBe("stripe");
  });
  it("respects PAYMENTS_ENABLED", () => {
    setup();
    process.env.PAYMENTS_ENABLED = "flutterwave";
    expect(pickProvider("KES").id).toBe("flutterwave");
  });
  it("throws when nothing supports the currency", () => { setup(); expect(() => pickProvider("JPY")).toThrow(); });
});
