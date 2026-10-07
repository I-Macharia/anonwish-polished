export type ProviderId = "stripe" | "flutterwave" | "paystack" | "mpesa";
export const PROVIDER_IDS: readonly ProviderId[] = ["stripe", "flutterwave", "paystack", "mpesa"];

export interface CheckoutInput {
  fulfillmentId: string;
  wishId: string;
  amount: number; // minor units
  currency: string;
  returnUrl: string;
  cancelUrl: string;
  receiptEmail?: string;
  phone?: string; // normalized 2547XXXXXXXX, required for M-Pesa STK push
}

export interface CheckoutResult {
  providerRef: string;
  redirectUrl: string;
}

export interface NormalizedEvent {
  type: "payment.succeeded" | "payment.failed" | "refund.completed";
  providerRef: string;
  fulfillmentId?: string; // absent when the provider only echoes its own reference (M-Pesa)
  amount: number; // minor units
  currency: string;
}

export interface PaymentProvider {
  id: ProviderId;
  currencies: readonly string[];
  isConfigured(): boolean;
  createCheckout(input: CheckoutInput): Promise<CheckoutResult>;
  /** Verify authenticity and normalize. Return null for irrelevant events; throw on failed verification. */
  parseWebhook(rawBody: string, headers: Headers, url: URL): Promise<NormalizedEvent | null>;
  /** "manual" means the provider cannot refund via API; an admin must refund out-of-band. */
  refund(providerRef: string, amount?: number): Promise<"done" | "manual">;
}
