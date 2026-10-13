import { FormSections, PagedItems } from "./screen-sections";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, MapPin, Utensils } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { signedPhoto } from "@/lib/data";
import { categoryLabels, conditions, number, priorities, type Batch } from "@/lib/domain";
import { FoodPhoto, StatusPill } from "./shared";
import { ReserveButton } from "./rescue-actions";
export async function BatchDetail({ id }: { id: string }) {
  const { client, profile } = await requireProfile();
  const { data: b, error } = await client
    .from("surplus_batches")
    .select("*,surplus_items(*)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!b) notFound();
  const batch = b as Batch;
  const { data: market } = await client
    .from("organizations")
    .select("*")
    .eq("id", batch.supermarket_id)
    .single();
  const { data: rescue } = await client
    .from("rescues")
    .select("id")
    .eq("batch_id", id)
    .maybeSingle();
  const deadline = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(batch.expires_at));
  return (
    <div className="stack detail-workspace">
      <Link href={profile.role === "NGO" ? "/ngo/donations" : "/home"} className="back">
        <ArrowLeft size={16} />
        Voltar
      </Link>
      <FormSections labels={["Resumo", "Fotografia", "Alimentos"]}>
        <section className="panel stack detail-summary">
          <div className="between">
            <span className="eyebrow muted">{categoryLabels[batch.category]}</span>
            <StatusPill status={batch.status} />
          </div>
          <h1>{batch.title}</h1>
          <div className="detail-weight">
            {number(Number(batch.estimated_weight_kg))} <span>kg disponíveis</span>
          </div>
          <div className="row small muted">
            <Utensils size={17} />≈ {number(Number(batch.estimated_weight_kg) * 2)} refeições
            estimadas
          </div>
          <hr />
          <div>
            <h3>{market?.name}</h3>
            <p className="small muted" style={{ marginTop: 8 }}>
              {market?.neighborhood} · São Paulo
            </p>
          </div>
          <div className="row small muted">
            <MapPin size={17} />
            {market?.address_line}
          </div>
          <div className="row small muted">
            <Clock size={17} />
            Retirada até {deadline} · {priorities[batch.pickup_priority]}
          </div>
          <div className="small detail-condition">
            <span className="muted">Condição visual aparente</span>
            <p style={{ marginTop: 6 }}>{conditions[batch.visual_condition]}</p>
          </div>
          {profile.role === "NGO" &&
            batch.status === "AVAILABLE" &&
            new Date(batch.expires_at) > new Date() && (
              <ReserveButton
                batchId={batch.id}
                weight={Number(batch.estimated_weight_kg)}
                deadline={deadline}
              />
            )}
          {rescue && (
            <Link href={`/rescue/${rescue.id}`} className="notice" style={{ textAlign: "center" }}>
              Acompanhar resgate
            </Link>
          )}
          {batch.ai_provider === "demo" && (
            <p className="small muted">Lote revisado a partir de análise demonstrativa.</p>
          )}
        </section>
        <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
          <FoodPhoto url={await signedPhoto(batch.image_url)} title={batch.title} />
        </div>
        <section className="panel stack detail-items">
          <h2>O que tem neste lote</h2>
          <PagedItems pageSize={5} mobilePageSize={3} label="Alimentos do lote">
            {batch.surplus_items?.map((i, n) => (
              <div className="between small" key={n}>
                <span>{i.name}</span>
                <span className="muted">≈ {number(Number(i.estimated_quantity))} unidades</span>
              </div>
            ))}
          </PagedItems>
          {!batch.surplus_items?.length && (
            <p className="small muted">
              Itens não discriminados. Confira as observações do mercado.
            </p>
          )}
          {batch.description && <p className="small muted">{batch.description}</p>}
          <p className="notice">
            A análise visual não substitui a avaliação da equipe responsável pelo alimento.
          </p>
        </section>
      </FormSections>
    </div>
  );
}
