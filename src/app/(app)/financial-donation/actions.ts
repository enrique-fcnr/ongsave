"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";

export async function submitFinancialSupport(formData: FormData) {
  const { client, profile, organization } = await requireProfile();
  if (profile.role !== "FINANCIAL_DONOR" || !organization) redirect("/home");
  const amount = Number(String(formData.get("amount") || "").replace(",", "."));
  const note =
    String(formData.get("note") || "")
      .trim()
      .slice(0, 500) || null;
  if (!Number.isFinite(amount) || amount <= 0 || amount > 100_000_000) {
    throw new Error("Informe um valor válido para o compromisso financeiro.");
  }
  const { error } = await client.from("financial_supports").insert({
    organization_id: organization.id,
    created_by: profile.id,
    amount,
    status: "PLEDGED",
    purpose: "Apoio ao custeio das entregas",
    note,
  });
  if (error) throw new Error("Não foi possível registrar o compromisso financeiro.");
  revalidatePath("/financial-donation");
  revalidatePath("/admin/funding");
}
