import { NextResponse } from "next/server";
import { apiUser, apiError } from "@/lib/http";
import { acceptMission } from "@/server/services/rescue";
type Context = { params: Promise<{ id: string }> };
export async function POST(request: Request, { params }: Context) {
  try {
    const { db, actor } = await apiUser(request);
    await acceptMission(db, actor, (await params).id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
