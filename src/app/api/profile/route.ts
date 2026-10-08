import { NextResponse } from "next/server";
import { apiError, apiUser } from "@/lib/http";
import { updateOwnProfile } from "@/server/services/profile";
export async function PATCH(request: Request) {
  try {
    const { db, actor } = await apiUser(request);
    await updateOwnProfile(db, actor, await request.json());
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
