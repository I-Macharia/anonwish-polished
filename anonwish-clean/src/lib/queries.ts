import { and, count, desc, eq, ilike, isNull, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { categories, wishes } from "@/db/schema";
import { publicWishColumns, type PublicWish } from "./public-wish";

export type ListParams = {
  q?: string;
  category?: string;
  urgency?: "low" | "medium" | "high";
  sort?: "newest" | "value" | "popular";
  status?: "open" | "funded";
  page?: number;
  pageSize?: number;
};

const escapeLike = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

export async function listWishes(p: ListParams) {
  const pageSize = p.pageSize ?? 12;
  const page = Math.max(1, p.page ?? 1);
  const term = p.q ? `%${escapeLike(p.q)}%` : null;
  const where = and(
    isNull(wishes.deletedAt),
    eq(wishes.status, p.status ?? "open"),
    p.category ? eq(categories.slug, p.category) : undefined,
    p.urgency ? eq(wishes.urgency, p.urgency) : undefined,
    term ? or(ilike(wishes.title, term), ilike(wishes.description, term)) : undefined,
  );
  // "value" sorts by raw amount; cross-currency ordering is approximate until FX is added.
  const order =
    p.sort === "value" ? desc(wishes.estimatedMax) : p.sort === "popular" ? desc(wishes.viewCount) : desc(wishes.createdAt);

  const [items, totals] = await Promise.all([
    db
      .select(publicWishColumns)
      .from(wishes)
      .innerJoin(categories, eq(wishes.categoryId, categories.id))
      .where(where)
      .orderBy(order)
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ n: count() }).from(wishes).innerJoin(categories, eq(wishes.categoryId, categories.id)).where(where),
  ]);
  return { items: items satisfies PublicWish[], total: totals[0]?.n ?? 0, pageSize, page };
}

export async function getPublicWish(id: string): Promise<PublicWish | null> {
  if (!z.string().uuid().safeParse(id).success) return null;
  const [row] = await db
    .select(publicWishColumns)
    .from(wishes)
    .innerJoin(categories, eq(wishes.categoryId, categories.id))
    .where(and(eq(wishes.id, id), isNull(wishes.deletedAt)))
    .limit(1);
  return row && row.status !== "cancelled" ? row : null;
}

export const listCategories = () => db.select().from(categories).orderBy(categories.name);
