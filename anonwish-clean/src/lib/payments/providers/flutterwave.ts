import type { PaymentProvider } from "../types";
import { payerEmail, safeEqual } from "../util";

const API = "https://api.flutterwave.com/v3";
const headers = () => ({ Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`, "Content-Type": "application/json" });

type FlwEvent = {
  event: string;
  data: { tx_ref?: string; status?: string; amount?: number; currency?: string };
};

// tx_ref === fulfillmentId. Flutterwave amounts are major units; we store minor units.
export const flutterwaveProvider: PaymentProvider = {
  id: "flutterwave",
  currencies: ["NGN", "GHS", "KES", "UGX", "TZS", "RWF", "ZAR", "USD", "EUR", "GBP"],
  isConfigured: () => Boolean(process.env.FLUTTERWAVE_SECRET_KEY && process.env.FLUTTERWAVE_WEBHOOK_HASH),

  async createCheckout(i) {
    const res = await fetch(`${API}/payments`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        tx_ref: i.fulfillmentId,
        amount: i.amount / 100,
        currency: i.currency,
        redirect_url: i.returnUrl,
        customer: { email: payerEmail(i.fulfillmentId, i.receiptEmail) },
        meta: { fulfillmentId: i.fulfillmentId },
        customizations: { title: "AnonWish", description: "Anonymous gift" },
      }),
    });
    const body = (await res.json()) as { data?: { link: string }; message?: string };
    if (!res.ok || !body.data?.link) throw new Error(`Flutterwave: ${body.message ?? res.status}`);
    return { providerRef: i.fulfillmentId, redirectUrl: body.data.link };
  },

  async parseWebhook(raw, h) {
    if (!safeEqual(h.get("verif-hash") ?? "", process.env.FLUTTERWAVE_WEBHOOK_HASH!)) throw new Error("Bad signature");
    const ev = JSON.parse(raw) as FlwEvent;
    const d = ev.data;
    if (ev.event !== "charge.completed" || !d.tx_ref) return null;
    const base = {
      providerRef: d.tx_ref,
      fulfillmentId: d.tx_ref,
      amount: Math.round((d.amount ?? 0) * 100),
      currency: (d.currency ?? "").toUpperCase(),
    };
    if (d.status === "successful") return { type: "payment.succeeded", ...base };
    if (d.status === "failed") return { type: "payment.failed", ...base };
    return null;
  },

  async refund(ref, amount) {
    const q = await fetch(`${API}/transactions?tx_ref=${encodeURIComponent(ref)}`, { headers: headers() });
    const found = (await q.json()) as { data?: { id: number }[] };
    const id = found.data?.[0]?.id;
    if (!q.ok || !id) throw new Error("Flutterwave transaction not found");
    const res = await fetch(`${API}/transactions/${id}/refund`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(amount ? { amount: amount / 100 } : {}),
    });
    if (!res.ok) throw new Error(`Flutterwave refund failed: ${res.status}`);
    return "done";
  },
};
