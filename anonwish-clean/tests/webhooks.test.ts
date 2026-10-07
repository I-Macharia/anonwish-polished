import { createHmac } from "node:crypto";
import Stripe from "stripe";
import { describe, expect, it } from "vitest";
import { flutterwaveProvider } from "@/lib/payments/providers/flutterwave";
import { mpesaProvider } from "@/lib/payments/providers/mpesa";
import { paystackProvider } from "@/lib/payments/providers/paystack";
import { stripeProvider } from "@/lib/payments/providers/stripe";

const url = new URL("https://anonwish.test/api/webhooks/x");
const FID = "11111111-1111-4111-8111-111111111111";

describe("stripe webhook", () => {
  const payload = JSON.stringify({
    id: "evt_1", object: "event", type: "checkout.session.completed",
    data: { object: { id: "cs_1", object: "checkout.session", payment_status: "paid", amount_total: 5000, currency: "usd", metadata: { fulfillmentId: FID } } },
  });
  const sign = (body: string) => new Stripe("sk_test_dummy").webhooks.generateTestHeaderString({ payload: body, secret: process.env.STRIPE_WEBHOOK_SECRET! });

  it("accepts a correctly signed payment", async () => {
    const ev = await stripeProvider.parseWebhook(payload, new Headers({ "stripe-signature": sign(payload) }), url);
    expect(ev).toMatchObject({ type: "payment.succeeded", fulfillmentId: FID, amount: 5000, currency: "USD", providerRef: "cs_1" });
  });
  it("rejects a tampered body", async () => {
    const header = sign(payload);
    await expect(stripeProvider.parseWebhook(payload.replace("5000", "1"), new Headers({ "stripe-signature": header }), url)).rejects.toThrow();
  });
  it("rejects a missing signature", async () => {
    await expect(stripeProvider.parseWebhook(payload, new Headers(), url)).rejects.toThrow();
  });
});

describe("paystack webhook", () => {
  const body = JSON.stringify({ event: "charge.success", data: { reference: FID, amount: 150000, currency: "NGN", metadata: { fulfillmentId: FID } } });
  const sig = createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!).update(body).digest("hex");
  it("verifies HMAC and normalizes", async () => {
    expect(await paystackProvider.parseWebhook(body, new Headers({ "x-paystack-signature": sig }), url)).toMatchObject({
      type: "payment.succeeded", fulfillmentId: FID, amount: 150000, currency: "NGN",
    });
  });
  it("rejects a bad signature", async () => {
    await expect(paystackProvider.parseWebhook(body, new Headers({ "x-paystack-signature": "nope" }), url)).rejects.toThrow();
  });
});

describe("flutterwave webhook", () => {
  const body = JSON.stringify({ event: "charge.completed", data: { tx_ref: FID, status: "successful", amount: 1500, currency: "KES" } });
  it("verifies the hash header and converts to minor units", async () => {
    expect(await flutterwaveProvider.parseWebhook(body, new Headers({ "verif-hash": process.env.FLUTTERWAVE_WEBHOOK_HASH! }), url)).toMatchObject({
      type: "payment.succeeded", amount: 150000, currency: "KES",
    });
  });
  it("rejects a wrong hash", async () => {
    await expect(flutterwaveProvider.parseWebhook(body, new Headers({ "verif-hash": "wrong" }), url)).rejects.toThrow();
  });
});

describe("mpesa callback", () => {
  const ok = JSON.stringify({ Body: { stkCallback: { CheckoutRequestID: "ws_CO_1", ResultCode: 0, CallbackMetadata: { Item: [{ Name: "Amount", Value: 1500 }] } } } });
  const fail = JSON.stringify({ Body: { stkCallback: { CheckoutRequestID: "ws_CO_1", ResultCode: 1032 } } });
  const authed = new URL(`${url.href}?s=${process.env.MPESA_CALLBACK_SECRET}`);
  it("maps a successful callback", async () => {
    expect(await mpesaProvider.parseWebhook(ok, new Headers(), authed)).toMatchObject({ type: "payment.succeeded", providerRef: "ws_CO_1", amount: 150000, currency: "KES" });
  });
  it("maps a cancelled callback to failed", async () => {
    expect(await mpesaProvider.parseWebhook(fail, new Headers(), authed)).toMatchObject({ type: "payment.failed" });
  });
  it("rejects a missing or wrong secret", async () => {
    await expect(mpesaProvider.parseWebhook(ok, new Headers(), url)).rejects.toThrow();
  });
});
