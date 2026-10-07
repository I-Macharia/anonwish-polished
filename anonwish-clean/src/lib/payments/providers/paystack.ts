import { createHmac } from "node:crypto";
import type { PaymentProvider } from "../types";
import { payerEmail, safeEqual } from "./../util";

const API = "https://api.paystack.co";
const headers = () => ({ Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, "Content-Type": "application/json" });

type PaystackEvent = {
  event: string;
  data: {
    reference?: string;
    transaction_reference?: string;
    amount?: number;
    currency?: string;
    metadata?: { fulfillmentId?: string };
  };
};

// reference === fulfillmentId, so every event maps back to our record without a lookup table.
export const paystackProvider: PaymentProvider = {
  id: "paystack",
  currencies: ["NGN", "GHS", "ZAR", "KES", "USD"],
  isConfigured: () => Boolean(process.env.PAYSTACK_SECRET_KEY),

  async createCheckout(i) {
    const res = await fetch(`${API}/transaction/initialize`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        email: payerEmail(i.fulfillmentId, i.receiptEmail),
        amount: i.amount,
        currency: i.currency,
        reference: i.fulfillmentId,
        callback_url: i.returnUrl,
        metadata: { fulfillmentId: i.fulfillmentId, cancel_action: i.cancelUrl },
      }),
    });
    const body = (await res.json()) as { data?: { authorization_url: string; reference: string }; message?: string };
    if (!res.ok || !body.data) throw new Error(`Paystack: ${body.message ?? res.status}`);
    return { providerRef: body.data.reference, redirectUrl: body.data.authorization_url };
  },

  async parseWebhook(raw, h) {
    const expected = createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!).update(raw).digest("hex");
    if (!safeEqual(h.get("x-paystack-signature") ?? "", expected)) throw new Error("Bad signature");
    const ev = JSON.parse(raw) as PaystackEvent;
    const d = ev.data;
    if (ev.event === "charge.success" && d.reference) {
      return {
        type: "payment.succeeded",
        providerRef: d.reference,
        fulfillmentId: d.metadata?.fulfillmentId ?? d.reference,
        amount: d.amount ?? 0,
        currency: (d.currency ?? "").toUpperCase(),
      };
    }
    if (ev.event === "refund.processed" && d.transaction_reference) {
      return {
        type: "refund.completed",
        providerRef: d.transaction_reference,
        fulfillmentId: d.transaction_reference,
        amount: d.amount ?? 0,
        currency: (d.currency ?? "").toUpperCase(),
      };
    }
    return null;
  },

  async refund(ref, amount) {
    const res = await fetch(`${API}/refund`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ transaction: ref, ...(amount ? { amount } : {}) }),
    });
    if (!res.ok) throw new Error(`Paystack refund failed: ${res.status}`);
    return "done";
  },
};
