import { RescueDetail } from "@/components/rescue-detail";
export default async function Mission({ params }: { params: Promise<{ id: string }> }) {
  return <RescueDetail id={(await params).id} />;
}
