import { randomUUID } from "node:crypto";
import { getCurrentUser } from "@/lib/auth";
import { json, sameOrigin } from "@/lib/http";
import { IMAGE_BUCKET, imageBase, sniffImageType } from "@/lib/images";
import { rateLimit } from "@/lib/ratelimit";
import { supabaseAdmin } from "@/lib/supabase/admin";

const MAX_BYTES = 2 * 1024 * 1024;

export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: "Forbidden" }, 403);
  const user = await getCurrentUser();
  if (!user) return json({ error: "Sign in required" }, 401);
  if (!rateLimit(`upload:${user.id}`, 20, 3_600_000)) return json({ error: "Too many uploads. Try again later." }, 429);

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return json({ error: "No file provided" }, 400);
  if (file.size > MAX_BYTES) return json({ error: "Images must be under 2 MB" }, 400);

  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = sniffImageType(bytes); // trust magic bytes, not the client-supplied type
  if (!kind) return json({ error: "Only JPEG, PNG or WebP images are allowed" }, 400);

  const path = `${user.id}/${randomUUID()}.${kind.ext}`;
  const { error } = await supabaseAdmin().storage.from(IMAGE_BUCKET).upload(path, bytes, { contentType: kind.mime });
  if (error) {
    console.error("Upload failed", error);
    return json({ error: "Upload failed" }, 500);
  }
  return json({ url: `${imageBase()}/${path}` });
}
