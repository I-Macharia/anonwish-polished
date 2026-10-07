import { createCipheriv, createDecipheriv, createHmac, randomBytes } from "node:crypto";
import { env } from "./env";

function key(): Buffer {
  const k = Buffer.from(env("RECEIPT_ENCRYPTION_KEY"), "base64");
  if (k.length !== 32) throw new Error("RECEIPT_ENCRYPTION_KEY must decode to 32 bytes");
  return k;
}

/** AES-256-GCM. Output: base64(iv[12] | tag[16] | ciphertext). */
export function encrypt(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), enc]).toString("base64");
}

export function decrypt(payload: string): string {
  const b = Buffer.from(payload, "base64");
  const d = createDecipheriv("aes-256-gcm", key(), b.subarray(0, 12));
  d.setAuthTag(b.subarray(12, 28));
  return Buffer.concat([d.update(b.subarray(28)), d.final()]).toString("utf8");
}

/** Keyed hash so a leaked DB cannot be used to confirm a guessed donor token. */
export function hashToken(token: string): string {
  return createHmac("sha256", env("DONOR_HASH_SECRET")).update(token).digest("hex");
}

export const newDonorToken = (): string => randomBytes(32).toString("base64url");
