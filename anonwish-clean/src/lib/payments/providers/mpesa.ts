import type { PaymentProvider } from "../types";
import { safeEqual } from "../util";
import { siteUrl } from "@/lib/env";

const base = () => (process.env.MPESA_ENV === "production" ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke");

async function token(): Promise<string> {
  const basic = Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString("base64");
  const res = await fetch(`${base()}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${basic}` },
  });
  const body = (await res.json()) as { access_token?: string };
  if (!res.ok || !body.access_token) throw new Error("M-Pesa auth failed");
  return body.access_token;
}

type StkCallback = {
  Body?: {
    stkCallback?: {
      CheckoutRequestID?: string;
      ResultCode?: number;
      CallbackMetadata?: { Item?: { Name: string; Value?: string | number }[] };
    };
  };
};

// Daraja STK push (KES only). Callbacks are unsigned, so the callback URL carries a secret.
export const mpesaProvider: PaymentProvider = {
  id: "mpesa",
  currencies: ["KES"],
  isConfigured: () =>
    Boolean(
      process.env.MPESA_CONSUMER_KEY && process.env.MPESA_CONSUMER_SECRET && process.env.MPESA_SHORTCODE &&
        process.env.MPESA_PASSKEY && process.env.MPESA_CALLBACK_SECRET,
    ),

  async createCheckout(i) {
    if (!i.phone) throw new Error("A phone number is required for M-Pesa");
    const shortcode = process.env.MPESA_SHORTCODE!;
    const timestamp = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
    const res = await fetch(`${base()}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: { Authorization: `Bearer ${await token()}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        BusinessShortCode: shortcode,
        Password: Buffer.from(`${shortcode}${process.env.MPESA_PASSKEY}${timestamp}`).toString("base64"),
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: Math.round(i.amount / 100),
        PartyA: i.phone,
        PartyB: shortcode,
        PhoneNumber: i.phone,
        CallBackURL: `${siteUrl()}/api/webhooks/mpesa?s=${process.env.MPESA_CALLBACK_SECRET}`,
        AccountReference: "AnonWish",
        TransactionDesc: "Anonymous gift",
      }),
    });
    const body = (await res.json()) as { CheckoutRequestID?: string; ResponseCode?: string; errorMessage?: string };
    if (!res.ok || body.ResponseCode !== "0" || !body.CheckoutRequestID)
      throw new Error(`M-Pesa: ${body.errorMessage ?? "STK push failed"}`);
    // No hosted page: the donor approves on their phone, so send them to the status page.
    return { providerRef: body.CheckoutRequestID, redirectUrl: `${i.returnUrl}&pending=mpesa` };
  },

  async parseWebhook(raw, _headers, url) {
    if (!safeEqual(url.searchParams.get("s") ?? "", process.env.MPESA_CALLBACK_SECRET!)) throw new Error("Bad callback secret");
    const cb = (JSON.parse(raw) as StkCallback).Body?.stkCallback;
    if (!cb?.CheckoutRequestID) return null;
    if (cb.ResultCode !== 0) {
      return { type: "payment.failed", providerRef: cb.CheckoutRequestID, amount: 0, currency: "KES" };
    }
    const paid = cb.CallbackMetadata?.Item?.find((x) => x.Name === "Amount")?.Value;
    return {
      type: "payment.succeeded",
      providerRef: cb.CheckoutRequestID,
      amount: Math.round(Number(paid ?? 0) * 100),
      currency: "KES",
    };
  },

  // Daraja reversals need initiator credentials and approval; handled by an admin in the M-Pesa portal.
  async refund() {
    return "manual";
  },
};
