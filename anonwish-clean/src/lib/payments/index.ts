import { registerProvider } from "./router";
import { stripeProvider } from "./providers/stripe";
import { paystackProvider } from "./providers/paystack";
import { flutterwaveProvider } from "./providers/flutterwave";
import { mpesaProvider } from "./providers/mpesa";

[stripeProvider, paystackProvider, flutterwaveProvider, mpesaProvider].forEach(registerProvider);

export { getProvider, pickProvider, tryPickProvider } from "./router";
