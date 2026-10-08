import { NextResponse } from "next/server";
import { z } from "zod";
import { apiUser, apiError } from "@/lib/http";
import { markNotificationRead } from "@/server/services/rescue";
import { notify } from "@/server/realtime/notify";
export async function POST(request: Request) {
  try {
    const { db, actor } = await apiUser(request);
    const { id } = z.object({ id: z.string().max(64) }).parse(await request.json());
    await markNotificationRead(db, actor, id);
    notify([`profile:${actor.profileId}`]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
