// Private surplus photos in R2 (former Supabase Storage bucket "surplus").
import { eq } from "drizzle-orm";
import type { Db } from "./db/client";
import { rescues, surplusBatches } from "./db/schema";
import { canReadBatch, type Actor } from "./permissions";
import { recordAnalysis } from "./services/analysis";

export const MAX_PHOTO_BYTES = 4 * 1024 * 1024;
const PNG = [137, 80, 78, 71, 13, 10, 26, 10];
const ascii = (bytes: Uint8Array, from: number, to: number) =>
  String.fromCharCode(...bytes.subarray(from, to));

// Type comes from the file content, never from the name or the browser's header.
export function detectImageType(bytes: Uint8Array) {
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return "image/jpeg";
  if (PNG.every((b, i) => bytes[i] === b)) return "image/png";
  if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 12) === "WEBP") return "image/webp";
  return null;
}

// Policy upload_own_image: only a supermarket, only into its own folder, then the
// server records the upload as a manual analysis (same as before).
export async function uploadPhoto(db: Db, bucket: R2Bucket, actor: Actor, file: unknown) {
  if (actor.role !== "SUPERMARKET") throw new Error("Seu perfil não pode realizar esta ação.");
  if (!(file instanceof File) || file.size > MAX_PHOTO_BYTES || file.size < 16)
    throw new Error("Escolha uma foto JPEG, PNG ou WebP de até 4 MB.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const mime = detectImageType(bytes);
  if (!mime) throw new Error("Formato não suportado. Use JPEG, PNG ou WebP.");
  const path = `${actor.authUserId}/${crypto.randomUUID()}.${mime.split("/")[1]}`;
  await bucket.put(path, bytes, { httpMetadata: { contentType: mime } });
  try {
    const analysisId = await recordAnalysis(db, actor, path, null, "manual", "human-review");
    return { path, analysisId };
  } catch (error) {
    await bucket.delete(path);
    throw error;
  }
}

// Policy read_surplus_image: own folder, or a batch using this image that the actor can read.
export async function canReadPhoto(db: Db, actor: Actor, key: string, now: Date) {
  if (key.startsWith(`${actor.authUserId}/`)) return true;
  const rows = await db
    .select({ batch: surplusBatches, rescue: rescues })
    .from(surplusBatches)
    .leftJoin(rescues, eq(rescues.batch_id, surplusBatches.id))
    .where(eq(surplusBatches.image_url, key));
  return rows.some(({ batch, rescue }) => canReadBatch(actor, batch, rescue, now));
}

// Deletes every object under `prefix`, paging through the listing (R2 deletes ≤1000 keys per call).
export async function deletePhotos(bucket: R2Bucket, prefix: string) {
  let cursor: string | undefined;
  let deleted = 0;
  do {
    const page = await bucket.list({ prefix, cursor, limit: 1000 });
    const keys = page.objects.map((o) => o.key);
    if (keys.length) await bucket.delete(keys);
    deleted += keys.length;
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
  return deleted;
}
