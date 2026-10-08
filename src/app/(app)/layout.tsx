import { requireProfile } from "@/lib/auth";
import { ownNotifications } from "@/server/queries";
import { Shell } from "@/components/shell";
export const dynamic = "force-dynamic";
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { db, actor, profile, organization } = await requireProfile();
  const notifications = await ownNotifications(db, actor);
  return (
    <Shell profile={profile} organization={organization} notifications={notifications}>
      {children}
    </Shell>
  );
}
