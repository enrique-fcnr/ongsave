import { BatchDetail } from "@/components/batch-detail";
export default async function Surplus({ params }: { params: Promise<{ id: string }> }) {
  return <BatchDetail id={(await params).id} />;
}
