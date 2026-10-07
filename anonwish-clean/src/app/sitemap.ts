import type { MetadataRoute } from "next";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { wishes } from "@/db/schema";
import { siteUrl } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const open = await db
    .select({ id: wishes.id, updatedAt: wishes.updatedAt })
    .from(wishes)
    .where(and(eq(wishes.status, "open"), isNull(wishes.deletedAt)))
    .orderBy(desc(wishes.createdAt))
    .limit(1000)
    .catch(() => []);
  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/wishes`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${base}/terms` },
    { url: `${base}/privacy` },
    ...open.map((w) => ({ url: `${base}/wishes/${w.id}`, lastModified: w.updatedAt })),
  ];
}
