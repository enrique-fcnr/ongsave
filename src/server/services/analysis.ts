// private.record_analysis: provenance (provider/model) always comes from the server.
import { runAtomic, type Db } from "../db/client";
import type { Actor } from "../permissions";

export async function recordAnalysis(
  db: Db,
  actor: Actor,
  imagePath: string,
  result: unknown,
  provider: string,
  model: string,
) {
  if (actor.role !== "SUPERMARKET") throw new Error("Perfil não autorizado");
  if (!imagePath.startsWith(`${actor.authUserId}/`))
    throw new Error("Imagem não pertence ao usuário");
  const id = crypto.randomUUID();
  await runAtomic(db, [
    db.$client
      .prepare(
        "INSERT INTO analyses(id,profile_id,image_url,analysis,provider,model) VALUES(?,?,?,?,?,?)",
      )
      .bind(
        id,
        actor.profileId,
        imagePath,
        result == null ? null : JSON.stringify(result),
        provider,
        model,
      ),
  ]);
  return id;
}
