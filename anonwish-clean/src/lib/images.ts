export const IMAGE_BUCKET = "wish-images";

export const imageBase = (): string =>
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${IMAGE_BUCKET}`;

/** Only accept images this user uploaded to our own bucket. */
export const validImageUrls = (urls: string[], userId: string): boolean =>
  urls.every((u) => u.startsWith(`${imageBase()}/${userId}/`));

export function sniffImageType(b: Uint8Array): { mime: string; ext: string } | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { mime: "image/jpeg", ext: "jpg" };
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return { mime: "image/png", ext: "png" };
  const tag = (o: number) => String.fromCharCode(b[o] ?? 0, b[o + 1] ?? 0, b[o + 2] ?? 0, b[o + 3] ?? 0);
  if (tag(0) === "RIFF" && tag(8) === "WEBP") return { mime: "image/webp", ext: "webp" };
  return null;
}
