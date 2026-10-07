import { categories, wishes } from "@/db/schema";

/**
 * The ONLY column set used for public wish responses and pages.
 * Deliberately excludes userId and anything from fulfillments / donor_receipts.
 * A unit test pins this list so donor identity cannot leak by accident.
 */
export const publicWishColumns = {
  id: wishes.id,
  title: wishes.title,
  description: wishes.description,
  category: categories.name,
  categorySlug: categories.slug,
  estimatedMin: wishes.estimatedMin,
  estimatedMax: wishes.estimatedMax,
  currency: wishes.currency,
  urgency: wishes.urgency,
  status: wishes.status,
  imageUrls: wishes.imageUrls,
  viewCount: wishes.viewCount,
  createdAt: wishes.createdAt,
} as const;

export type PublicWish = {
  id: string;
  title: string;
  description: string;
  category: string;
  categorySlug: string;
  estimatedMin: number;
  estimatedMax: number;
  currency: string;
  urgency: "low" | "medium" | "high";
  status: "open" | "funded" | "fulfilled" | "cancelled" | "expired";
  imageUrls: string[];
  viewCount: number;
  createdAt: Date;
};
