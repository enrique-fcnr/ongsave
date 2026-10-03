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
        <h1>O alimento chega. O impacto fica.</h1>
        <p>Alimentos entregues, conexões e resultados da sua participação na rede.</p>
      </div>
      <Metrics rescues={rescues} role={profile.role} />
      <Charts rescues={rescues} asOf={asOf} />
      <div className="impact-banner">
        <div>
          <span className="eyebrow">Estimativa ambiental</span>
          <div className="impact-total">{number(m.co2)} kg de CO₂e</div>
          <p>
            Potencial de emissões evitadas · {number(m.water)} litros de água associados aos
            alimentos redirecionados.
          </p>
        </div>
        <Leaf className="art" />
      </div>
      <details className="method-note">
        <summary>Como calculamos essas estimativas</summary>
        <p>
          Os indicadores usam apenas entregas confirmadas e incluem o histórico de demonstração.
          Fatores ilustrativos: 2 refeições/kg, 1,43 kg CO₂e/kg e 250 L/kg. São estimativas e não
          representam inventário ambiental certificado.
        </p>
      </details>
    </div>
  );
}
