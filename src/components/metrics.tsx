import { PagedItems } from "./screen-sections";
import { Banknote, HeartHandshake, Leaf, PackageCheck, Utensils, Route } from "lucide-react";
import { money, number, type Role, type Rescue, categoryLabels } from "@/lib/domain";
import { summarize } from "@/lib/data";
export function Metrics({ rescues, role }: { rescues: Rescue[]; role: Role }) {
  const m = summarize(rescues);
  const values = [
    {
      label:
        role === "NGO"
          ? "Alimentos recebidos"
          : role === "DRIVER"
            ? "Alimentos transportados"
            : "Alimentos salvos",
      value: `${number(m.kg)} kg`,
      Icon: Leaf,
    },
    { label: "Refeições estimadas", value: number(m.meals), Icon: Utensils },
    { label: "Resgates concluídos", value: number(m.count), Icon: PackageCheck },
    role === "DRIVER"
      ? { label: "Km solidários · simulação", value: `${number(m.km)} km`, Icon: Route }
      : role === "NGO"
        ? {
            label: "Mercados parceiros",
            value: number(
              new Set(rescues.filter((r) => r.status === "DELIVERED").map((r) => r.supermarket_id))
                .size,
            ),
            Icon: HeartHandshake,
          }
        : { label: "Economia estimada", value: money(m.savings), Icon: Banknote },
  ];
  return (
    <div className="metric-grid">
      {values.map((v) => (
        <div className="metric" key={v.label}>
          <div className="between">
            <span className="metric-label">{v.label}</span>
            <v.Icon className="metric-icon" />
          </div>
          <span className="value">{v.value}</span>
          <span className="metric-footnote">
            {v.label.includes("estimad")
              ? "Estimativa a partir do peso entregue"
              : v.label.includes("simulação")
                ? "Distâncias demonstrativas"
                : "Entregas confirmadas"}
          </span>
        </div>
      ))}
    </div>
  );
}
export function Charts({ rescues, asOf }: { rescues: Rescue[]; asOf: number }) {
  const done = rescues.filter((r) => r.status === "DELIVERED");
  const weeks = Array.from({ length: 4 }, (_, i) => {
    const min = asOf - (4 - i) * 7 * 86400000;
    const max = min + 7 * 86400000;
    return done
      .filter(
        (r) =>
          new Date(r.delivered_at || r.created_at).getTime() >= min &&
          new Date(r.delivered_at || r.created_at).getTime() < max,
      )
      .reduce((s, r) => s + Number(r.surplus_batches?.estimated_weight_kg || 0), 0);
  });
  const max = Math.max(...weeks, 1);
  const points = weeks.map((v, i) => `${30 + i * 105},${160 - (v / max) * 130}`).join(" ");
  const groups = done.reduce<Record<string, number>>((acc, r) => {
    const cat = r.surplus_batches?.category || "other";
    acc[cat] = (acc[cat] || 0) + Number(r.surplus_batches?.estimated_weight_kg || 0);
    return acc;
  }, {});
  const sum = Object.values(groups).reduce((s, n) => s + n, 0);
  return (
    <PagedItems className="dashboard-grid" pageSize={2} label="Gráficos">
      <section className="panel stack">
        <div className="between">
          <h2>Alimentos salvos por semana</h2>
          <span className="small muted">Últimos 28 dias</span>
        </div>
        <svg
          className="chart"
          viewBox="0 0 375 180"
          role="img"
          aria-label={`Quilogramas por semana: ${weeks.map(number).join(", ")}`}
        >
          <defs>
            <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22694f" stopOpacity=".18" />
              <stop offset="100%" stopColor="#22694f" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[30, 75, 120, 165].map((y) => (
            <line key={y} x1="10" x2="365" y1={y} y2={y} stroke="#e8e9e1" />
          ))}
          <polygon points={`30,165 ${points} 345,165`} fill="url(#area)" />
          <polyline
            points={points}
            fill="none"
            stroke="#22694f"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {weeks.map((v, i) => (
            <g key={i}>
              <circle cx={30 + i * 105} cy={160 - (v / max) * 130} r="4" fill="#22694f" />
              <text
                x={30 + i * 105}
                y={149 - (v / max) * 130}
                textAnchor="middle"
                fontSize="10"
                fill="#666960"
              >
                {number(v)} kg
              </text>
            </g>
          ))}
        </svg>
        <div className="chart-labels">
          {weeks.map((_, i) => (
            <span key={i}>Semana {i + 1}</span>
          ))}
        </div>
      </section>
      <section className="panel stack">
        <div className="title-block">
          <h2>O que ganhou um novo destino</h2>
          <p className="small muted">Peso entregue por categoria</p>
        </div>
        {Object.entries(groups)
          .sort((a, b) => b[1] - a[1])
          .map(([cat, kg]) => (
            <div className="category-row" key={cat}>
              <div className="between">
                <span>{categoryLabels[cat]}</span>
                <span className="muted">{number(kg)} kg</span>
              </div>
              <div className="bar-track">
                <span style={{ width: `${(kg / sum) * 100}%` }} />
              </div>
            </div>
          ))}
        {!sum && <p className="small muted">O primeiro resgate dará início ao seu gráfico.</p>}
      </section>
    </PagedItems>
  );
}

export function EnvironmentalImpact({ rescues }: { rescues: Rescue[] }) {
  const m = summarize(rescues);
  return (
    <>
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
    </>
  );
}
