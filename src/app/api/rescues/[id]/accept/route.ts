import { NextResponse } from "next/server";
import { apiUser, apiError } from "@/lib/http";
import { acceptMission } from "@/server/services/rescue";
import { notify } from "@/server/realtime/notify";
import { rescueChannels } from "@/server/realtime/channels";
import { rescueScope } from "@/server/realtime/scope";

type Context = { params: Promise<{ id: string }> };
export async function POST(request: Request, { params }: Context) {
  try {
    const { db, actor } = await apiUser(request);
    const { id } = await params;
    await acceptMission(db, actor, id);
    notify(rescueChannels((await rescueScope(db, id))!, "drivers"));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
