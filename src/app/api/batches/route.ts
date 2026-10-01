import { NextResponse } from "next/server";
import { z } from "zod";
import { apiUser, apiError } from "@/lib/http";
import { publicationSchema } from "@/lib/ai/schema";
export async function POST(request: Request) {
  try {
    const { client } = await apiUser(request, ["SUPERMARKET"]);
    const { payload, analysisId } = z
      .object({ payload: publicationSchema, analysisId: z.uuid() })
      .parse(await request.json());
    const { data: id, error } = await client.rpc("publish_surplus", {
      payload,
      analysis_id: analysisId,
    });
    if (error) throw new Error(error.message);
    return NextResponse.json({ id });
  } catch (e) {
    return apiError(e);
  }
}
