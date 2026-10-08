import { NextResponse } from "next/server";
import { apiError, apiUser } from "@/lib/http";
import { uploadPhoto } from "@/server/storage";
import { photoBucket } from "@/server/bindings";
export async function POST(request: Request) {
  try {
    const { db, actor } = await apiUser(request, ["SUPERMARKET"]);
    const form = await request.formData();
    return NextResponse.json(await uploadPhoto(db, photoBucket(), actor, form.get("file")));
  } catch (e) {
    return apiError(e);
  }
}
