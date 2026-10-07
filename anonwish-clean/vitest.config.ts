import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    environment: "node",
    env: {
      DONOR_HASH_SECRET: "test-donor-secret",
      RECEIPT_ENCRYPTION_KEY: Buffer.from("0123456789abcdef0123456789abcdef").toString("base64"),
      STRIPE_SECRET_KEY: "sk_test_dummy",
      STRIPE_WEBHOOK_SECRET: "whsec_test_secret",
      PAYSTACK_SECRET_KEY: "sk_paystack_test",
      FLUTTERWAVE_SECRET_KEY: "flw_test",
      FLUTTERWAVE_WEBHOOK_HASH: "flw-hash-secret",
      MPESA_CALLBACK_SECRET: "mpesa-cb-secret",
      NEXT_PUBLIC_SITE_URL: "https://anonwish.test",
    },
  },
});
