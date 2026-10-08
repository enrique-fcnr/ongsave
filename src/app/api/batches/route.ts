import { NextResponse } from "next/server";
import { z } from "zod";
import { apiUser, apiError } from "@/lib/http";
import { publicationSchema } from "@/lib/ai/schema";
import { publishSurplus } from "@/server/services/rescue";
export async function POST(request: Request) {
  try {
    const { db, actor } = await apiUser(request, ["SUPERMARKET"]);
    const { payload, analysisId } = z
      .object({ payload: publicationSchema, analysisId: z.uuid() })
      .parse(await request.json());
    return NextResponse.json({ id: await publishSurplus(db, actor, payload, analysisId) });
  } catch (e) {
    return apiError(e);
  }
}
