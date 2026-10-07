import { UserError } from "./errors";

/** CSRF defense for cookie-authenticated or abuse-prone POST/PATCH/DELETE routes (not webhooks). */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host === (req.headers.get("x-forwarded-host") ?? req.headers.get("host"));
  } catch {
    return false;
  }
}

export const json = (body: unknown, status = 200): Response => Response.json(body, { status });

export function errorResponse(e: unknown): Response {
  if (e instanceof UserError) return json({ error: e.message }, e.status);
  console.error(e);
  return json({ error: "Something went wrong. Please try again." }, 500);
}
