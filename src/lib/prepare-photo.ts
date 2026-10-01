// Runs only in the browser. Keeps camera images small enough for mobile uploads
// and Vercel's request body limit while retaining a real photograph.
export async function preparePhoto(file: File): Promise<File> {
  if (file.size > 20 * 1024 * 1024) throw new Error("Escolha uma foto de até 20 MB.");
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("Não foi possível abrir esta foto. Escolha uma imagem JPEG, PNG ou WebP.");
  }
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("Não foi possível preparar a fotografia.");
  }
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.85),
  );
  if (!blob || blob.size > 4 * 1024 * 1024)
    throw new Error("A foto ficou muito grande. Tente uma imagem menor.");
  return new File([blob], "excedente.jpg", { type: "image/jpeg" });
}
