import { requireProfile } from "@/lib/auth";
import { Shell } from "@/components/shell";
export const dynamic = "force-dynamic";
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { client, profile, organization } = await requireProfile();
  const { data, error } = await client
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) throw new Error(error.message);
  return (
    <Shell profile={profile} organization={organization} notifications={data || []}>
      {children}
    </Shell>
  );
}
