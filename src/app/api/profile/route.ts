import { NextResponse } from "next/server";
import { apiError, apiUser } from "@/lib/http";
import { updateOwnProfile } from "@/server/services/profile";
import { notify } from "@/server/realtime/notify";
import { channelsFor } from "@/server/realtime/channels";
export async function PATCH(request: Request) {
  try {
    const { db, actor } = await apiUser(request);
    await updateOwnProfile(db, actor, await request.json());
    // Preferences and availability change what this account and its organization see.
    notify(channelsFor(actor).filter((c) => c !== "ngos" && c !== "drivers"));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
