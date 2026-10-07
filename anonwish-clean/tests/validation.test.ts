import { describe, expect, it } from "vitest";
import { normalizeKenyanPhone, wishInput } from "@/lib/validation";

const valid = {
  title: "Laptop for coding", description: "I need a laptop to finish my bootcamp and start freelancing soon.",
  categoryId: 1, estimatedMin: 300, estimatedMax: 450, currency: "USD", urgency: "high", imageUrls: [],
};

describe("wishInput", () => {
  it("accepts a valid wish", () => expect(wishInput.safeParse(valid).success).toBe(true));
  it("rejects max below min", () => expect(wishInput.safeParse({ ...valid, estimatedMax: 100 }).success).toBe(false));
  it("enforces the per-currency MVP cap", () => expect(wishInput.safeParse({ ...valid, estimatedMax: 5000 }).success).toBe(false));
  it("rejects more than 3 images", () => {
    const urls = Array.from({ length: 4 }, (_, i) => `https://x.test/${i}.png`);
    expect(wishInput.safeParse({ ...valid, imageUrls: urls }).success).toBe(false);
  });
});

describe("normalizeKenyanPhone", () => {
  it.each([["0712345678", "254712345678"], ["+254 712 345 678", "254712345678"], ["254112345678", "254112345678"]])("%s", (i, o) =>
    expect(normalizeKenyanPhone(i)).toBe(o));
  it("rejects junk", () => expect(normalizeKenyanPhone("12345")).toBeNull());
});
