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
  Plus,
  User,
} from "lucide-react";
import { Brand } from "./shared";
import { ProfileAvatar } from "./profile-avatar";
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
  const nav =
    profile.role === "ADMIN"
      ? [{ href: "/admin", label: "Visão da rede", icon: MapPinned }]
      : [
          ...(profile.role !== "DRIVER" ? [{ href: "/home", label: "Início", icon: House }] : []),
          ...(profile.role === "NGO"
            ? [{ href: "/ngo/donations", label: "Doações disponíveis", icon: HeartHandshake }]
            : profile.role === "DRIVER"
              ? [{ href: "/driver/missions", label: "Missões", icon: MapPinned }]
              : [{ href: "/supermarket/surplus/new", label: "Novo excedente", icon: Plus }]),
          { href: "/rescues", label: "Doações", icon: Package },
          ...(profile.role === "DRIVER" ? [{ href: "/impact", label: "Impacto", icon: Leaf }] : []),
        ];
  const mobileNav = [
    ...nav
      .filter((item) => item.href !== "/profile")
      .map((item) =>
        profile.role === "SUPERMARKET" && item.href === "/supermarket/surplus/new"
          ? { ...item, label: "Nova doação" }
          : item,
      ),
    ...(profile.role === "SUPERMARKET"
      ? [{ href: "/supermarket/reports", label: "Relatórios", icon: FileChartColumn }]
      : []),
  ];
  const active = (href: string) =>
    path === href ||
    path.startsWith(href + "/") ||
    (href === "/rescues" && path.startsWith("/rescue/")) ||
    (href === "/home" && path.startsWith("/supermarket/surplus/") && !path.endsWith("/new"));
  const roleLabel =
    profile.role === "SUPERMARKET"
      ? "Supermercado"
      : profile.role === "ADMIN"
        ? "Administração"
        : profile.role === "NGO"
          ? "Instituição"
          : "Motorista";
  const sectionLabel =
    nav.find((item) => active(item.href))?.label ||
    (path.startsWith("/supermarket/reports") ? "Relatórios" : "Detalhes do resgate");
  async function logout() {
    await browserClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }
  return (
    <>
      <a href="#app-content" className="app-skip-link">
        Ir para o conteúdo
      </a>
      <aside className="app-sidebar">
        <Brand />
        <p className="sidebar-role">Sua área · {roleLabel}</p>
        <nav aria-label="Navegação do produto">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`nav-item ${active(n.href) ? "active" : ""}`}
              aria-current={active(n.href) ? "page" : undefined}
            >
              <n.icon size={19} />
              {n.label}
            </Link>
          ))}
          {profile.role === "SUPERMARKET" && (
            <Link
              href="/supermarket/reports"
              className={`nav-item ${active("/supermarket/reports") ? "active" : ""}`}
              aria-current={active("/supermarket/reports") ? "page" : undefined}
            >
              <FileChartColumn size={19} />
              Relatórios
            </Link>
          )}
        </nav>
        <div className="sidebar-footer">
          <div className="panel sidebar-note">
            <Leaf size={20} />
            <p className="small muted" style={{ marginTop: 9, lineHeight: 1.6 }}>
              Pequenas ações.
              <br />
              Novos destinos.
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
          <div className="desktop-header header-context">
            <strong>{sectionLabel}</strong>
            <span>{roleLabel} · Conexões que alimentam</span>
          </div>
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
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "var(--primary)",
                    }}
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
            <Link href="/profile" className="profile-chip" aria-label="Abrir perfil">
              <ProfileAvatar name={organization?.name || profile.name} url={profile.avatar_url} />
              <span>{organization?.name || profile.name}</span>
            </Link>
            <details className="mobile-profile-actions">
              <summary aria-label="Abrir opções do perfil">
                <ProfileAvatar name={organization?.name || profile.name} url={profile.avatar_url} />
              </summary>
              <div className="mobile-profile-menu">
                <Link
                  href="/profile"
                  onClick={(event) =>
                    event.currentTarget.closest("details")?.removeAttribute("open")
                  }
                >
                  <User size={17} />
                  Meu perfil
                </Link>
                <button type="button" onClick={logout}>
                  <LogOut size={17} />
                  Sair
                </button>
              </div>
            </details>
          </div>
        </header>
        <main id="app-content" className="content" tabIndex={-1}>
          {children}
        </main>
      </div>
      <nav className="mobile-nav" aria-label="Navegação principal">
        {mobileNav.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            aria-current={active(n.href) ? "page" : undefined}
            className={active(n.href) ? "active" : ""}
          >
            <n.icon />
            {n.label}
          </Link>
        ))}
      </nav>
      <div className="sync-footer">
        <Realtime />
      </div>
    </>
  );
}
