import { NextResponse } from "next/server";
import { z } from "zod";
import { apiUser, apiError } from "@/lib/http";
import { adminClient } from "@/lib/supabase/admin";
import { analyzeSurplus } from "@/lib/ai/analyze-surplus";
export const maxDuration = 60;
export async function POST(request: Request) {
  try {
    const { client, user } = await apiUser(request, ["SUPERMARKET"]);
    const { path } = z.object({ path: z.string().max(200) }).parse(await request.json());
    if (!path.startsWith(`${user.id}/`)) throw new Error("Fotografia não autorizada.");
    const { data: image, error } = await client.storage.from("surplus").download(path);
    if (error || !image || image.size > 4194304)
      throw new Error("Não foi possível carregar a fotografia.");
    const result = await analyzeSurplus({
      image: Buffer.from(await image.arrayBuffer()).toString("base64"),
      mimeType: image.type,
    });
    const { data: analysisId, error: recordError } = await adminClient().rpc("record_analysis", {
      image_path: path,
      result: result.analysis,
      provider_name: result.provider,
      model_name: result.model,
      actor_auth_id: user.id,
    });
    if (recordError) throw new Error(recordError.message);
    return NextResponse.json({ ...result, analysisId });
  } catch (e) {
    return apiError(e);
  }
}
