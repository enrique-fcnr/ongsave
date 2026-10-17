import "server-only";
import { redirect } from "next/navigation";
import { requireProfile } from "./auth";

export type FinancialSupport = {
  id: string;
  company: string;
  amount: number;
  status: "PLEDGED" | "RECEIVED" | "DECLINED";
  purpose: string;
  note: string | null;
  createdAt: string;
  receivedAt: string | null;
};

type FinancialSupportRow = {
  id: string;
  amount: number | string;
  status: FinancialSupport["status"];
  purpose: string;
  note: string | null;
  created_at: string;
  received_at: string | null;
  organizations: { name: string } | { name: string }[] | null;
};

function mapSupport(row: FinancialSupportRow): FinancialSupport {
  const organization = Array.isArray(row.organizations) ? row.organizations[0] : row.organizations;
  return {
    id: row.id,
    company: organization?.name || "Empresa apoiadora",
    amount: Number(row.amount),
    status: row.status,
    purpose: row.purpose,
    note: row.note,
    createdAt: row.created_at,
    receivedAt: row.received_at,
  };
}

export async function ownFinancialSupportData() {
  const { client, profile, organization } = await requireProfile();
  if (profile.role !== "FINANCIAL_DONOR" || !organization) redirect("/home");
  const { data, error } = await client
    .from("financial_supports")
    .select("id,amount,status,purpose,note,created_at,received_at,organizations(name)")
    .eq("organization_id", organization.id)
    .order("created_at", { ascending: false });
  if (error) throw new Error("Não foi possível carregar os apoios financeiros.");
  return { company: organization.name, supports: (data || []).map(mapSupport) };
}

export async function adminFinancialSupportData() {
  const { client, profile } = await requireProfile();
  if (profile.role !== "ADMIN") redirect("/home");
  const { data, error } = await client
    .from("financial_supports")
    .select("id,amount,status,purpose,note,created_at,received_at,organizations(name)")
    .order("created_at", { ascending: false });
  if (error) throw new Error("Não foi possível carregar os apoios financeiros.");
  const supports = (data || []).map(mapSupport);
  return {
    supports,
    companies: new Set(supports.map((support) => support.company)).size,
    receivedAmount: supports
      .filter((support) => support.status === "RECEIVED")
      .reduce((sum, support) => sum + support.amount, 0),
    pledgedAmount: supports
      .filter((support) => support.status === "PLEDGED")
      .reduce((sum, support) => sum + support.amount, 0),
  };
}
