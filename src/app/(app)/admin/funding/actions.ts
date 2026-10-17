"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";

export async function markFinancialSupportReceived(formData: FormData) {
  const { client, profile } = await requireProfile();
  if (profile.role !== "ADMIN") redirect("/home");
  const id = String(formData.get("id") || "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("Registro inválido.");
  const { error } = await client
    .from("financial_supports")
    .update({ status: "RECEIVED", received_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "PLEDGED");
  if (error) throw new Error("Não foi possível confirmar o recebimento.");
  revalidatePath("/admin/funding");
}
