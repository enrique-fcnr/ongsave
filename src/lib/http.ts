import "server-only";
import { NextResponse } from "next/server";
import { serverClient } from "./supabase/server";
import type { Role } from "./domain";
export async function apiUser(request: Request, allowed?: Role[]) {
  const origin = request.headers.get("origin");
  if (origin) {
    // next start may reconstruct request.url with its listening hostname (localhost).
    // Host is the browser's actual destination and cannot be overridden by a cross-origin fetch.
    const destination = new URL(request.url);
    const host = request.headers.get("host");
    if (host) destination.host = host;
    if (origin !== destination.origin) throw new Error("Origem não autorizada.");
  }
  const client = await serverClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) throw new Error("Faça login para continuar.");
  const { data: profile } = await client
    .from("profiles")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();
  if (!profile || (allowed && !allowed.includes(profile.role)))
    throw new Error("Seu perfil não pode realizar esta ação.");
  return { client, user, profile };
}
export function apiError(error: unknown) {
  return NextResponse.json(
    {
      error: error instanceof Error ? error.message : "Não foi possível concluir. Tente novamente.",
    },
    { status: 400 },
  );
}
