import Link from "next/link";
import { WishCard } from "@/components/wish-card";
import { buttonStyles } from "@/components/ui/button";
import { listWishes } from "@/lib/queries";

export default async function Home() {
  const { items } = await listWishes({ pageSize: 3 }).catch(() => ({ items: [] }));
  const steps = [
    ["Post a wish", "Describe what you need and the estimated cost. Moderators screen every wish for scams and off-platform requests."],
    ["A donor funds it", "Anyone can fulfil it with no account. We never show who they are — not to you, not to the public."],
    ["We deliver", "Funds are held securely, then the item or a gift card reaches you after verification by the platform."],
  ] as const;

  return (
    <div className="space-y-16">
      <section className="relative py-12 text-center sm:py-16">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Give without being seen.<br className="hidden sm:block" /> Receive without owing anyone.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
          AnonWish connects people who need something with people who want to help — and keeps the giver completely anonymous.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/wishes/new" className={buttonStyles("default", "px-6 py-3 text-base")}>
            Post a Wish
          </Link>
          <Link href="/wishes" className={buttonStyles("outline", "px-6 py-3 text-base")}>
            Browse Wishes
          </Link>
        </div>
      </section>

      <section aria-labelledby="how">
        <h2 id="how" className="mb-6 text-2xl font-semibold tracking-tight">How it works</h2>
        <ol className="grid gap-4 sm:grid-cols-3">
          {steps.map(([title, body], i) => (
            <li key={title} className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {i + 1}
              </span>
              <h3 className="mt-3 font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      {items.length > 0 && (
        <section aria-labelledby="recent">
          <div className="mb-6 flex items-end justify-between gap-4">
            <h2 id="recent" className="text-2xl font-semibold tracking-tight">Recent wishes</h2>
            <Link href="/wishes" className="text-sm font-medium text-primary hover:underline">
              See all →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((w) => (
              <WishCard key={w.id} wish={w} />
            ))}
          </div>
        </section>
      )}

      <section className="rounded-xl border border-border bg-muted/40 px-6 py-10 text-center">
        <h2 className="text-xl font-semibold">Ready to help or be helped?</h2>
        <p className="mx-auto mt-2 max-w-lg text-muted-foreground">
          Browse open wishes or post your own. Donors stay anonymous. No public profiles. No social pressure.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/wishes" className={buttonStyles("default")}>Browse open wishes</Link>
          <Link href="/wishes/new" className={buttonStyles("outline")}>Post a wish</Link>
        </div>
      </section>
    </div>
  );
}
