import { NextResponse } from "next/server";
import { apiUser, apiError } from "@/lib/http";
import { adminClient } from "@/lib/supabase/admin";
export async function POST(request: Request) {
  try {
    if (process.env.ENABLE_DEMO_MODE !== "true") throw new Error("Modo demonstração desativado.");
    const { user, actor } = await apiUser(request, ["SUPERMARKET"]);
    if (actor.email !== "mercado@ongsave.demo")
      throw new Error("Entre como Mercado Paulista para resetar a demonstração.");
    const admin = adminClient();
    // Storage cleanup limited to the official account's non-seed uploads.
    const paths: string[] = [];
    for (let offset = 0; ; offset += 1000) {
      const { data: objects, error: listError } = await admin.storage
        .from("surplus")
        .list(user.id, {
          limit: 1000,
          offset,
          sortBy: { column: "name", order: "asc" },
        });
      if (listError)
        throw new Error("Não foi possível listar as fotos para resetar. Tente novamente.");
      paths.push(
        ...(objects || [])
          .filter((object) => object.id)
          .map((object) => `${user.id}/${object.name}`),
      );
      if (!objects || objects.length < 1000) break;
    }
    const { error } = await admin.rpc("reset_demo", { actor_auth_id: user.id });
    if (error) throw new Error(error.message);
    for (let offset = 0; offset < paths.length; offset += 100) {
      const { error: storageError } = await admin.storage
        .from("surplus")
        .remove(paths.slice(offset, offset + 100));
      if (storageError)
        return NextResponse.json({
          ok: true,
          warning: "Fluxo resetado. Algumas fotos precisam de limpeza no Storage.",
        });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
