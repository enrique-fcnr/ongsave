import { NextResponse } from "next/server";
import { z } from "zod";
import { apiUser, apiError } from "@/lib/http";
import { statuses } from "@/lib/domain";
import { advanceRescue } from "@/server/services/rescue";
import { notify } from "@/server/realtime/notify";
import { rescueChannels } from "@/server/realtime/channels";
import { rescueScope } from "@/server/realtime/scope";

type Context = { params: Promise<{ id: string }> };
export async function POST(request: Request, { params }: Context) {
  try {
    const { db, actor } = await apiUser(request);
    const { status, token } = z
      .object({ status: z.enum(statuses), token: z.string().max(10).nullable().optional() })
      .parse(await request.json());
    const { id } = await params;
    const ok = await advanceRescue(db, actor, id, status, token ?? null);
    if (ok) notify(rescueChannels((await rescueScope(db, id))!));
    return NextResponse.json({ ok });
  } catch (e) {
    return apiError(e);
  }
}
