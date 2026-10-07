import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { wishes } from "@/db/schema";
import { FulfillPanel } from "@/components/fulfill-panel";
import { ReportButton } from "@/components/report-button";
import { buttonStyles } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/primitives";
import { getCurrentUser } from "@/lib/auth";
import { formatMoney, formatRange } from "@/lib/money";
import { tryPickProvider } from "@/lib/payments";
import { getPublicWish } from "@/lib/queries";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const wish = await getPublicWish((await params).id);
  if (!wish) return { title: "Wish not found" };
  const description = wish.description.slice(0, 160);
  return {
    title: wish.title,
    description,
    openGraph: { title: wish.title, description, type: "article", images: wish.imageUrls.slice(0, 1) },
  };
}

export default async function WishPage({ params }: Props) {
  const { id } = await params;
  const wish = await getPublicWish(id);
  if (!wish) notFound();

  void db.update(wishes).set({ viewCount: sql`${wishes.viewCount} + 1` }).where(eq(wishes.id, wish.id)).catch(() => {});

  const user = await getCurrentUser();
  const isOwner = user
    ? (await db.select({ id: wishes.id }).from(wishes).where(and(eq(wishes.id, wish.id), eq(wishes.userId, user.id))).limit(1)).length > 0
    : false;
  const provider = wish.status === "open" ? tryPickProvider(wish.currency) : null;

  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Badge>{wish.category}</Badge>
          <Badge className="capitalize">{wish.urgency} urgency</Badge>
          <Badge className="capitalize">{wish.status}</Badge>
        </div>
        <h1 className="text-3xl font-bold">{wish.title}</h1>
        <p className="text-lg font-medium">{formatRange(wish.estimatedMin, wish.estimatedMax, wish.currency)}</p>
      </header>

      {wish.imageUrls.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          {wish.imageUrls.map((u) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={u} src={u} alt={`Photo for ${wish.title}`} className="h-48 w-full rounded-lg object-cover" />
          ))}
        </div>
      )}

      <p className="whitespace-pre-wrap leading-relaxed">{wish.description}</p>

      {isOwner && <Link href={`/wishes/${wish.id}/edit`} className={buttonStyles("outline")}>Edit wish</Link>}

      {wish.status === "open" &&
        (provider ? (
          <FulfillPanel wishId={wish.id} amountLabel={formatMoney(wish.estimatedMax, wish.currency)} needsPhone={provider.id === "mpesa"} />
        ) : (
          <Card>No payment method is available for {wish.currency} yet.</Card>
        ))}
      {wish.status === "funded" && <Card>This wish has been funded by an anonymous donor and is being fulfilled.</Card>}
      {wish.status === "fulfilled" && <Card>This wish has been fulfilled. Thank you to its anonymous donor.</Card>}

      <ReportButton wishId={wish.id} />
    </article>
  );
}
