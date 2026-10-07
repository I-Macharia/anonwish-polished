import { cookies } from "next/headers";
import { newDonorToken } from "@/lib/crypto";
import { startFulfillment } from "@/lib/fulfillment";
import { errorResponse, json, sameOrigin } from "@/lib/http";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { fulfillInput, normalizeKenyanPhone } from "@/lib/validation";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: "Forbidden" }, 403);
  if (!rateLimit(`fulfill:${clientIp(req)}`, 10, 3_600_000)) return json({ error: "Too many attempts. Try again later." }, 429);

  const parsed = fulfillInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, 400);

  let phone: string | null = null;
  if (parsed.data.phone) {
    phone = normalizeKenyanPhone(parsed.data.phone);
    if (!phone) return json({ error: "Enter a valid Kenyan phone number, e.g. 0712345678" }, 400);
  }

  // Anonymous session token: lets the donor see their own payment status without an account.
  const store = await cookies();
  let token = store.get("aw_donor")?.value;
  if (!token) {
    token = newDonorToken();
    store.set("aw_donor", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  try {
    return json(await startFulfillment({ ...parsed.data, phone, donorToken: token }));
  } catch (e) {
    return errorResponse(e);
  }
}
