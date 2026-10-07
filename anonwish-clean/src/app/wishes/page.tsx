import type { Metadata } from "next";
import Link from "next/link";
import { WishCard } from "@/components/wish-card";
import { Button, buttonStyles } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/primitives";
import { listCategories, listWishes } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Browse wishes",
  description: "Browse open wishes and fulfil one anonymously.",
};

type SP = Promise<Record<string, string | undefined>>;
const pick = <T extends string>(v: string | undefined, allowed: readonly T[]) =>
  allowed.find((a) => a === v);

export default async function WishesPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const sort = pick(sp.sort, ["newest", "value", "popular"] as const);
  const status = pick(sp.status, ["open", "funded"] as const);
  const urgency = pick(sp.urgency, ["low", "medium", "high"] as const);
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);

  const [categories, { items, total, pageSize }] = await Promise.all([
    listCategories(),
    listWishes({
      q: sp.q?.slice(0, 100),
      category: sp.category,
      sort,
      status,
      urgency,
      page,
    }),
  ]);
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const href = (p: number) => {
    const q = new URLSearchParams(
      Object.entries(sp).filter(([, v]) => v) as [string, string][],
    );
    q.set("page", String(p));
    return `/wishes?${q}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Browse wishes</h1>
        <p className="mt-1 text-muted-foreground">
          Find a wish to fulfil anonymously, or filter by what matters to you.
        </p>
      </div>

      <form
        className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-6"
        role="search"
      >
        <Input
          name="q"
          placeholder="Search wishes…"
          defaultValue={sp.q}
          className="sm:col-span-2"
          aria-label="Search"
        />
        <Select name="category" defaultValue={sp.category} aria-label="Category">
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select name="urgency" defaultValue={sp.urgency} aria-label="Urgency">
          <option value="">Any urgency</option>
          <option value="high">Urgent</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </Select>
        <Select name="sort" defaultValue={sp.sort} aria-label="Sort">
          <option value="newest">Newest</option>
          <option value="value">Highest value</option>
          <option value="popular">Most popular</option>
        </Select>
        <Select name="status" defaultValue={sp.status} aria-label="Status">
          <option value="open">Open</option>
          <option value="funded">Funded</option>
        </Select>
        <Button type="submit" className="sm:col-span-6 sm:w-fit">
          Apply filters
        </Button>
      </form>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center">
          <p className="text-lg font-medium">No wishes match</p>
          <p className="mt-1 text-muted-foreground">
            Try different filters, or be the first to post one.
          </p>
          <Link href="/wishes/new" className={buttonStyles("default", "mt-4")}>
            Post a wish
          </Link>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {total} wish{total === 1 ? "" : "es"} found
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((w) => (
              <WishCard key={w.id} wish={w} />
            ))}
          </div>
        </>
      )}

      {pages > 1 && (
        <nav
          className="flex items-center justify-center gap-3 pt-4"
          aria-label="Pagination"
        >
          {page > 1 && (
            <Link href={href(page - 1)} className={buttonStyles("outline")}>
              Previous
            </Link>
          )}
          <span className="text-sm text-muted-foreground">
            Page {page} of {pages}
          </span>
          {page < pages && (
            <Link href={href(page + 1)} className={buttonStyles("outline")}>
              Next
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
