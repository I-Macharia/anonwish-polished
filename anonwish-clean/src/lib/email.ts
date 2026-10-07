export async function sendEmail(to: string, subject: string, text: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn(`[email skipped: RESEND_API_KEY not set] ${subject}`);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.EMAIL_FROM ?? "AnonWish <onboarding@resend.dev>", to, subject, text }),
  });
  if (!res.ok) console.error("Email send failed", res.status);
}
