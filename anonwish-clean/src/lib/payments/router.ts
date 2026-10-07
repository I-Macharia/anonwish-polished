import type { PaymentProvider, ProviderId } from "./types";

const registry = new Map<ProviderId, PaymentProvider>();

export function registerProvider(p: PaymentProvider): void {
  registry.set(p.id, p);
}

export function getProvider(id: ProviderId): PaymentProvider {
  const p = registry.get(id);
  if (!p || !p.isConfigured()) throw new Error(`Payment provider unavailable: ${id}`);
  return p;
}

// First match wins. Adding a market = add a provider + one line here.
const PREFERENCE: Record<string, ProviderId[]> = {
  KES: ["mpesa", "paystack", "flutterwave", "stripe"],
  NGN: ["paystack", "flutterwave", "stripe"],
  GHS: ["paystack", "flutterwave", "stripe"],
  ZAR: ["paystack", "flutterwave", "stripe"],
  UGX: ["flutterwave", "stripe"],
  TZS: ["flutterwave", "stripe"],
  RWF: ["flutterwave", "stripe"],
};
const DEFAULT: ProviderId[] = ["stripe", "flutterwave"];

export function pickProvider(currency: string): PaymentProvider {
  const enabled = (process.env.PAYMENTS_ENABLED ?? "").split(",").map((s) => s.trim());
  for (const id of PREFERENCE[currency] ?? DEFAULT) {
    const p = registry.get(id);
    if (p && enabled.includes(id) && p.isConfigured() && p.currencies.includes(currency)) return p;
  }
  throw new Error(`No payment provider available for ${currency}`);
}

export function tryPickProvider(currency: string): PaymentProvider | null {
  try {
    return pickProvider(currency);
  } catch {
    return null;
  }
}
