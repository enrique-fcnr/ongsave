import { NextResponse } from "next/server";
import { z } from "zod";
import { apiUser, apiError } from "@/lib/http";
import { analyzeSurplus } from "@/lib/ai/analyze-surplus";
import { recordAnalysis } from "@/server/services/analysis";
import { MAX_PHOTO_BYTES } from "@/server/storage";
import { photoBucket } from "@/server/bindings";
export const maxDuration = 60;
function base64(bytes: Uint8Array) {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000)
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}
export async function POST(request: Request) {
  try {
    const { db, actor } = await apiUser(request, ["SUPERMARKET"]);
    const { path } = z.object({ path: z.string().max(200) }).parse(await request.json());
    if (!path.startsWith(`${actor.authUserId}/`)) throw new Error("Fotografia não autorizada.");
    const image = await photoBucket().get(path);
    if (!image || image.size > MAX_PHOTO_BYTES)
      throw new Error("Não foi possível carregar a fotografia.");
    const result = await analyzeSurplus({
      image: base64(new Uint8Array(await image.arrayBuffer())),
      mimeType: image.httpMetadata?.contentType || "image/jpeg",
    });
    const analysisId = await recordAnalysis(
      db,
      actor,
      path,
      result.analysis,
      result.provider,
      result.model,
    );
    return NextResponse.json({ ...result, analysisId });
  } catch (e) {
    return apiError(e);
  }
}
