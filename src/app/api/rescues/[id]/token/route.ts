import { NextResponse } from "next/server";
import { apiUser, apiError } from "@/lib/http";
import { deliveryToken } from "@/server/services/rescue";
type Context = { params: Promise<{ id: string }> };
// POST so the same-origin check in apiUser applies to reading the code.
export async function POST(request: Request, { params }: Context) {
  try {
    const { db, actor } = await apiUser(request);
    return NextResponse.json({ token: await deliveryToken(db, actor, (await params).id) });
  } catch (e) {
    return apiError(e);
  }
}
