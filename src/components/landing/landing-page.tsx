import Link from "next/link";
import Image from "next/image";
import type { CSSProperties } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  ChartNoAxesCombined,
  Check,
  ChevronDown,
  CircleCheck,
  Clock3,
  FileChartColumn,
  HeartHandshake,
  HandCoins,
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
    eyebrow: "Onde o desperdício pode ser evitado",
    title: "Evite que alimentos bons terminem no aterro.",
    body: "Dê destino a excedentes próprios para consumo e conecte sua loja a instituições que precisam de alimentos.",
    items: [
      "Aproveite alimentos antes do descarte",
      "Conecte excedentes a quem pode recebê-los",
      "Comprove o destino dos alimentos doados",
    ],
    cta: "Área do supermercado",
  },
  {
    Icon: HeartHandshake,
    name: "Instituições",
    eyebrow: "Alimento chegando a quem precisa",
    title: "Amplie o atendimento com alimentos aproveitados.",
    body: "Acesse excedentes doados por mercados e receba alimentos adequados à capacidade da sua instituição.",
    items: [
      "Encontre alimentos disponíveis para doação",
      "Escolha volumes que consegue distribuir",
      "Confirme o que chegou à instituição",
    ],
    cta: "Área da instituição",
  },
  {
    Icon: Truck,
    name: "Motoristas",
    eyebrow: "O elo entre o excedente e a mesa",
    title: "Leve alimento de onde sobra para onde faz falta.",
    body: "Cada entrega aproxima alimentos ainda próprios para consumo das instituições que atendem pessoas.",
    items: [
      "Ajude a evitar o descarte de alimentos",
      "Conecte coleta e destino social",
      "Faça a doação chegar a quem precisa",
    ],
    cta: "Área do motorista",
  },
];
const faqs = [
  {
    question: "Como a ONGSave ajuda a combater o desperdício e a fome?",
    answer:
      "A ONGSave organiza a conexão entre mercados com excedentes, instituições que atendem pessoas e motoristas que fazem as entregas. Assim, alimentos próprios para consumo podem chegar a um novo destino antes de serem descartados.",
  },
  {
    question: "Como o alimento que iria para descarte chega a uma instituição?",
    answer:
      "O mercado informa quais alimentos ainda podem ser aproveitados. Uma instituição escolhe o que consegue receber, e um motorista conecta o ponto de coleta ao destino social.",
  },
  {
    question: "Como vocês evitam que um alimento inadequado seja doado?",
    answer:
      "A equipe do mercado confere as condições, a quantidade e o prazo antes de oferecer o excedente. A decisão de doar continua com quem conhece e responde pelo alimento.",
  },
  {
    question: "Como saber se a doação realmente chegou?",
    answer:
      "A instituição confirma o recebimento por um código. Esse registro mostra que os alimentos chegaram ao destino e conclui a entrega.",
  },
  {
    question: "Como a ONGSave mostra o resultado das doações?",
    answer:
      "O peso entregue e as doações concluídas vêm dos registros da operação. Refeições e economia são estimativas calculadas a partir desses dados e aparecem identificadas como estimativas.",
  },
  {
    question: "Posso conhecer a plataforma antes de participar?",
    answer: (
      <>
        Sim. O <Link href="/demo">ambiente de demonstração</Link> mostra como os diferentes
        participantes ajudam a fazer o alimento chegar ao destino. O acesso à operação é destinado
        a participantes cadastrados.
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
              <span>Menos desperdício. Mais alimento na mesa.</span>
            </div>
            <h1 id="landing-title">
              Menos comida no lixo.
              <br />
              mais <span>alimento na mesa.</span>
            </h1>
            <p>
              A ONGSave conecta excedentes próprios para consumo a instituições que atendem pessoas.
              <br className={styles.desktopBreak} /> Uma rede organiza o caminho para a doação chegar a tempo.
            </p>
            <div className={styles.heroActions}>
              <Link href="/login" className={`${styles.cta} ${styles.lightCta}`}>
                Ajudar a fazer o alimento chegar
                <ArrowRight size={18} />
              </Link>
              <a href="#plataforma" className={styles.outlineCta}>
                Ver como a solução funciona
                <ArrowUpRight size={17} />
              </a>
            </div>
            <div className={styles.heroNote}>
              <CircleCheck size={14} />
              Alimento aproveitado. Mais pessoas atendidas.
            </div>
          </div>
          <div className={styles.heroPreview}>
            <DashboardPreview />
            <div className={styles.floatingNotice}>
              <span>
                <PackageCheck size={19} />
              </span>
              <div>
                <strong>Alimento a caminho de quem precisa.</strong>
                <small>Menos descarte. Mais comida aproveitada.</small>
              </div>
              <Check size={16} />
            </div>
          </div>
        </section>

        <section className={styles.networkStrip} aria-label="Participantes da rede">
          <p>
            Três pontas.
            <br />
            <strong>Uma rede contra o desperdício de alimentos.</strong>
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
            title="Alimento bom ainda é perdido quando a doação não chega a tempo."
            body="Excedentes têm prazo curto. Sem uma conexão entre quem doa, quem precisa receber e quem transporta, alimentos próprios para consumo podem acabar no descarte."
          />
          <ProblemTicker />
          <p className={styles.bridgeText}>
            A ONGSave encurta o caminho entre o excedente e quem precisa.
            <ArrowRight size={20} />
          </p>
        </section>

        <section className={`${styles.section} ${styles.platformSection}`} id="plataforma">
          <SectionHeading
            label="A plataforma"
            title="Um caminho organizado para o alimento não se perder."
            body="A ONGSave conecta mercados, instituições e motoristas para levar excedentes próprios para consumo a pessoas que precisam de alimento."
          />
          <div data-reveal>
            <FeatureExplorer />
          </div>
        </section>

        <section className={`${styles.section} ${styles.benefitSection}`} id="beneficios">
          <SectionHeading
            label="O que muda na prática"
            title="Menos alimento descartado. Mais doações que chegam."
            body="A rede aproxima quem tem excedentes de quem precisa recebê-los e dá visibilidade ao que foi aproveitado."
          />
          <div className={styles.benefitGrid}>
            {[
              {
                Icon: Clock3,
                title: "Aproveitamento antes do descarte",
                text: "Alimentos próprios para consumo encontram um destino social enquanto ainda podem ser aproveitados.",
              },
              {
                Icon: ShieldCheck,
                title: "Doação que chega ao destino",
                text: "A conexão entre mercado, instituição e motorista ajuda a evitar que o alimento se perca no caminho.",
              },
              {
                Icon: ChartNoAxesCombined,
                title: "Resultado que pode ser acompanhado",
                text: "Registros de peso e entregas confirmadas mostram quanto alimento foi aproveitado; refeições são estimativas.",
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
            title="Do excedente ao destino social, sem perder tempo."
            body="O alimento é identificado, destinado a uma instituição e levado por um motorista até quem precisa."
          />
          <div data-reveal>
            <ProcessExplorer />
          </div>
        </section>

        <section className={styles.section} id="video">
          <SectionHeading
            label="A solução em ação"
            title="Veja como um excedente pode virar alimento aproveitado."
            body="Conheça o caminho que conecta mercados, instituições e motoristas para evitar o descarte de alimentos."
          />
          <video
            className={styles.landingVideo}
            controls
            playsInline
            preload="metadata"
            aria-label="Vídeo de apresentação da ONGSave"
            data-reveal
          >
            <source src="/landing/ongsave-apresentacao.mp4" type="video/mp4" />
            Seu navegador não oferece suporte à reprodução de vídeo.
          </video>
        </section>

        <section className={styles.peopleSection} id="nossa-rede">
          <div className={styles.peopleCopy} data-reveal>
            <span className={styles.sectionTag}>
              <Users size={14} />
              Pessoas unidas para evitar o desperdício
            </span>
            <h2>
              Para que o alimento não se perca,
              <br />
              tem gente.
            </h2>
            <p>
              Equipes de mercados separam excedentes, instituições recebem o que podem distribuir e
              motoristas fazem a entrega. A ONGSave aproxima essas pessoas para que mais alimentos
              cheguem a quem precisa.
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
              Ajude a resolver esse problema
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
            label="Quem faz a solução acontecer"
            title="Cada participante ajuda a levar alimento a quem precisa."
            body="Mercados, instituições e motoristas atuam em conjunto para aproveitar excedentes e fazer as doações chegarem ao destino."
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

        <section className={`${styles.section} ${styles.businessSection}`} id="modelo-de-negocio">
          <SectionHeading
            label="Como mantemos a solução em funcionamento"
            title="Três fontes sustentam o caminho do alimento."
            body="Mensalidades, apoio financeiro e contratos por projeto ajudam a manter a operação e a custear entregas entre os pontos da rede."
          />
          <div className={styles.businessGrid}>
            <article data-reveal>
              <span>
                <Store size={22} />
              </span>
              <small>01 · Mensalidades que apoiam a operação</small>
              <h3>Planos para supermercados</h3>
              <p>
                A proposta é redirecionar para a ONGSave parte do orçamento que seria usado no
                descarte dos excedentes em aterro. Os planos apoiam a operação que conecta alimentos
                ainda próprios para consumo a pessoas e instituições que precisam deles.
              </p>
              <div className={styles.planPrices} aria-label="Mensalidades por porte">
                <div><span>Pequeno porte</span><strong>R$ 299 <small>/ mês</small></strong></div>
                <div><span>Médio porte</span><strong>R$ 499 <small>/ mês</small></strong></div>
                <div><span>Grande porte</span><strong>R$ 999 <small>/ mês</small></strong></div>
              </div>
            </article>
            <article data-reveal>
              <span>
                <HandCoins size={22} />
              </span>
              <small>02 · Recursos para fazer as doações chegarem</small>
              <h3>Doações financeiras de empresas</h3>
              <p>
                Empresas de diferentes setores podem apoiar o custeio das entregas e ajudar a
                superar uma barreira central: levar excedentes de onde estão a instituições que
                precisam recebê-los. Na operação real, os recursos devem ser destinados por meio de
                uma OSC parceira apta a recebê-los e prestar contas.
              </p>
              <p className={styles.businessFinePrint}>
                A Lei 9.249/1995 prevê, em hipóteses específicas, dedução da base de cálculo como
                despesa operacional — para empresas no lucro real, até o limite legal e quando a
                entidade beneficiária cumpre os requisitos. Isso não é desconto direto do imposto
                devido.{" "}
                <a
                  href="https://planalto.gov.br/ccivil_03/leis/l9249.htm"
                  target="_blank"
                  rel="noreferrer"
                >
                  Lei 9.249/1995
                </a>{" "}
                ·{" "}
                <a
                  href="https://normas.receita.fazenda.gov.br/sijut2consulta/anexoOutros.action?idArquivoBinario=50185"
                  target="_blank"
                  rel="noreferrer"
                >
                  Solução de Consulta da Receita
                </a>
              </p>
            </article>
            <article data-reveal>
              <span>
                <FileChartColumn size={22} />
              </span>
              <small>03 · Projetos para ampliar o alcance</small>
              <h3>Contratações públicas</h3>
              <p>
                Editais e contratos públicos podem apoiar soluções de logística social e ampliar o
                alcance das entregas, conforme os requisitos de cada oportunidade. Parcerias com
                organizações da sociedade civil também podem seguir o MROSC, por um caminho
                diferente da contratação comercial.
              </p>
            </article>
          </div>
          <p className={styles.businessFootnote}>
            As três frentes sustentam os custos para conectar excedentes a instituições e custear
            motoristas conforme as entregas e o orçamento de cada projeto. Valores e exemplos da
            plataforma são demonstrativos.
          </p>
          <aside className={styles.esgRecognition} data-reveal aria-labelledby="esg-recognition-title">
            <div className={styles.esgSeal} aria-hidden="true">
              <BadgeCheck size={32} />
              <span>ONGSave</span>
              <small>CERTIFICAÇÃO ESG</small>
            </div>
            <div className={styles.esgRecognitionCopy}>
              <span className={styles.sectionTag}>Programa de certificação ONGSave</span>
              <h3 id="esg-recognition-title">Certificação ESG ONGSave</h3>
              <p>
                Empresas que comprovam sua participação na rede podem receber o certificado ESG
                ONGSave do período, acompanhado de um selo digital e de um relatório com indicadores
                verificados de suas ações.
              </p>
              <p>
                A avaliação considera três dimensões: ambiental, com alimentos desviados do descarte
                e estimativas associadas; social, com alimentos destinados e instituições atendidas;
                e governança, com rastreabilidade, confirmações e prestação de contas das ações na
                plataforma. A emissão depende da validação dos registros e informa o período e os
                critérios avaliados.
              </p>
              <p className={styles.esgRecognitionNote}>
                Certificação própria do programa ONGSave, limitada às ações e aos indicadores
                acompanhados pela rede. Não substitui uma auditoria ESG independente nem certificações
                de terceiros, e não representa avaliação completa de todas as operações da empresa.{" "}
                <a
                  href="https://www.b3.com.br/pt_br/market-data-e-indices/indices/indices-de-sustentabilidade/indice-de-sustentabilidade-empresarial-ise-b3.htm"
                  target="_blank"
                  rel="noreferrer"
                >
                  Veja como funciona o ISE B3
                </a>
              </p>
            </div>
          </aside>
        </section>

        <section className={styles.impactSection} id="impacto">
          <div data-reveal>
            <span className={styles.sectionTag}>
              <Leaf size={14} />
              O alimento aproveitado faz diferença
            </span>
            <h2>
              Menos alimento perdido.
              <br />Mais destinos possíveis.
            </h2>
            <p>
              Cada recebimento confirmado mostra que um alimento próprio para consumo chegou a uma
              instituição. Os registros ajudam a acompanhar o que foi aproveitado e distribuído.
            </p>
            <Link href="/login" className={styles.textLink}>
              Acompanhar os resultados
              <ArrowRight size={17} />
            </Link>
          </div>
          <div className={styles.impactExample} data-reveal>
            <span className={styles.miniEyebrow}>O que uma entrega pode representar</span>
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
              Alimento aproveitado. Entrega confirmada.
            </div>
            <p className={styles.previewFootnote}>
              Exemplo ilustrativo. Refeições são estimativas a partir do peso entregue.
            </p>
          </div>
        </section>

        <section className={`${styles.section} ${styles.faqSection}`} id="perguntas">
          <SectionHeading
            label="Perguntas frequentes"
            title="Como ajudamos o alimento a chegar a quem precisa?"
            body="Entenda como a ONGSave enfrenta o desperdício e organiza a destinação de excedentes."
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
              Ajude a fazer o alimento chegar
              <br />
              a quem precisa.
            </h2>
            <p>
              Evite o descarte de alimentos e aproxime excedentes de
              <br className={styles.desktopBreak} /> instituições que atendem pessoas.
            </p>
            <div className={styles.heroActions}>
              <Link href="/login" className={`${styles.cta} ${styles.lightCta}`}>
                Fazer parte da solução
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
              Menos excedentes desperdiçados.
              <br />
              Mais alimentos chegando a quem precisa.
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
