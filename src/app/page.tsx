import Link from "next/link";
import {
  ArrowUpRight,
  Camera,
  HeartHandshake,
  Leaf,
  MoveRight,
  PackageCheck,
  Truck,
} from "lucide-react";
import { Brand } from "@/components/shared";
import { Button } from "@/components/ui/button";
const steps = [
  {
    Icon: Camera,
    title: "01 / Registre",
    text: "Fotografe o excedente. A análise visual ajuda sua equipe a revisar e publicar.",
  },
  {
    Icon: HeartHandshake,
    title: "02 / Conecte",
    text: "Instituições encontram e reservam alimentos compatíveis com sua capacidade.",
  },
  {
    Icon: Truck,
    title: "03 / Resgate",
    text: "Motoristas coletam e entregam. Um código confirma o recebimento e registra o impacto.",
  },
];
export default function Landing() {
  return (
    <div className="landing">
      <header className="landing-header">
        <Brand />
        <Button render={<Link href="/login" />} nativeButton={false} variant="outline">
          Entrar <ArrowUpRight size={16} />
        </Button>
      </header>
      <main>
        <section className="hero">
          <div>
            <span className="pill">
              <Leaf size={13} /> Menos desperdício. Mais possibilidades.
            </span>
            <h1>
              Alimentos merecem
              <br />
              um <em>novo destino.</em>
            </h1>
            <p>
              Uma fotografia conecta o excedente do seu mercado a quem precisa. Nós aproximamos as
              pessoas que tornam o resgate possível.
            </p>
            <div className="row" style={{ marginTop: 30 }}>
              <Button render={<Link href="/login" />} nativeButton={false}>
                Começar um resgate <MoveRight size={16} />
              </Button>
            </div>
            <p className="small" style={{ marginTop: 24 }}>
              Supermercados, instituições e motoristas. Juntos.
            </p>
          </div>
          <div className="hero-art">
            <span className="eyebrow" style={{ color: "#527654" }}>
              O próximo destino é a esperança
            </span>
            <div className="panel stack">
              <div className="between">
                <span className="row">
                  <span className="avatar">
                    <Camera size={18} />
                  </span>
                  <span className="small">Tudo começa com uma foto</span>
                </span>
                <span className="pill">Disponível</span>
              </div>
              <div className="row">
                <Leaf size={70} color="#399756" />
                <div>
                  <h2>Hortifrúti misto</h2>
                  <p className="small" style={{ marginTop: 6 }}>
                    Revisado pela equipe do mercado
                  </p>
                </div>
              </div>
              <div className="between">
                <h1>
                  38{" "}
                  <span className="muted" style={{ fontSize: 18 }}>
                    kg
                  </span>
                </h1>
                <span className="small muted">≈ 76 refeições estimadas</span>
              </div>
            </div>
            <div className="panel row" style={{ marginLeft: 35 }}>
              <HeartHandshake color="#15803d" />
              <div>
                <h3>Uma rede que faz acontecer</h3>
                <p className="small muted" style={{ marginTop: 5 }}>
                  Do excedente à mesa, com propósito.
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className="landing-flow">
          {steps.map(({ Icon, title, text }) => (
            <div key={title}>
              <Icon size={25} color="#15803d" />
              <h2 style={{ marginTop: 18 }}>{title}</h2>
              <p>{text}</p>
            </div>
          ))}
        </section>
      </main>
      <footer className="footer between">
        <span>ONGSave · Uma fotografia inicia um resgate completo.</span>
        <PackageCheck size={18} />
      </footer>
    </div>
  );
}
