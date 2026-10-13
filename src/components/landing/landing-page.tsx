import Link from "next/link";
import Image from "next/image";
import type { CSSProperties } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  ChartNoAxesCombined,
  Check,
  ChevronDown,
  CircleCheck,
  Clock3,
  HeartHandshake,
  Leaf,
  MapPin,
  PackageCheck,
  ShieldCheck,
  Sprout,
  Store,
  Truck,
  Users,
} from "lucide-react";
import { DashboardPreview } from "./product-preview";
import { BrandLogo } from "@/components/brand-logo";
import {
  FeatureExplorer,
  LandingHeader,
  ProblemTicker,
  ProcessExplorer,
  ScrollReveal,
} from "./landing-interactions";
import styles from "./landing.module.css";

const roles = [
  {
    Icon: Store,
    name: "Supermercados",
    eyebrow: "O primeiro gesto",
    title: "Dê um novo destino ao excedente.",
    body: "Sua equipe transforma alimentos disponíveis em doações organizadas, com foto, prazo e informações revisadas.",
    items: [
      "Registre os lotes disponíveis",
      "Acompanhe reservas e coletas",
      "Consulte impacto e relatórios",
    ],
    cta: "Área do supermercado",
  },
  {
    Icon: HeartHandshake,
    name: "Instituições",
    eyebrow: "Onde o alimento faz diferença",
    title: "Receba com mais clareza e cuidado.",
    body: "Encontre doações que sua instituição pode receber e acompanhe cada etapa até a confirmação da entrega.",
    items: [
      "Explore as doações disponíveis",
      "Reserve o que consegue receber",
      "Confirme o recebimento por código",
    ],
    cta: "Área da instituição",
  },
  {
    Icon: Truck,
    name: "Motoristas",
    eyebrow: "O caminho entre as pontas",
    title: "Faça do seu trajeto um resgate.",
    body: "Conecte a coleta ao destino. Veja a missão, consulte os endereços e registre o andamento de cada entrega.",
    items: [
      "Encontre missões disponíveis",
      "Consulte mapa e endereços",
      "Acompanhe as etapas do resgate",
    ],
    cta: "Área do motorista",
  },
];
const faqs = [
  {
    question: "Quem pode participar da ONGSave?",
    answer:
      "A rede conecta supermercados, instituições que recebem alimentos e motoristas que realizam os resgates. Cada participante cadastrado acessa uma área preparada para seu papel.",
  },
  {
    question: "Como um resgate começa?",
    answer:
      "O supermercado fotografa o excedente, revisa os dados e publica o lote. Uma instituição reserva a doação, e a missão fica disponível para um motorista realizar a coleta e a entrega.",
  },
  {
    question: "A foto publica a doação automaticamente?",
    answer:
      "Não. A equipe do supermercado revisa as informações do alimento, o peso e o prazo antes de publicar. A foto ajuda no registro, e a decisão de disponibilizar o lote continua com a equipe.",
  },
  {
    question: "Como a entrega é confirmada?",
    answer:
      "A instituição recebe um código de confirmação. No destino, o motorista informa esse código para registrar o recebimento e concluir o resgate.",
  },
  {
    question: "Os indicadores de impacto são estimativas?",
    answer:
      "O peso dos alimentos entregues e o número de resgates vêm dos registros da operação. As refeições e os valores de economia são estimativas calculadas a partir desses dados e aparecem identificados no app.",
  },
  {
    question: "Posso conhecer a plataforma antes de participar?",
    answer: (
      <>
        Sim. O <Link href="/demo">ambiente de demonstração</Link> apresenta os perfis de
        supermercado, instituição e motorista. O acesso à operação é destinado a participantes
        cadastrados.
      </>
    ),
  },
];
function SectionHeading({ label, title, body }: { label: string; title: string; body: string }) {
  return (
    <div className={styles.sectionHeading} data-reveal>
      <span className={styles.sectionTag}>
        <Sprout size={14} />
        {label}
      </span>
      <h2>{title}</h2>
      <p>{body}</p>
    </div>
  );
}

export default function Landing() {
  return (
    <ScrollReveal>
      <a href="#conteudo" className={styles.skipLink}>
        Ir para o conteúdo
      </a>
      <LandingHeader />
      <main id="conteudo">
        <section className={styles.hero} aria-labelledby="landing-title">
          <div className={styles.heroGlow} aria-hidden="true" />
          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>
              <span className={styles.heroAvatars}>
                <Store size={16} />
                <HeartHandshake size={16} />
                <Truck size={16} />
              </span>
              <span>Uma rede de pessoas. Um propósito em comum.</span>
            </div>
            <h1 id="landing-title">
              Alimentos merecem
              <br />
              um <span>novo destino.</span>
            </h1>
            <p>
              Do excedente do mercado à mesa de quem precisa.
              <br className={styles.desktopBreak} /> Uma fotografia conecta as pessoas que fazem
              esse resgate acontecer.
            </p>
            <div className={styles.heroActions}>
              <Link href="/login" className={`${styles.cta} ${styles.lightCta}`}>
                Começar um resgate
                <ArrowRight size={18} />
              </Link>
              <a href="#plataforma" className={styles.outlineCta}>
                Conhecer a plataforma
                <ArrowUpRight size={17} />
              </a>
            </div>
            <div className={styles.heroNote}>
              <CircleCheck size={14} />
              Supermercados, instituições e motoristas. Juntos.
            </div>
          </div>
          <div className={styles.heroPreview}>
            <DashboardPreview />
            <div className={styles.floatingNotice}>
              <span>
                <PackageCheck size={19} />
              </span>
              <div>
                <strong>Um novo destino encontrado.</strong>
                <small>Do excedente à mesa, com propósito.</small>
              </div>
              <Check size={16} />
            </div>
          </div>
        </section>

        <section className={styles.networkStrip} aria-label="Participantes da rede">
          <p>
            Três pontas.
            <br />
            <strong>Uma rede de cuidado.</strong>
          </p>
          <div>
            {roles.map(({ Icon, name }) => (
              <span key={name}>
                <Icon size={26} />
                {name}
              </span>
            ))}
          </div>
        </section>

        <section className={styles.section} id="o-desafio">
          <SectionHeading
            label="O desafio"
            title="O alimento está pronto. A conexão nem sempre."
            body="Quando o tempo é curto e os contatos estão espalhados, um alimento em boas condições pode perder a chance de chegar a outro destino."
          />
          <ProblemTicker />
          <p className={styles.bridgeText}>
            Uma boa ação não precisa se perder no caminho.
            <ArrowRight size={20} />
          </p>
        </section>

        <section className={`${styles.section} ${styles.platformSection}`} id="plataforma">
          <SectionHeading
            label="A plataforma"
            title="Tudo o que um resgate precisa. Em um só lugar."
            body="Um fluxo conectado para registrar, encontrar, transportar e acompanhar cada doação. Simples para quem participa. Valioso para quem recebe."
          />
          <div data-reveal>
            <FeatureExplorer />
          </div>
        </section>

        <section className={`${styles.section} ${styles.benefitSection}`} id="beneficios">
          <SectionHeading
            label="Por que ONGSave"
            title="Menos etapas soltas. Mais resgates completos."
            body="Cada participante sabe qual é o próximo passo. E toda entrega deixa um registro que ajuda a rede a seguir em frente."
          />
          <div className={styles.benefitGrid}>
            {[
              {
                Icon: Clock3,
                title: "Tempo para o que importa",
                text: "Foto, dados e disponibilidade juntos para organizar o excedente e facilitar a decisão de quem recebe.",
              },
              {
                Icon: ShieldCheck,
                title: "Cuidado em cada etapa",
                text: "Revisão antes da publicação, acompanhamento do trajeto e confirmação no recebimento.",
              },
              {
                Icon: ChartNoAxesCombined,
                title: "Impacto que fica visível",
                text: "Peso entregue, resgates concluídos e estimativas de refeições para acompanhar o resultado da operação.",
              },
            ].map(({ Icon, title, text }, i) => (
              <article
                key={title}
                data-reveal
                style={{ "--reveal-delay": `${i * 80}ms` } as CSSProperties}
              >
                <span className={styles.benefitIcon}>
                  <Icon size={24} />
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.section} id="como-funciona">
          <SectionHeading
            label="Como funciona"
            title="Uma fotografia inicia um resgate completo."
            body="Três passos conectam o cuidado de quem doa à confirmação de quem recebe."
          />
          <div data-reveal>
            <ProcessExplorer />
          </div>
        </section>

        <section className={styles.peopleSection} id="nossa-rede">
          <div className={styles.peopleCopy} data-reveal>
            <span className={styles.sectionTag}>
              <Users size={14} />
              Uma rede feita por pessoas
            </span>
            <h2>
              Por trás de cada resgate,
              <br />
              tem gente.
            </h2>
            <p>
              Gente que separa o alimento. Gente que abre as portas. Gente que faz o caminho. A
              ONGSave aproxima essas pessoas para que o cuidado chegue mais longe.
            </p>
            <div className={styles.peopleValues}>
              <span>
                <HeartHandshake size={18} />
                Cuidado compartilhado
              </span>
              <span>
                <Leaf size={18} />
                Alimentos com novos destinos
              </span>
            </div>
            <a href="#para-quem" className={styles.textLink}>
              Encontre seu lugar nessa rede
              <ArrowRight size={17} />
            </a>
          </div>
          <div className={styles.peopleVisual} data-reveal>
            <div className={styles.peopleHalo} aria-hidden="true" />
            <Image
              src="/landing/rescue-team.png"
              alt="Imagem ilustrativa de uma equipe de supermercado, uma colaboradora de ONG e uma motorista com alimentos para doação"
              width={1536}
              height={1024}
              sizes="(max-width: 767px) 100vw, 55vw"
              className={styles.peopleImage}
            />
            <span className={styles.peopleBadge}>
              <Sprout size={17} />
              Juntos, o alimento vai mais longe.
            </span>
          </div>
        </section>

        <section className={styles.section} id="para-quem">
          <SectionHeading
            label="Faça parte"
            title="Um propósito. Três formas de participar."
            body="Cada papel tem uma área própria, com as informações e as ações de que precisa para fazer o resgate acontecer."
          />
          <div className={styles.roleGrid}>
            {roles.map(({ Icon, name, eyebrow, title, body, items, cta }, index) => (
              <article
                key={name}
                className={index === 1 ? styles.roleFeatured : styles.roleCard}
                data-reveal
              >
                <span className={styles.roleEyebrow}>{eyebrow}</span>
                <div className={styles.roleName}>
                  <span>
                    <Icon size={25} />
                  </span>
                  <h3>{name}</h3>
                </div>
                <h4>{title}</h4>
                <p>{body}</p>
                <ul>
                  {items.map((item) => (
                    <li key={item}>
                      <Check size={16} />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/login"
                  className={`${styles.cta} ${index === 1 ? styles.lightCta : styles.roleCta}`}
                >
                  {cta}
                  <ArrowUpRight size={17} />
                </Link>
              </article>
            ))}
          </div>
          <p className={styles.roleFootnote}>
            Já é participante?{" "}
            <Link href="/login">
              Acesse sua conta
              <ArrowRight size={13} />
            </Link>
          </p>
        </section>

        <section className={styles.impactSection} id="impacto">
          <div data-reveal>
            <span className={styles.sectionTag}>
              <Leaf size={14} />
              Cada entrega conta
            </span>
            <h2>
              O alimento chega.
              <br />O impacto permanece.
            </h2>
            <p>
              Quando o recebimento é confirmado, o resgate entra no histórico. Sua equipe acompanha
              o que foi entregue e as possibilidades que esse gesto representa.
            </p>
            <Link href="/login" className={styles.textLink}>
              Acompanhar meus resgates
              <ArrowRight size={17} />
            </Link>
          </div>
          <div className={styles.impactExample} data-reveal>
            <span className={styles.miniEyebrow}>Um exemplo de transformação</span>
            <div className={styles.impactEquation}>
              <div>
                <strong>
                  38<span>kg</span>
                </strong>
                <p>de alimentos entregues</p>
              </div>
              <ArrowRight size={25} />
              <div>
                <strong>≈ 76</strong>
                <p>refeições estimadas</p>
              </div>
            </div>
            <div className={styles.impactConfirmation}>
              <CircleCheck size={18} />
              Uma entrega confirmada. Um resultado registrado.
            </div>
            <p className={styles.previewFootnote}>
              Exemplo ilustrativo. Refeições são estimativas a partir do peso entregue.
            </p>
          </div>
        </section>

        <section className={`${styles.section} ${styles.faqSection}`} id="perguntas">
          <SectionHeading
            label="Perguntas frequentes"
            title="Vamos tirar suas dúvidas?"
            body="O essencial para entender como a rede se conecta e como você pode participar."
          />
          <div className={styles.faqList} data-reveal>
            {faqs.map(({ question, answer }, index) => (
              <details key={question} name="ongsave-faq">
                <summary>
                  <span>{question}</span>
                  <ChevronDown size={18} />
                </summary>
                <div id={`faq-answer-${index}`}>
                  <p>{answer}</p>
                </div>
              </details>
            ))}
          </div>
        </section>

        <section className={styles.finalSection}>
          <div className={styles.finalContent} data-reveal>
            <span className={styles.finalIcon}>
              <Sprout size={32} />
            </span>
            <h2>
              O próximo destino começa
              <br />
              com uma boa ação.
            </h2>
            <p>
              Conecte seu mercado, sua instituição ou seu trajeto
              <br className={styles.desktopBreak} /> a uma rede que transforma excedentes em
              possibilidades.
            </p>
            <div className={styles.heroActions}>
              <Link href="/login" className={`${styles.cta} ${styles.lightCta}`}>
                Fazer parte da rede
                <ArrowRight size={17} />
              </Link>
              <Link href="/demo" className={styles.outlineCta}>
                Conhecer a demo
                <ArrowUpRight size={16} />
              </Link>
            </div>
          </div>
          <div className={styles.finalPreview} aria-hidden="true">
            <DashboardPreview compact />
          </div>
        </section>
      </main>
      <footer className={styles.footer}>
        <div className={styles.footerGrid}>
          <div>
            <Link href="/" className={styles.brand} aria-label="ONGSave início">
              <BrandLogo className={styles.logo} />
            </Link>
            <p>
              Uma fotografia inicia um resgate.
              <br />
              Uma rede faz ele acontecer.
            </p>
            <span className={styles.footerLocation}>
              <MapPin size={14} />
              Conexões que alimentam.
            </span>
          </div>
          <div>
            <h3>A plataforma</h3>
            <a href="#plataforma">Recursos</a>
            <a href="#como-funciona">Como funciona</a>
            <a href="#impacto">Impacto</a>
          </div>
          <div>
            <h3>A rede</h3>
            <a href="#para-quem">Supermercados</a>
            <a href="#para-quem">Instituições</a>
            <a href="#para-quem">Motoristas</a>
          </div>
          <div>
            <h3>Explore</h3>
            <a href="#perguntas">Perguntas frequentes</a>
            <Link href="/demo">Demonstração</Link>
            <Link href="/login">Acessar minha conta</Link>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <span>© 2026 ONGSave · Cada alimento importa.</span>
          <span>Imagem de pessoas criada com IA para ilustrar a rede.</span>
          <a href="#conteudo">
            Voltar ao início
            <ArrowUpRight size={14} />
          </a>
        </div>
      </footer>
    </ScrollReveal>
  );
}
