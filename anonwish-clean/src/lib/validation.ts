import { z } from "zod";

export const CURRENCIES = ["USD", "EUR", "GBP", "KES", "NGN", "GHS", "ZAR", "UGX", "TZS", "RWF"] as const;
export type Currency = (typeof CURRENCIES)[number];

// MVP risk cap per wish, in major units. Larger gifts need KYC (post-MVP).
export const MAX_MAJOR: Record<Currency, number> = {
  USD: 2000, EUR: 2000, GBP: 1700, KES: 250000, NGN: 3000000,
  GHS: 25000, ZAR: 35000, UGX: 7000000, TZS: 5000000, RWF: 2500000,
};

export const wishInput = z
  .object({
    title: z.string().trim().min(5, "Title must be at least 5 characters").max(120),
    description: z.string().trim().min(30, "Please describe your wish in at least 30 characters").max(3000),
    categoryId: z.coerce.number().int().positive("Choose a category"),
    estimatedMin: z.coerce.number().positive("Enter a minimum value"),
    estimatedMax: z.coerce.number().positive("Enter a maximum value"),
    currency: z.enum(CURRENCIES),
    urgency: z.enum(["low", "medium", "high"]),
    imageUrls: z.array(z.string().url()).max(3).default([]),
  })
  .superRefine((v, ctx) => {
    if (v.estimatedMax < v.estimatedMin)
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Maximum must be at least the minimum", path: ["estimatedMax"] });
    if (v.estimatedMax > MAX_MAJOR[v.currency])
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Maximum is ${MAX_MAJOR[v.currency]} ${v.currency} during the MVP`,
        path: ["estimatedMax"],
      });
  });
export type WishInput = z.infer<typeof wishInput>;

export const fulfillInput = z.object({
  wishId: z.string().uuid(),
  privateMessage: z.string().trim().max(500).optional(),
  receiptEmail: z.string().trim().email().max(200).optional(),
  phone: z.string().trim().max(20).optional(),
});

export const reportInput = z.object({
  wishId: z.string().uuid(),
  reason: z.enum(["spam", "fraud", "inappropriate", "other"]),
  details: z.string().trim().max(500).optional(),
});

/** Returns 2547XXXXXXXX / 2541XXXXXXXX or null. */
export function normalizeKenyanPhone(raw: string): string | null {
  const m = /^(?:\+?254|0)?([17]\d{8})$/.exec(raw.replace(/[\s-]/g, ""));
  return m?.[1] ? `254${m[1]}` : null;
}
