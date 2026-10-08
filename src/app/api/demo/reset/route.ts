import { NextResponse } from "next/server";
import { apiUser, apiError } from "@/lib/http";
import { resetDemo } from "@/server/services/demo";
import { deletePhotos } from "@/server/storage";
import { photoBucket } from "@/server/bindings";
import { notify } from "@/server/realtime/notify";
import { ALL } from "@/server/realtime/channels";
export async function POST(request: Request) {
  try {
    if (process.env.ENABLE_DEMO_MODE !== "true") throw new Error("Modo demonstração desativado.");
    const { db, actor } = await apiUser(request, ["SUPERMARKET"]);
    if (actor.email !== "mercado@ongsave.demo")
      throw new Error("Entre como Mercado Paulista para resetar a demonstração.");
    await resetDemo(db, actor);
    notify([ALL]);
    // Photo cleanup limited to the official account's folder, after the data reset.
    try {
      await deletePhotos(photoBucket(), `${actor.authUserId}/`);
    } catch {
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
