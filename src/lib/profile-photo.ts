import "server-only";
import sharp from "sharp";

export function profilePhotoPath(userId: string, avatarUrl?: string | null) {
  const match = avatarUrl?.match(/^\/api\/profile\/photo\?v=([0-9a-f-]{36})$/);
  return match ? `${userId}/${match[1]}.webp` : null;
}

export async function prepareProfilePhoto(file: File) {
  if (!file.size || file.size > 4 * 1024 * 1024)
    throw new Error("Escolha uma foto JPEG, PNG ou WebP de até 4 MB.");
  try {
    const image = sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 20_000_000 });
    const metadata = await image.metadata();
    if (!["jpeg", "png", "webp"].includes(metadata.format || "") || (metadata.pages || 1) > 1)
      throw new Error("Formato inválido");
    return await image.rotate().resize(512, 512, { fit: "cover" }).webp({ quality: 85 }).toBuffer();
  } catch {
    throw new Error("Não foi possível abrir esta foto. Escolha uma imagem JPEG, PNG ou WebP.");
  }
}
