"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import {
  ArrowRight,
  Camera,
  ChartNoAxesCombined,
  Check,
  ChevronDown,
  Clock3,
  HeartHandshake,
  Link2,
  Menu,
  Package,
  Pause,
  Play,
  Truck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand-logo";
import { FeaturePreview } from "./product-preview";
import styles from "./landing.module.css";

const navigation = [
  ["Como funciona", "#como-funciona"],
  ["A plataforma", "#plataforma"],
  ["Para quem", "#para-quem"],
  ["Modelo de negócio", "#modelo-de-negocio"],
];
export function LandingHeader() {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  return (
    <header
      className={styles.header}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          setOpen(false);
          toggle.current?.focus();
        }
      }}
    >
      <Link href="/" className={styles.brand} aria-label="ONGSave início">
        <BrandLogo className={styles.logo} />
      </Link>
      <nav className={styles.desktopNav} aria-label="Navegação principal">
        {navigation.map(([label, href]) => (
          <a href={href} key={href}>
            {label}
          </a>
        ))}
        <details
          className={styles.resources}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget))
              event.currentTarget.open = false;
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.stopPropagation();
              event.currentTarget.open = false;
              event.currentTarget.querySelector("summary")?.focus();
            }
          }}
        >
          <summary>
            Explore
            <ChevronDown size={14} />
          </summary>
          <div>
            <a
              href="#impacto"
              onClick={(event) => {
                event.currentTarget.closest("details")!.open = false;
              }}
            >
              O impacto de cada entrega
            </a>
            <a
              href="#perguntas"
              onClick={(event) => {
                event.currentTarget.closest("details")!.open = false;
              }}
            >
              Perguntas frequentes
            </a>
            <Link href="/demo">
              Ambiente de demonstração
              <ArrowRight size={14} />
            </Link>
          </div>
        </details>
      </nav>
      <div className={styles.headerActions}>
        <Button
          render={<Link href="/login" />}
          nativeButton={false}
          variant="outline"
          className={styles.loginButton}
        >
          Entrar
        </Button>
        <Link href="/login" className={`${styles.cta} ${styles.headerCta}`}>
          Fazer parte
          <ArrowRight size={15} />
        </Link>
        <button
          ref={toggle}
          type="button"
          className={styles.menuToggle}
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
          aria-controls="landing-mobile-menu"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={21} /> : <Menu size={21} />}
        </button>
      </div>
      {open ? (
        <nav id="landing-mobile-menu" className={styles.mobileMenu} aria-label="Navegação mobile">
          {[...navigation, ["Impacto", "#impacto"], ["Perguntas frequentes", "#perguntas"]].map(
            ([label, href]) => (
              <a key={href} href={href} onClick={() => setOpen(false)}>
                {label}
                <ArrowRight size={16} />
              </a>
            ),
          )}
          <Link href="/demo" onClick={() => setOpen(false)}>
            Conhecer a demo
            <ArrowRight size={16} />
          </Link>
        </nav>
      ) : null}
    </header>
  );
}
export function ScrollReveal({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = root.current;
    if (
      !element ||
      matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window)
    )
      return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting || entry.intersectionRatio > 0) {
            entry.target.setAttribute("data-visible", "true");
            observer.unobserve(entry.target);
          }
      },
      { rootMargin: "0px 0px 120px 0px", threshold: 0.01 },
    );
    element.setAttribute("data-reveal-ready", "true");
    element
      .querySelectorAll<HTMLElement>("[data-reveal]")
      .forEach((target) => observer.observe(target));

    // Keep content visible if the browser fails to report an intersection.
    const revealFallback = window.setTimeout(() => {
      element
        .querySelectorAll<HTMLElement>('[data-reveal]:not([data-visible="true"])')
        .forEach((target) => target.setAttribute("data-visible", "true"));
    }, 1800);

    return () => {
      window.clearTimeout(revealFallback);
      observer.disconnect();
    };
  }, []);
  return (
    <div ref={root} className={styles.page}>
      {children}
    </div>
  );
}
const problems = [
  { Icon: Clock3, text: "Alimentos próprios para consumo perto do vencimento" },
  { Icon: Link2, text: "Mercados e instituições sem conexão direta" },
  { Icon: Package, text: "Excedentes que podem acabar no descarte" },
  { Icon: Truck, text: "Falta de transporte para a doação chegar" },
];
export function ProblemTicker() {
  const [paused, setPaused] = useState(false);
  return (
    <div className={styles.ticker} data-paused={paused}>
      <div className={styles.tickerViewport}>
        {[0, 1].map((row) => (
          <div className={styles.tickerTrack} key={row} aria-hidden={row === 1 ? true : undefined}>
            {[
              ...problems.slice(row),
              ...problems.slice(0, row),
              ...problems.slice(row),
              ...problems.slice(0, row),
            ].map(({ Icon, text }, index) => (
              <div
                className={styles.problemCard}
                key={`${row}-${index}`}
                aria-hidden={index >= 4 ? true : undefined}
              >
                <Icon size={25} />
                <span>{text}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
      <button
        className={styles.motionControl}
        type="button"
        onClick={() => setPaused(!paused)}
        aria-pressed={paused}
      >
        {paused ? <Play size={13} /> : <Pause size={13} />}{" "}
        {paused ? "Retomar movimento" : "Pausar movimento"}
      </button>
    </div>
  );
}
const features = [
  {
    Icon: Camera,
    label: "Evitar o descarte",
    title: "Identifique o alimento que ainda pode ser aproveitado.",
    body: "Quando o excedente é percebido a tempo, o mercado pode destiná-lo a pessoas em vez de enviá-lo ao descarte. A equipe confere as condições antes de oferecer a doação.",
    items: [
      "Reconheça excedentes ainda próprios para consumo",
      "Confira condições, quantidade e prazo",
      "Evite que a doação se perca por falta de informação",
    ],
  },
  {
    Icon: HeartHandshake,
    label: "Conectar a quem precisa",
    title: "Aproxime o excedente de quem pode distribuí-lo.",
    body: "Instituições encontram alimentos doados e escolhem volumes compatíveis com o que conseguem receber e distribuir.",
    items: [
      "Ofertas próximas de quem atende pessoas",
      "Escolhas compatíveis com a capacidade de recebimento",
      "Destino social definido para cada doação",
    ],
  },
  {
    Icon: Truck,
    label: "Fazer chegar",
    title: "A entrega completa o caminho até a instituição.",
    body: "Motoristas conectam o ponto de coleta ao destino social. A instituição confirma o recebimento para que o alimento não fique pelo caminho.",
    items: [
      "Conexão entre o local do excedente e quem recebe",
      "Acompanhamento até o destino social",
      "Confirmação de que o alimento chegou",
    ],
  },
  {
    Icon: ChartNoAxesCombined,
    label: "Comprovar o resultado",
    title: "Mostre quanto alimento foi aproveitado.",
    body: "Os registros das entregas confirmadas ajudam a demonstrar o destino dos excedentes e o alcance social da rede. Refeições são apresentadas como estimativas.",
    items: [
      "Histórico de alimentos que chegaram ao destino",
      "Peso entregue e estimativas identificadas",
      "Evidências para acompanhar o resultado social e ambiental",
    ],
  },
];
export function FeatureExplorer() {
  const [active, setActive] = useState(0);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const feature = features[active];
  function move(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % features.length;
    else if (event.key === "ArrowLeft") next = (index + features.length - 1) % features.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = features.length - 1;
    else return;
    event.preventDefault();
    setActive(next);
    buttons.current[next]?.focus();
  }
  return (
    <div>
      <div role="tablist" aria-label="Recursos da plataforma" className={styles.featureTabs}>
        {features.map(({ Icon, label }, index) => (
          <button
            type="button"
            ref={(element) => {
              buttons.current[index] = element;
            }}
            role="tab"
            id={`feature-tab-${index}`}
            aria-controls={`feature-panel-${index}`}
            aria-selected={active === index}
            tabIndex={active === index ? 0 : -1}
            key={label}
            onClick={() => setActive(index)}
            onKeyDown={(event) => move(event, index)}
          >
            <span>
              <Icon size={24} />
            </span>
            {label}
          </button>
        ))}
      </div>
      <div
        className={styles.featurePanel}
        id={`feature-panel-${active}`}
        role="tabpanel"
        aria-labelledby={`feature-tab-${active}`}
        tabIndex={0}
      >
        <div className={styles.featureCopy} key={`copy-${active}`}>
          <span className={styles.miniEyebrow}>{feature.label}</span>
          <h3>{feature.title}</h3>
          <p>{feature.body}</p>
          <ul>
            {feature.items.map((item) => (
              <li key={item}>
                <Check size={16} />
                {item}
              </li>
            ))}
          </ul>
          <a href="/login" className={styles.textLink}>
            Conhecer na prática
            <ArrowRight size={16} />
          </a>
        </div>
        <div className={styles.featureVisual} key={`visual-${active}`}>
          <FeaturePreview view={active} />
        </div>
      </div>
    </div>
  );
}
const process = [
  {
    title: "Evite que o excedente vá para o descarte.",
    text: "Identifique alimentos que ainda podem ser consumidos e informe suas condições para que recebam um novo destino a tempo.",
    view: 0,
  },
  {
    title: "Encontre uma instituição que possa receber.",
    text: "A instituição escolhe o que consegue distribuir. Assim, o excedente encontra um destino social compatível.",
    view: 1,
  },
  {
    title: "Faça a doação chegar e confirme o destino.",
    text: "O motorista transporta o alimento e a instituição confirma o recebimento. Cada entrega concluída reduz o risco de desperdício no caminho.",
    view: 2,
  },
];
export function ProcessExplorer() {
  const [active, setActive] = useState(0);
  return (
    <div className={styles.processLayout}>
      <div className={styles.processSteps}>
        {process.map((step, index) => (
          <div className={styles.processStep} data-active={active === index} key={step.title}>
            <button
              type="button"
              aria-expanded={active === index}
              aria-controls={`process-copy-${index}`}
              onClick={() => setActive(index)}
            >
              <span>{index + 1}</span>
              <h3>{step.title}</h3>
              <ArrowRight size={20} />
            </button>
            <p id={`process-copy-${index}`} hidden={active !== index}>
              {step.text}
            </p>
          </div>
        ))}
      </div>
      <div className={styles.processVisual} key={active}>
        <FeaturePreview view={process[active].view} />
      </div>
    </div>
  );
}
