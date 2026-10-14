import { BadgeCheck, HeartHandshake, Leaf, Utensils } from "lucide-react";
import { number } from "@/lib/domain";
import { CertificatePrintButton } from "./print-button";

export function ImpactCertificate({
  organization,
  period,
  issuedAt,
  rescuedKg,
  meals,
  ngoCount,
  co2Kg,
}: {
  organization: string;
  period: string;
  issuedAt: string;
  rescuedKg: number;
  meals: number;
  ngoCount: number;
  co2Kg: number;
}) {
  return (
    <section className="impact-certificate" aria-labelledby="impact-certificate-title">
      <div className="certificate-topline">
        <div className="certificate-brand">
          <span className="certificate-symbol">
            <Leaf size={22} />
          </span>
          <span>
            ONGSave
            <small>REDE DE RESGATE DE ALIMENTOS</small>
          </span>
        </div>
        <span className="certificate-demo-tag">Emissão demonstrativa</span>
      </div>

      <div className="certificate-copy">
        <span className="eyebrow">Certificado de impacto socioambiental</span>
        <h2 id="impact-certificate-title">Reconhecimento à {organization}</h2>
        <p>
          Pela participação na rede ONGSave e destinação de alimentos excedentes a organizações
          sociais durante <strong>{period}</strong>, contribuindo para reduzir o desperdício e
          apoiar o acesso à alimentação.
        </p>
      </div>

      <div className="certificate-results">
        <div>
          <Leaf size={18} />
          <strong>{number(rescuedKg)} kg</strong>
          <span>alimentos destinados</span>
        </div>
        <div>
          <BadgeCheck size={18} />
          <strong>{number(co2Kg)} kg</strong>
          <span>CO₂e estimados evitados</span>
        </div>
        <div>
          <HeartHandshake size={18} />
          <strong>{number(ngoCount)}</strong>
          <span>instituições atendidas</span>
        </div>
        <div>
          <Utensils size={18} />
          <strong>{number(meals)}</strong>
          <span>refeições estimadas</span>
        </div>
      </div>

      <div className="certificate-bottom">
        <p>
          Emitido pela ONGSave em {issuedAt}. Documento demonstrativo de projeto acadêmico; os
          indicadores são estimativas baseadas nos registros da plataforma e não equivalem a uma
          certificação ou auditoria ESG independente.
        </p>
        <CertificatePrintButton />
      </div>
    </section>
  );
}
