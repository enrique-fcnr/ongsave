import { NextResponse } from "next/server";
import { getDb } from "@/server/db/client";
import { getAuth } from "@/server/auth";
import { loadActor } from "@/server/permissions";
import { canReadPhoto } from "@/server/storage";
import { photoBucket } from "@/server/bindings";
import { operationalTime } from "@/server/db/time";
const deny = (status: number, error: string) => NextResponse.json({ error }, { status });
export async function GET(request: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const db = getDb();
  const session = await getAuth().api.getSession({ headers: request.headers });
  if (!session) return deny(401, "Faça login para continuar.");
  const actor = await loadActor(db, session.user.id);
  if (!actor) return deny(401, "Faça login para continuar.");
  const key = (await params).key.map(decodeURIComponent).join("/");
  if (!(await canReadPhoto(db, actor, key, operationalTime())))
    return deny(403, "Você não tem acesso a esta fotografia.");
  const object = await photoBucket().get(key);
  if (!object) return deny(404, "Fotografia não encontrada.");
  return new Response(object.body, {
    headers: {
      "Content-Type": object.httpMetadata?.contentType || "application/octet-stream",
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
