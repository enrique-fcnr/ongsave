import type { Metadata } from "next";
import { adminContractData } from "@/lib/admin-contract-data";
import { AdminContracts } from "@/components/admin/admin-contracts";

export const metadata: Metadata = {
  title: "Contratos dos supermercados",
  robots: { index: false, follow: false },
};

export default async function AdminContractsPage() {
  return <AdminContracts data={await adminContractData()} />;
}
