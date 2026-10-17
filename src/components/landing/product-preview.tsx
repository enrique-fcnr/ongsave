import Image from "next/image";
import { BrandLogo } from "@/components/brand-logo";
import {
  Bell,
  Camera,
  Check,
  CheckCheck,
  CircleCheck,
  HeartHandshake,
  House,
  Leaf,
  MapPin,
  Package,
  Sprout,
  Truck,
  ArrowUpRight,
} from "lucide-react";
import styles from "./landing.module.css";

export function DashboardPreview({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`${styles.dashboard} ${compact ? styles.dashboardCompact : ""}`}
      aria-label="Prévia ilustrativa do painel ONGSave"
    >
      <div className={styles.previewTop}>
        <span className={styles.previewBrand}>
          <BrandLogo className={styles.previewLogo} />
        </span>
        <span className={styles.previewLabel}>Prévia ilustrativa</span>
        <Bell size={16} />
        <span className={styles.previewAvatar}>MP</span>
      </div>
      <div className={styles.previewLayout}>
        <aside className={styles.previewSidebar} aria-hidden="true">
          <span className={styles.previewNavActive}>
            <House size={16} />
            Início
          </span>
          <span>
            <Package size={16} />
            Resgates
          </span>
          <span>
            <Leaf size={16} />
            Impacto
          </span>
          <div className={styles.sidebarSprout}>
            <Sprout size={36} />
            <p>
              Menos alimento perdido.
              <br />
              Mais destinos sociais.
            </p>
          </div>
        </aside>
        <div className={styles.previewContent}>
          <div className={styles.previewGreeting}>
            <div>
              <span>Um excedente pode virar alimento</span>
              <h3>Olá, Mercado Paulista.</h3>
            </div>
            <span className={styles.previewAction}>
              <Camera size={14} />
              Destinar alimento
            </span>
          </div>
          <div className={styles.previewMetrics}>
            {[
              ["38 kg", "Alimentos aproveitados"],
              ["≈ 76", "Refeições possíveis"],
              ["01", "Doação entregue"],
            ].map(([value, label]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
                <Leaf size={16} />
              </div>
            ))}
          </div>
          <div className={styles.previewLower}>
            <div className={styles.previewChart}>
              <div className={styles.previewCardHeading}>
                <strong>Alimentos com novo destino</strong>
                <span>Esta semana</span>
              </div>
              <div className={styles.chartBars} aria-hidden="true">
                {[35, 52, 44, 68, 58, 86, 100].map((height, i) => (
                  <div key={i}>
                    <span style={{ height: `${height}%` }} />
                    <small>{["S", "T", "Q", "Q", "S", "S", "D"][i]}</small>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.previewDonation}>
              <span className={styles.previewPill}>
                <span />
                Entrega confirmada
              </span>
              <div className={styles.produceIcon}>
                <Leaf size={38} />
              </div>
              <strong>Hortifrúti aproveitado</strong>
              <span>38 kg longe do descarte</span>
              <div className={styles.previewRecipient}>
                <HeartHandshake size={17} />
              <span>Alimento recebido pela instituição</span>
                <Check size={15} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FeaturePreview({ view }: { view: number }) {
  if (view === 0)
    return (
      <div className={styles.photoPreview}>
        <div className={styles.cameraFrame}>
          <Image
            src="/landing/apple-ai-iphone16-portrait.png"
            alt="iPhone 16 na vertical apontado para dez maçãs, com uma demonstração de visão de IA identificando cada fruta em caixas numeradas de 01 a 10"
            width={1024}
            height={1536}
            sizes="(max-width: 767px) 320px, 300px"
            className={styles.cameraImage}
          />
          <span className={styles.previewPill}>
            <Camera size={13} />
            Foto do excedente
          </span>
            <span className={styles.cameraCaption}>Análise inicial · exemplo ilustrativo</span>
        </div>
        <div className={styles.reviewCard}>
          <span className={styles.miniEyebrow}>Segurança antes da doação</span>
          <h3>Confira antes de oferecer</h3>
          <div className={styles.reviewField}>
            <span>Alimento</span>
            <strong>Maçãs</strong>
          </div>
          <div className={styles.reviewField}>
            <span>Quantidade</span>
            <strong>10 unidades</strong>
          </div>
          <div className={styles.reviewField}>
            <span>Peso estimado</span>
            <strong>1,8 kg</strong>
          </div>
          <div className={`${styles.reviewField} ${styles.reviewQuality}`}>
            <span>Qualidade do alimento</span>
            <strong>
              <CircleCheck size={14} />
              Alimento em boas condições
            </strong>
          </div>
          <div className={styles.reviewCheck}>
            <CircleCheck size={17} />
            Informações conferidas
          </div>
        </div>
      </div>
    );
  if (view === 1)
    return (
      <div className={styles.feedPreview}>
        <div className={styles.previewCardHeading}>
          <strong>Alimentos que podem ser aproveitados</strong>
          <span className={styles.previewPill}>Disponível</span>
        </div>
        <div className={styles.feedCards}>
          {[
            {
              name: "Hortifrúti misto",
              weight: "38 kg",
              image: "/landing/donation-produce.png",
              alt: "Caixa de madeira com hortaliças e frutas frescas para doação",
            },
            {
              name: "Pães do dia",
              weight: "24 kg",
              image: "/landing/donation-bread.png",
              alt: "Cesto com pães franceses dourados para doação",
            },
          ].map(({ name, weight, image, alt }) => (
            <div key={name}>
              <div className={styles.feedFood}>
                <Image src={image} alt={alt} width={1536} height={1024} sizes="250px" />
              </div>
              <strong>{name}</strong>
              <span>
                <MapPin size={12} />
                São Paulo · {weight}
              </span>
              <div className={styles.feedReserve}>
                Escolher uma doação
                <ArrowUpRight size={15} />
              </div>
            </div>
          ))}
        </div>
        <p className={styles.previewFootnote}>Informações claras ajudam a doação a chegar a tempo.</p>
      </div>
    );
  if (view === 2)
    return (
      <div className={styles.routePreview}>
        <div className={styles.abstractMap} aria-hidden="true">
          <svg viewBox="0 0 500 300" fill="none">
            <path
              d="M-30 75 530 250M75-30 270 330M-40 260 540 100M330-20 130 340M-20 145 520 170"
              stroke="#fff"
              strokeWidth="22"
            />
            <path d="M90 230V130H370V72" stroke="#fff" strokeWidth="13" strokeLinejoin="round" />
            <path
              d="M90 230V130H370V72"
              stroke="#6b873f"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className={styles.routePickup}>C</span>
          <span className={styles.routeDestination}>D</span>
          <span className={styles.routeDriver}>
            <Truck size={18} />
          </span>
        </div>
        <div className={styles.routeCard}>
          <span className={styles.previewPill}>
            <Truck size={13} />
            O caminho até quem precisa
          </span>
          <h3>Do excedente ao destino social</h3>
          <div>
            <MapPin size={15} />
            <span>Alimento disponível → Instituição</span>
          </div>
          <div className={styles.reviewCheck}>
            <CheckCheck size={17} />
            Recebimento confirmado por código
          </div>
        </div>
      </div>
    );
  return (
    <div className={styles.impactPreview}>
      <div className={styles.impactCircle}>
        <Leaf size={24} />
        <strong>
          38<span>kg</span>
        </strong>
          <p>Alimentos aproveitados</p>
      </div>
      <div className={styles.impactPreviewStats}>
        <span className={styles.miniEyebrow}>O destino fica comprovado</span>
        <h3>Veja o alimento que chegou.</h3>
        <div>
          <strong>≈ 76</strong>
          <span>refeições estimadas</span>
        </div>
        <div>
          <strong>1</strong>
          <span>doação confirmada</span>
        </div>
        <p className={styles.previewFootnote}>
          Exemplo ilustrativo. Estimativas calculadas a partir do peso entregue.
        </p>
      </div>
    </div>
  );
}
