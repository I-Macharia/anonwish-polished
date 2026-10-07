import type { Metadata } from "next";
import Link from "next/link";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db";
import { fulfillments, wishes } from "@/db/schema";
import { DeleteAccountButton, DeleteWishButton } from "@/components/dashboard-actions";
import { buttonStyles } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/primitives";
import { requireUser } from "@/lib/auth";
import { formatRange } from "@/lib/money";

export const metadata: Metadata = { title: "My wishes" };

export default async function Dashboard() {
  const user = await requireUser();
  const mine = await db
    .select()
    .from(wishes)
    .where(and(eq(wishes.userId, user.id), isNull(wishes.deletedAt)))
    .orderBy(desc(wishes.createdAt));

  // Donors stay anonymous: only the optional private message is exposed, never any donor field.
  const funded = mine.filter((w) => w.status === "funded" || w.status === "fulfilled").map((w) => w.id);
  const messages = funded.length
    ? await db
        .select({ wishId: fulfillments.wishId, message: fulfillments.privateMessage })
        .from(fulfillments)
        .where(and(inArray(fulfillments.wishId, funded), eq(fulfillments.status, "paid")))
    : [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My wishes</h1>
        <Link href="/wishes/new" className={buttonStyles()}>Post a wish</Link>
      </div>

      {mine.length === 0 && <p className="text-muted-foreground">You have not posted any wishes yet.</p>}
      <div className="space-y-3">
        {mine.map((w) => {
          const note = messages.find((m) => m.wishId === w.id)?.message;
          return (
            <Card key={w.id} className="space-y-2">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <Link href={`/wishes/${w.id}`} className="font-semibold hover:underline">{w.title}</Link>
                  <p className="text-sm text-muted-foreground">{formatRange(w.estimatedMin, w.estimatedMax, w.currency)}</p>
                </div>
                <Badge className="capitalize">{w.status}</Badge>
              </div>
              {w.status === "funded" && <p className="text-sm">Funded by an anonymous donor. We will contact you about delivery.</p>}
              {note && <p className="rounded-md bg-muted p-3 text-sm">Message from your donor: {note}</p>}
              {w.status === "open" && (
                <div className="flex gap-2">
                  <Link href={`/wishes/${w.id}/edit`} className={buttonStyles("outline")}>Edit</Link>
                  <DeleteWishButton wishId={w.id} />
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <section className="space-y-2 border-t border-border pt-6">
        <h2 className="text-lg font-semibold">Privacy</h2>
        <p className="text-sm text-muted-foreground">Deleting your account erases your personal data and the content of your wishes.</p>
        <DeleteAccountButton />
      </section>
    </div>
  );
}
