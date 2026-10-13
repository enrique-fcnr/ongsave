import type { Metadata } from "next";
import { adminNetworkData } from "@/lib/admin-data";
import { AdminNetwork } from "@/components/admin/admin-network";

export const metadata: Metadata = {
  title: "Visão da rede",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  return <AdminNetwork organizations={await adminNetworkData()} />;
}
