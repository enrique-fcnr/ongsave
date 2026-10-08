import "server-only";
import { NextResponse } from "next/server";
import { getDb } from "@/server/db/client";
import { getAuth } from "@/server/auth";
import { isConfigured } from "@/server/config";
import { loadActor } from "@/server/permissions";
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
  // Sem banco configurado não existe sessão possível.
  if (!isConfigured()) throw new Error("Faça login para continuar.");
  const db = getDb();
  const session = await getAuth().api.getSession({ headers: request.headers });
  if (!session) throw new Error("Faça login para continuar.");
  const actor = await loadActor(db, session.user.id);
  if (!actor || (allowed && !allowed.includes(actor.role)))
    throw new Error("Seu perfil não pode realizar esta ação.");
  return { db, user: session.user, actor };
}
export function apiError(error: unknown) {
  return NextResponse.json(
    {
      error: error instanceof Error ? error.message : "Não foi possível concluir. Tente novamente.",
    },
    { status: 400 },
  );
}
