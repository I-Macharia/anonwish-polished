import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { adminLogs, fulfillments, reports, wishes } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/primitives";
import { requireAdmin } from "@/lib/auth";
import { formatMoney } from "@/lib/money";
import { dismissReport, markFulfilled, refundFulfillment, removeWish } from "./actions";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

function Act({ action, id, label, variant = "outline" }: { action: (fd: FormData) => Promise<void>; id: string; label: string; variant?: "outline" | "destructive" }) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant={variant} className="px-3 py-1 text-xs">{label}</Button>
    </form>
  );
}

export default async function AdminPage() {
  await requireAdmin();
  const [openReports, paid, openWishes, logs] = await Promise.all([
    db.select({ id: reports.id, reason: reports.reason, details: reports.details, wishId: wishes.id, title: wishes.title })
      .from(reports).innerJoin(wishes, eq(reports.wishId, wishes.id)).where(eq(reports.status, "open")).orderBy(desc(reports.createdAt)).limit(50),
    db.select({ id: fulfillments.id, wishId: wishes.id, title: wishes.title, wishStatus: wishes.status, provider: fulfillments.provider, amount: fulfillments.amount, currency: fulfillments.currency })
      .from(fulfillments).innerJoin(wishes, eq(fulfillments.wishId, wishes.id)).where(eq(fulfillments.status, "paid")).orderBy(desc(fulfillments.createdAt)).limit(50),
    db.select({ id: wishes.id, title: wishes.title }).from(wishes).where(eq(wishes.status, "open")).orderBy(desc(wishes.createdAt)).limit(20),
    db.select().from(adminLogs).orderBy(desc(adminLogs.createdAt)).limit(20),
  ]);

  return (
    <div className="space-y-10">
      <h1 className="text-3xl font-bold">Admin</h1>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Open reports ({openReports.length})</h2>
        {openReports.length === 0 && <p className="text-sm text-muted-foreground">Nothing to review.</p>}
        {openReports.map((r) => (
          <Card key={r.id} className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Link href={`/wishes/${r.wishId}`} className="font-medium hover:underline">{r.title}</Link>
              <p className="text-sm text-muted-foreground capitalize">{r.reason}{r.details ? `: ${r.details}` : ""}</p>
            </div>
            <div className="flex gap-2"><Act action={dismissReport} id={r.id} label="Dismiss" /><Act action={removeWish} id={r.wishId} label="Remove wish" variant="destructive" /></div>
          </Card>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Paid fulfillments ({paid.length})</h2>
        <p className="text-sm text-muted-foreground">M-Pesa refunds are manual: send the refund from the M-Pesa portal first, then click Refund to record it.</p>
        {paid.map((p) => (
          <Card key={p.id} className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Link href={`/wishes/${p.wishId}`} className="font-medium hover:underline">{p.title}</Link>
              <p className="text-sm text-muted-foreground">{formatMoney(p.amount, p.currency)} via {p.provider}. Wish is {p.wishStatus}.</p>
            </div>
            <div className="flex gap-2">
              {p.wishStatus === "funded" && <Act action={markFulfilled} id={p.wishId} label="Mark fulfilled" />}
              {p.wishStatus !== "fulfilled" && <Act action={refundFulfillment} id={p.id} label="Refund" variant="destructive" />}
            </div>
          </Card>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Moderate recent open wishes</h2>
        {openWishes.map((w) => (
          <Card key={w.id} className="flex items-center justify-between gap-3">
            <Link href={`/wishes/${w.id}`} className="hover:underline">{w.title}</Link>
            <Act action={removeWish} id={w.id} label="Remove" variant="destructive" />
          </Card>
        ))}
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Audit log</h2>
        <ul className="space-y-1 text-sm text-muted-foreground">
          {logs.map((l) => <li key={l.id}>{l.createdAt.toISOString()} · {l.adminId ? "admin" : "system"} · {l.action} · {l.targetType}:{l.targetId.slice(0, 8)}</li>)}
        </ul>
      </section>
    </div>
  );
}
