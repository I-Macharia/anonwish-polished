import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function Privacy() {
  return (
    <article className="mx-auto max-w-2xl space-y-4 leading-relaxed">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground">Template for the MVP. Have qualified counsel review it before launch.</p>
      <h2 className="text-xl font-semibold">How donor anonymity works</h2>
      <p>Donors are anonymous to wishers and the public: no donor name, account or contact detail appears on any wish page or public response. Donors do not need an account. We store a keyed hash of an anonymous session token so a donor can see their own payment status. If a donor gives an email for a receipt, we store it encrypted, never show it to wishers, and delete it once the receipt is sent.</p>
      <p>Anonymity is toward wishers and the public, not toward everyone. Our payment providers process the donor payment details, and authorised administrators and legal authorities may be able to access payment records where required by law.</p>
      <h2 className="text-xl font-semibold">What we collect from wishers</h2>
      <p>Email address, optional name, wish content and images, and basic usage data such as view counts. We use it to run the service, prevent fraud and contact you about your wishes.</p>
      <h2 className="text-xl font-semibold">Your rights</h2>
      <p>You can delete your account from your dashboard at any time. This erases your personal data and the content of your wishes. We keep minimal payment records where the law requires it. You may also request access to or correction of your data by contacting us.</p>
      <h2 className="text-xl font-semibold">Processors</h2>
      <p>Supabase (database, authentication, storage), Vercel (hosting), Resend (email), and payment providers such as Stripe, Flutterwave, Paystack and Safaricom M-Pesa.</p>
      <h2 className="text-xl font-semibold">Contact</h2>
      <p>Replace with your data controller details and support email.</p>
    </article>
  );
}
