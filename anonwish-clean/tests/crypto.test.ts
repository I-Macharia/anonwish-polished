import { describe, expect, it } from "vitest";
import { decrypt, encrypt, hashToken, newDonorToken } from "@/lib/crypto";

describe("crypto", () => {
  it("round-trips and uses a fresh IV each time", () => {
    const a = encrypt("donor@example.com");
    expect(decrypt(a)).toBe("donor@example.com");
    expect(encrypt("donor@example.com")).not.toBe(a);
  });
  it("rejects tampered ciphertext", () => {
    const buf = Buffer.from(encrypt("x@y.com"), "base64");
    buf[buf.length - 1] = (buf[buf.length - 1] ?? 0) ^ 1;
    expect(() => decrypt(buf.toString("base64"))).toThrow();
  });
  it("hashes tokens deterministically and distinctly", () => {
    const t = newDonorToken();
    expect(hashToken(t)).toBe(hashToken(t));
    expect(hashToken(t)).not.toBe(hashToken(newDonorToken()));
    expect(hashToken(t)).not.toContain(t);
  });
});
