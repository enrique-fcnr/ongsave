import { NextResponse } from "next/server";
import { apiUser, apiError } from "@/lib/http";
import { reserveDonation } from "@/server/services/rescue";
type Context = { params: Promise<{ id: string }> };
export async function POST(request: Request, { params }: Context) {
  try {
    const { db, actor } = await apiUser(request);
    return NextResponse.json({ id: await reserveDonation(db, actor, (await params).id) });
  } catch (e) {
    return apiError(e);
  }
}
