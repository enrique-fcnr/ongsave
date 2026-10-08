import { NextResponse } from "next/server";
import { z } from "zod";
import { apiUser, apiError } from "@/lib/http";
import { publicationSchema } from "@/lib/ai/schema";
import { publishSurplus } from "@/server/services/rescue";
import { notify } from "@/server/realtime/notify";
export async function POST(request: Request) {
  try {
    const { db, actor } = await apiUser(request, ["SUPERMARKET"]);
    const { payload, analysisId } = z
      .object({ payload: publicationSchema, analysisId: z.uuid() })
      .parse(await request.json());
    const id = await publishSurplus(db, actor, payload, analysisId);
    notify([...actor.orgIds.map((org) => `org:${org}`), "ngos"]);
    return NextResponse.json({ id });
  } catch (e) {
    return apiError(e);
  }
}
