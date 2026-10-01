import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { SurplusForm } from "@/components/surplus-form";
export default async function NewSurplus() {
  const { profile } = await requireProfile();
  if (profile.role !== "SUPERMARKET") redirect("/home");
  return <SurplusForm />;
}
