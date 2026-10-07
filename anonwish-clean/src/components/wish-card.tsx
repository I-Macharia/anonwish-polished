import Link from "next/link";
import { formatRange } from "@/lib/money";
import type { PublicWish } from "@/lib/public-wish";
import { Badge } from "./ui/primitives";

const statusStyle: Record<string, string> = {
  open: "",
  funded: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100",
  fulfilled: "bg-sky-100 text-sky-900 dark:bg-sky-900/40 dark:text-sky-100",
  cancelled: "bg-muted text-muted-foreground",
  expired: "bg-muted text-muted-foreground",
};

export function WishCard({ wish }: { wish: PublicWish }) {
  return (
    <Link
      href={`/wishes/${wish.id}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition hover:shadow-md hover:border-primary/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
    >
      {wish.imageUrls[0] ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={wish.imageUrls[0]}
          alt=""
          loading="lazy"
          className="h-40 w-full object-cover transition group-hover:scale-[1.02]"
        />
      ) : (
        <div className="flex h-40 items-center justify-center bg-muted text-3xl text-muted-foreground/60" aria-hidden>
          ✦
        </div>
      )}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex flex-wrap gap-1.5">
          <Badge>{wish.category}</Badge>
          {wish.urgency === "high" && (
            <Badge className="bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
              Urgent
            </Badge>
          )}
          {wish.status !== "open" && (
            <Badge className={`capitalize ${statusStyle[wish.status] ?? ""}`}>
              {wish.status}
            </Badge>
          )}
        </div>
        <h3 className="font-semibold leading-snug group-hover:text-primary transition-colors">
          {wish.title}
        </h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">{wish.description}</p>
        <div className="mt-auto flex items-center justify-between pt-2 text-sm">
          <span className="font-medium">{formatRange(wish.estimatedMin, wish.estimatedMax, wish.currency)}</span>
          {wish.viewCount > 0 && (
            <span className="text-xs text-muted-foreground">{wish.viewCount} view{wish.viewCount === 1 ? "" : "s"}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
