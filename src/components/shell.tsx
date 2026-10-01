"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  FileChartColumn,
  HeartHandshake,
  House,
  Leaf,
  LogOut,
  MapPinned,
  Package,
  User,
} from "lucide-react";
import { Brand } from "./shared";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { browserClient } from "@/lib/supabase/client";
import { Realtime } from "./realtime";
import type { Profile, Organization } from "@/lib/domain";
type Notification = {
  id: string;
  title: string;
  body: string;
  read_at: string | null;
  metadata: { rescue_id?: string; batch_id?: string };
};
export function Shell({
  children,
  profile,
  organization,
  notifications,
}: {
  children: React.ReactNode;
  profile: Profile;
  organization?: Organization;
  notifications: Notification[];
}) {
  const path = usePathname();
  const router = useRouter();
  const nav = [
    { href: "/home", label: "Início", icon: House },
    ...(profile.role === "NGO"
      ? [{ href: "/ngo/donations", label: "Doações", icon: HeartHandshake }]
      : profile.role === "DRIVER"
        ? [{ href: "/driver/missions", label: "Missões", icon: MapPinned }]
        : []),
    { href: "/rescues", label: "Resgates", icon: Package },
    { href: "/impact", label: "Impacto", icon: Leaf },
    { href: "/profile", label: "Perfil", icon: User },
  ];
  const active = (href: string) => path === href || path.startsWith(href + "/");
  async function logout() {
    await browserClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }
  return (
    <>
      <aside className="app-sidebar">
        <Brand />
        <nav>
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`nav-item ${active(n.href) ? "active" : ""}`}
            >
              <n.icon size={19} />
              {n.label}
            </Link>
          ))}
          {profile.role === "SUPERMARKET" && (
            <Link
              href="/supermarket/reports"
              className={`nav-item ${active("/supermarket/reports") ? "active" : ""}`}
            >
              <FileChartColumn size={19} />
              Relatórios
            </Link>
          )}
        </nav>
        <div className="sidebar-footer">
          <div className="panel" style={{ padding: 15, background: "#f7faf7" }}>
            <Leaf size={20} color="#15803d" />
            <p className="small muted" style={{ marginTop: 9, lineHeight: 1.6 }}>
              Pequenas ações.
              <br />
              Grandes novos destinos.
            </p>
          </div>
          <Button variant="ghost" onClick={logout}>
            <LogOut size={16} />
            Sair da conta
          </Button>
        </div>
      </aside>
      <div className="app-main">
        <header className="app-header">
          <Brand />
          <span className="desktop-header muted small">Sua rede de resgate de alimentos</span>
          <div className="row">
            <Dialog>
              <DialogTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Notificações, ${notifications.filter((n) => !n.read_at).length} não lidas`}
                  />
                }
              >
                <Bell size={19} />
                {notifications.some((n) => !n.read_at) && (
                  <span
                    style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }}
                  />
                )}
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Notificações</DialogTitle>
                </DialogHeader>
                <div className="notification-list">
                  {notifications.length ? (
                    notifications.map((n) => (
                      <Link
                        key={n.id}
                        href={
                          n.metadata.rescue_id
                            ? `/rescue/${n.metadata.rescue_id}`
                            : n.metadata.batch_id && profile.role === "NGO"
                              ? `/ngo/donations/${n.metadata.batch_id}`
                              : "/rescues"
                        }
                        onClick={() =>
                          void browserClient()
                            .from("notifications")
                            .update({ read_at: new Date().toISOString() })
                            .eq("id", n.id)
                        }
                      >
                        <h3>{n.title}</h3>
                        <p className="small muted" style={{ marginTop: 6 }}>
                          {n.body}
                        </p>
                      </Link>
                    ))
                  ) : (
                    <p className="muted small">Tudo em dia. As novidades aparecerão aqui.</p>
                  )}
                </div>
              </DialogContent>
            </Dialog>
            <Link href="/profile" className="avatar" aria-label="Abrir perfil">
              {(organization?.name || profile.name)
                .split(" ")
                .slice(0, 2)
                .map((s) => s[0])
                .join("")}
            </Link>
          </div>
        </header>
        <main className="content">{children}</main>
        <div className="sync-footer">
          <Realtime />
        </div>
      </div>
      <nav className="mobile-nav" aria-label="Navegação principal">
        {nav.map((n) => (
          <Link key={n.href} href={n.href} className={active(n.href) ? "active" : ""}>
            <n.icon />
            {n.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
