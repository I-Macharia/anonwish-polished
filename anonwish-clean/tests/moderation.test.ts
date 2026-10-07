import { describe, expect, it } from "vitest";
import { moderate } from "@/lib/moderation";

describe("moderation", () => {
  it("allows ordinary wishes", async () => {
    expect((await moderate("I need a $300 laptop to finish my course.")).ok).toBe(true);
  });
  it.each([
    "visit https://scam.example",
    "email me at a@b.com",
    "call +254 712 345 678",
    "message me on WhatsApp",
    "please send money via Western Union",
  ])("blocks: %s", async (text) => {
    expect((await moderate(text)).ok).toBe(false);
  });
});
