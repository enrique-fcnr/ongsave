import { NextResponse } from "next/server";
import { apiError, apiUser } from "@/lib/http";
import { adminClient } from "@/lib/supabase/admin";
import { prepareProfilePhoto, profilePhotoPath } from "@/lib/profile-photo";

export async function GET(request: Request) {
  try {
    const { user, profile } = await apiUser(request);
    const path = profilePhotoPath(user.id, profile.avatar_url);
    if (!path) return new Response(null, { status: 404 });
    const { data, error } = await adminClient().storage.from("avatars").download(path);
    if (error || !data) return new Response(null, { status: 404 });
    return new Response(data, {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response(null, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const { user, profile } = await apiUser(request);
    const file = (await request.formData()).get("file");
    if (!(file instanceof File)) throw new Error("Escolha uma foto para o perfil.");
    const photo = await prepareProfilePhoto(file);
    const admin = adminClient();
    const avatarUrl = `/api/profile/photo?v=${crypto.randomUUID()}`;
    const path = profilePhotoPath(user.id, avatarUrl)!;
    const { error } = await admin.storage
      .from("avatars")
      .upload(path, photo, { contentType: "image/webp" });
    if (error) throw new Error("Não foi possível enviar a foto. Tente novamente.");
    const { data, error: saveError } = await admin
      .from("profiles")
      .update({ avatar_url: avatarUrl })
      .eq("id", profile.id)
      .eq("auth_user_id", user.id)
      .select("id")
      .single();
    if (saveError || !data) {
      await admin.storage.from("avatars").remove([path]);
      throw new Error("Não foi possível salvar a foto. Tente novamente.");
    }
    const previous = profilePhotoPath(user.id, profile.avatar_url);
    if (previous) await admin.storage.from("avatars").remove([previous]);
    return NextResponse.json({ avatarUrl });
  } catch (error) {
    return apiError(error);
  }
}
