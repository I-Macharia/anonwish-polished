import { getTableName } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { donorReceipts, fulfillments, wishes } from "@/db/schema";
import { publicWishColumns } from "@/lib/public-wish";

describe("donor anonymity invariants", () => {
  it("public wish queries select only wishes/categories columns", () => {
    const tables = new Set(Object.values(publicWishColumns).map((c) => getTableName(c.table)));
    expect([...tables].sort()).toEqual(["categories", "wishes"]);
  });
  it("public wish queries never expose the wisher or any donor field", () => {
    const keys = Object.keys(publicWishColumns);
    for (const banned of ["userId", "donorTokenHash", "privateMessage", "emailEncrypted", "providerRef"]) expect(keys).not.toContain(banned);
  });
  it("wishes table holds no donor columns", () => {
    expect(Object.keys(wishes)).not.toContain("donorTokenHash");
  });
  it("fulfillments store only a hashed donor token, and receipt emails live in their own table", () => {
    const cols = Object.keys(fulfillments);
    expect(cols).toContain("donorTokenHash");
    expect(cols).not.toContain("email");
    expect(Object.keys(donorReceipts)).toContain("emailEncrypted");
  });
});
