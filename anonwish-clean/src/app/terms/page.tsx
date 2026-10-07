import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Service" };

export default function Terms() {
  return (
    <article className="mx-auto max-w-2xl space-y-4 leading-relaxed">
      <h1 className="text-3xl font-bold">Terms of Service</h1>
      <p className="text-sm text-muted-foreground">Template for the MVP. Have qualified counsel review it before launch. Last updated: replace with launch date.</p>
      <h2 className="text-xl font-semibold">What AnonWish is</h2>
      <p>AnonWish is a platform where people publish wishes and other people fund them anonymously. AnonWish is not a bank, money transmitter, charity or escrow agent. Payments are processed by third-party providers. Gifts are voluntary and are not donations to a registered charity unless stated.</p>
      <h2 className="text-xl font-semibold">Wishers</h2>
      <p>You must give truthful information, post only wishes you genuinely need, and not include links, contact details or requests for off-platform payment. We may remove any wish. Funded wishes are fulfilled by a purchase or gift card arranged by us, or by another method we verify. We do not guarantee that a wish will be funded.</p>
      <h2 className="text-xl font-semibold">Donors</h2>
      <p>Payments are final once a wish is fulfilled. Before fulfilment we may refund a payment if we suspect fraud, if the wish is removed, or if two donors fund the same wish. Refund timing depends on your payment provider.</p>
      <h2 className="text-xl font-semibold">Fraud prevention</h2>
      <p>We moderate wishes, rate-limit activity, and may delay or decline fulfilment, request verification, or suspend accounts to prevent fraud and abuse. Wish value limits apply during the MVP.</p>
      <h2 className="text-xl font-semibold">Liability</h2>
      <p>The service is provided as is. To the extent permitted by law, we are not liable for indirect losses, or for the acts of wishers, donors or payment providers.</p>
      <h2 className="text-xl font-semibold">Contact</h2>
      <p>Replace with your operating entity name, address and support email.</p>
    </article>
  );
}
