export type ModerationResult = { ok: true } | { ok: false; reason: string };

// Blocks off-platform payment solicitation and contact details, the main fraud vectors.
const RULES: [RegExp, string][] = [
  [/https?:\/\/|www\./i, "Links are not allowed in wishes."],
  [/[\w.+-]+@[\w-]+\.[\w.-]+/, "Email addresses are not allowed in wishes."],
  [/(?:\+?\d[\s().-]?){8,}/, "Phone numbers are not allowed in wishes."],
  [/\b(?:whatsapp|telegram|signal)\b/i, "Please do not ask people to contact you elsewhere."],
  [/\b(?:western union|moneygram|bitcoin|usdt|crypto wallet|cash ?app|paypal|send (?:me )?money)\b/i, "Please do not ask for money transfers outside the platform."],
];

/** Async on purpose: swap the body for an AI moderation call later without touching callers. */
export async function moderate(text: string): Promise<ModerationResult> {
  for (const [re, reason] of RULES) if (re.test(text)) return { ok: false, reason };
  return { ok: true };
}
