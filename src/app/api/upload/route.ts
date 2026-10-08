import { NextResponse } from "next/server";
import { apiError, apiUser } from "@/lib/http";
import { adminClient } from "@/lib/supabase/admin";
import { serverClient } from "@/lib/supabase/server";
export async function POST(request: Request) {
  try {
    const { user } = await apiUser(request, ["SUPERMARKET"]);
    // Temporário: Storage/RPC Supabase saem nas etapas 13 e 12.
    const client = await serverClient();
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size > 4 * 1024 * 1024 || file.size < 16)
      throw new Error("Escolha uma foto JPEG, PNG ou WebP de até 4 MB.");
    const bytes = Buffer.from(await file.arrayBuffer());
    const mime =
      bytes[0] === 0xff && bytes[1] === 0xd8
        ? "image/jpeg"
        : bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
          ? "image/png"
          : bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP"
            ? "image/webp"
            : null;
    if (!mime) throw new Error("Formato não suportado. Use JPEG, PNG ou WebP.");
    const path = `${user.id}/${crypto.randomUUID()}.${mime.split("/")[1]}`;
    const { error } = await client.storage
      .from("surplus")
      .upload(path, bytes, { contentType: mime });
    if (error) throw new Error(error.message);
    const { data: analysisId, error: recordError } = await adminClient().rpc("record_analysis", {
      image_path: path,
      result: null,
      provider_name: "manual",
      model_name: "human-review",
      actor_auth_id: user.id,
    });
    if (recordError) {
      await client.storage.from("surplus").remove([path]);
      throw new Error(recordError.message);
    }
    return NextResponse.json({ path, analysisId });
  } catch (e) {
    return apiError(e);
  }
}
