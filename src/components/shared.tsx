import Link from "next/link";
import Image from "next/image";
import { BrandLogo } from "./brand-logo";
import { ArrowUpRight, Carrot, Clock, Leaf, Package, Sprout } from "lucide-react";
import {
  categoryLabels,
  number,
  statusLabels,
  type Batch,
  type Organization,
  type Rescue,
  type RescueStatus,
} from "@/lib/domain";
export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="ONGSave início">
      <BrandLogo />
    </Link>
  );
}
export function StatusPill({ status }: { status: RescueStatus }) {
  return (
    <span
      className={`pill ${status === "CANCELLED" ? "cancelled" : ["AVAILABLE", "DELIVERED"].includes(status) ? "" : "pending"}`}
    >
      {statusLabels[status]}
    </span>
  );
}
export function FoodPhoto({ url, title }: { url?: string | null; title: string }) {
  return (
    <div className="food-photo">
      {url ? (
        <Image src={url} alt={title} fill unoptimized sizes="(max-width: 767px) 100vw, 400px" />
      ) : (
        <div className="food-placeholder" role="img" aria-label="Lote sem fotografia">
          <Leaf />
          <Carrot />
          <Sprout />
        </div>
      )}
    </div>
  );
}
export function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="empty panel">
      <Package size={32} />
      <h3>{title}</h3>
      <p>{body}</p>
    </div>
  );
}
export function DonationCard({
  batch,
  market,
  url,
  score,
}: {
  batch: Batch;
  market?: Organization;
  url?: string;
  score?: number;
}) {
  return (
    <Link className="donation-card" href={`/ngo/donations/${batch.id}`}>
      <FoodPhoto url={url} title={batch.title} />
      <div className="body">
        <div className="between">
          <span className="small muted">{categoryLabels[batch.category]}</span>
          {score !== undefined && score >= 80 ? (
            <span className="pill">Alta compatibilidade</span>
          ) : (
            <StatusPill status={batch.status} />
          )}
        </div>
        <h2>{batch.title}</h2>
        <div className="between">
          <h3>{number(Number(batch.estimated_weight_kg))} kg disponíveis</h3>
          <ArrowUpRight size={18} color="var(--primary)" />
        </div>
        <p className="small muted">
          {market?.name} · {market?.neighborhood}
        </p>
        <p className="small muted row">
          <Clock size={14} />
          Retirar até{" "}
          {new Intl.DateTimeFormat("pt-BR", {
            timeZone: "America/Sao_Paulo",
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          }).format(new Date(batch.expires_at))}
        </p>
        <div className="between small card-footer">
          <span className="muted">
            ≈ {number(Number(batch.estimated_weight_kg) * 2)} refeições estimadas
          </span>
          <span style={{ color: "var(--primary)" }}>Ver doação</span>
        </div>
      </div>
    </Link>
  );
}
export function RescueList({
  rescues,
  orgs,
  emptyTitle = "Nenhum resgate por aqui",
  emptyBody = "Os próximos resgates aparecerão aqui, automaticamente.",
}: {
  rescues: Rescue[];
  orgs: Organization[];
  emptyTitle?: string;
  emptyBody?: string;
}) {
  if (!rescues.length) return <Empty title={emptyTitle} body={emptyBody} />;
  return (
    <div className="rescue-list">
      {rescues.map((r) => (
        <Link href={`/rescue/${r.id}`} className="rescue-row" key={r.id}>
          <span className="symbol">
            <Package size={21} />
          </span>
          <div className="info">
            <h3>{r.surplus_batches?.title || "Resgate de alimentos"}</h3>
            <p>
              {orgs.find((o) => o.id === r.ngo_id)?.name || "Instituição"} ·{" "}
              {number(Number(r.surplus_batches?.estimated_weight_kg || 0))} kg
            </p>
          </div>
          <StatusPill status={r.status} />
        </Link>
      ))}
    </div>
  );
}
