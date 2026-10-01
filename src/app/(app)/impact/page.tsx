import { operationalData, summarize } from "@/lib/data";
import { Metrics, Charts } from "@/components/metrics";
import { number } from "@/lib/domain";
import { Leaf } from "lucide-react";
export default async function Impact() {
  const { rescues, profile, asOf } = await operationalData();
  const m = summarize(rescues);
  return (
    <div className="stack">
      <div className="title-block">
        <span className="eyebrow muted">O resultado das suas conexões</span>
        <h1>Impacto que alimenta.</h1>
        <p>Resultados dos resgates concluídos. O histórico demonstrativo está incluído.</p>
      </div>
      <Metrics rescues={rescues} role={profile.role} />
      <Charts rescues={rescues} asOf={asOf} />
      <div className="impact-banner">
        <div>
          <span className="eyebrow">Estimativa ambiental</span>
          <h1 style={{ marginTop: 14 }}>{number(m.co2)} kg de CO₂e</h1>
          <p>
            Potencial de emissões evitadas · {number(m.water)} litros de água associados aos
            alimentos redirecionados.
          </p>
        </div>
        <Leaf className="art" />
      </div>
      <p className="small muted">
        Projeções ilustrativas do MVP: 2 refeições/kg, 1,43 kg CO₂e/kg e 250 L/kg. Não representam
        inventário ambiental certificado.
      </p>
    </div>
  );
}
