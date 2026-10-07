import Stripe from "stripe";
import type { PaymentProvider } from "../types";

let client: Stripe | null = null;
const stripe = () => (client ??= new Stripe(process.env.STRIPE_SECRET_KEY!));

// MVP: charges land on the platform account (escrow-like). Connect transfers to wishers/vendors
// plus the PLATFORM_FEE_BPS fee are the payout step, added when vendor purchasing is automated.
export const stripeProvider: PaymentProvider = {
  id: "stripe",
  currencies: ["USD", "EUR", "GBP"],
  isConfigured: () => Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET),

  async createCheckout(i) {
    const session = await stripe().checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: i.currency.toLowerCase(),
            unit_amount: i.amount,
            product_data: { name: "Anonymous gift to fulfil a wish" },
          },
        },
      ],
      success_url: i.returnUrl,
      cancel_url: i.cancelUrl,
      metadata: { fulfillmentId: i.fulfillmentId },
      payment_intent_data: { metadata: { fulfillmentId: i.fulfillmentId }, receipt_email: i.receiptEmail },
    });
    if (!session.url) throw new Error("Stripe returned no checkout URL");
    return { providerRef: session.id, redirectUrl: session.url };
  },

  async parseWebhook(raw, headers) {
    const sig = headers.get("stripe-signature");
    if (!sig) throw new Error("Missing signature");
    const ev = stripe().webhooks.constructEvent(raw, sig, process.env.STRIPE_WEBHOOK_SECRET!);

    switch (ev.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const s = ev.data.object;
        if (s.payment_status !== "paid") return null;
        return {
          type: "payment.succeeded",
          providerRef: s.id,
          fulfillmentId: s.metadata?.fulfillmentId,
          amount: s.amount_total ?? 0,
          currency: (s.currency ?? "").toUpperCase(),
        };
      }
      case "checkout.session.expired":
      case "checkout.session.async_payment_failed": {
        const s = ev.data.object;
        return {
          type: "payment.failed",
          providerRef: s.id,
          fulfillmentId: s.metadata?.fulfillmentId,
          amount: 0,
          currency: (s.currency ?? "").toUpperCase(),
        };
      }
      case "charge.refunded": {
        const c = ev.data.object;
        return {
          type: "refund.completed",
          providerRef: c.id,
          fulfillmentId: c.metadata?.fulfillmentId,
          amount: c.amount_refunded,
          currency: c.currency.toUpperCase(),
        };
      }
      default:
        return null;
    }
  },

  async refund(ref, amount) {
    const s = await stripe().checkout.sessions.retrieve(ref);
    const pi = typeof s.payment_intent === "string" ? s.payment_intent : s.payment_intent?.id;
    if (!pi) throw new Error("No payment intent to refund");
    await stripe().refunds.create({ payment_intent: pi, amount });
    return "done";
  },
};
