import { applyEvent } from "@/lib/fulfillment";
import { getProvider } from "@/lib/payments";
import { PROVIDER_IDS, type NormalizedEvent, type ProviderId } from "@/lib/payments/types";

export const runtime = "nodejs"; // signature checks need the raw body and node:crypto

export async function POST(req: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider: id } = await params;
  if (!PROVIDER_IDS.includes(id as ProviderId)) return new Response("Not found", { status: 404 });

  let provider;
  try {
    provider = getProvider(id as ProviderId);
  } catch {
    return new Response("Not found", { status: 404 });
  }

  const raw = await req.text();
  let event: NormalizedEvent | null;
  try {
    event = await provider.parseWebhook(raw, req.headers, new URL(req.url));
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }
  if (!event) return new Response("ignored");

  try {
    await applyEvent(provider.id, event);
  } catch (e) {
    console.error("Webhook processing failed", e);
    return new Response("error", { status: 500 }); // provider will retry; applyEvent is idempotent
  }
  return new Response("ok");
}
