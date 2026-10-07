import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { fulfillments } from "@/db/schema";
import { buttonStyles } from "@/components/ui/button";
import { hashToken } from "@/lib/crypto";

export const metadata: Metadata = { title: "Thank you", robots: { index: false } };

export default async function Thanks({ searchParams }: { searchParams: Promise<{ f?: string; pending?: string }> }) {
  const sp = await searchParams;
  const token = (await cookies()).get("aw_donor")?.value;
  let status: string | null = null;
  if (token && sp.f && z.string().uuid().safeParse(sp.f).success) {
    const [f] = await db.select({ status: fulfillments.status, hash: fulfillments.donorTokenHash }).from(fulfillments).where(eq(fulfillments.id, sp.f)).limit(1);
    if (f && f.hash === hashToken(token)) status = f.status;
  }

  return (
    <div className="mx-auto max-w-xl space-y-4 py-10 text-center">
      <h1 className="text-3xl font-bold">Thank you</h1>
      {sp.pending === "mpesa" && status !== "paid" && <p>Check your phone and enter your M-Pesa PIN to complete the gift.</p>}
      {status === "paid" && <p>Your payment is confirmed. The wisher has been told their wish is funded, without any detail about you.</p>}
      {status === "failed" && <p role="alert">The payment did not go through. You have not been charged. You can try again from the wish page.</p>}
      {status !== "paid" && status !== "failed" && sp.pending !== "mpesa" && <p>We are confirming your payment. This can take a minute; refresh this page to check.</p>}
      <Link href="/wishes" className={buttonStyles("outline")}>Browse more wishes</Link>
    </div>
  );
}
