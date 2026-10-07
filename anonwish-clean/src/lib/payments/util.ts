import { timingSafeEqual } from "node:crypto";

export function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Payer email for providers that insist on one. Never a real donor address unless they opted in for a receipt. */
export const payerEmail = (fulfillmentId: string, receiptEmail?: string): string =>
  receiptEmail ?? `donor-${fulfillmentId}@${process.env.ANON_EMAIL_DOMAIN ?? "example.com"}`;
