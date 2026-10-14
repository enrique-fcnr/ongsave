"use client";
import { FormSections, PagedItems } from "./screen-sections";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Camera,
  ArrowLeft,
  Check,
  CheckCheck,
  CircleCheck,
  ImagePlus,
  LoaderCircle,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { preparePhoto } from "@/lib/prepare-photo";
import { FoodPhoto } from "./shared";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import type { SurplusAnalysis } from "@/lib/ai/types";
import { publicationSchema } from "@/lib/ai/schema";
import { categories, categoryLabels, conditions, number, priorities } from "@/lib/domain";
const manual: SurplusAnalysis = {
  title: "",
  category: "other",
  items: [],
  estimated_weight_kg: 1,
  estimated_weight_range: { min: 0, max: 5000 },
  visual_condition: "inconclusive",
  pickup_priority: "medium",
  recommended_pickup_hours: 8,
  confidence: 0,
  warnings: [],
};
const analysisSteps = [
  "Identificando alimentos",
  "Classificando categoria",
  "Estimando quantidade",
  "Avaliando condição visual aparente",
  "Organizando a sugestão de revisão",
];
async function post(url: string, body: BodyInit, isJson = false) {
  const r = await fetch(url, {
    method: "POST",
    body,
    headers: isJson ? { "Content-Type": "application/json" } : undefined,
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || "Não foi possível concluir a operação.");
  return data;
}
export function SurplusForm() {
  const [stage, setStage] = useState<"photo" | "analyzing" | "review" | "published">("photo");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState("");
  const [path, setPath] = useState("");
  const [analysisId, setAnalysisId] = useState("");
  const [analysis, setAnalysis] = useState<SurplusAnalysis>(manual);
  const [provider, setProvider] = useState("manual");
  const [error, setError] = useState("");
  const [aiError, setAiError] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [batchId, setBatchId] = useState("");
  const [analysisReady, setAnalysisReady] = useState(false);
  const [completedSteps, setCompletedSteps] = useState(0);
  const camera = useRef<HTMLInputElement>(null);
  const gallery = useRef<HTMLInputElement>(null);
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );
  useEffect(() => {
    if (stage !== "analyzing" || !analysisReady) return;
    const timer = window.setTimeout(() => {
      if (completedSteps < analysisSteps.length) setCompletedSteps((count) => count + 1);
      else setStage("review");
    }, completedSteps === analysisSteps.length ? 600 : 220);
    return () => window.clearTimeout(timer);
  }, [stage, analysisReady, completedSteps]);
  async function analyze(imagePath: string) {
    setAnalysisReady(false);
    setCompletedSteps(0);
    setStage("analyzing");
    setAiError("");
    try {
      const result = await post("/api/analyze", JSON.stringify({ path: imagePath }), true);
      setAnalysis(result.analysis);
      setAnalysisId(result.analysisId);
      setProvider(result.provider);
      setAnalysisReady(true);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "Não conseguimos analisar bem esta imagem.");
      setStage("review");
    }
  }
  async function select(file?: File) {
    if (!file) return;
    setError("");
    setBusy(true);
    setPreview(URL.createObjectURL(file));
    setAnalysis({ ...manual });
    setConfirmed(false);
    setProvider("manual");
    try {
      const form = new FormData();
      const photo = await preparePhoto(file);
      setPreview(URL.createObjectURL(photo));
      form.set("file", photo);
      const upload = await post("/api/upload", form);
      setPath(upload.path);
      setAnalysisId(upload.analysisId);
      await analyze(upload.path);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível enviar a fotografia.");
      setStage("photo");
    } finally {
      setBusy(false);
    }
  }
  if (stage === "published")
    return (
      <div className="narrow panel stack published-state">
        <span className="avatar">
          <CheckCheck size={30} />
        </span>
        <span className="eyebrow muted">O primeiro passo está feito</span>
        <h1>Excedente publicado</h1>
        <div className="detail-weight">{number(analysis.estimated_weight_kg)} kg</div>
        <p className="muted">≈ {number(analysis.estimated_weight_kg * 2)} refeições estimadas</p>
        <p className="small muted" style={{ lineHeight: 1.7 }}>
          Seu lote já pode ser encontrado pelas instituições. Acompanhe a reserva, a coleta e a
          entrega por aqui.
        </p>
        <Button render={<Link href={`/supermarket/surplus/${batchId}`} />} nativeButton={false}>
          Acompanhar doação
        </Button>
        <Link className="small muted" href="/home">
          Voltar ao início
        </Link>
      </div>
    );
  return (
    <div className={`narrow stack surplus-workflow ${stage === "review" ? "surplus-review" : ""}`}>
      <Link href="/home" className="back">
        <ArrowLeft size={16} />
        Voltar ao início
      </Link>
      <div className="stepper" aria-label="Etapas do cadastro">
        {["Fotografia", "Análise", "Revisão"].map((label, n) => (
          <span
            key={n}
            aria-current={
              (stage === "photo" ? 0 : stage === "analyzing" ? 1 : 2) === n ? "step" : undefined
            }
            className={
              stage === "photo"
                ? n === 0
                  ? "done"
                  : ""
                : stage === "analyzing"
                  ? n < 2
                    ? "done"
                    : ""
                  : "done"
            }
          >
            <b>{n + 1}</b>
            {label}
          </span>
        ))}
      </div>
      <div className="title-block">
        <span className="eyebrow muted">
          {stage === "photo"
            ? "01 / Fotografia"
            : stage === "analyzing"
              ? "02 / Análise visual"
              : "03 / Revisão da equipe"}
        </span>
        <h1>
          {stage === "photo"
            ? "Registre o excedente"
            : stage === "analyzing"
              ? "Analisando excedente"
              : "Revise antes de publicar"}
        </h1>
        <p>
          {stage === "photo"
            ? "Fotografe os alimentos que serão disponibilizados."
            : stage === "analyzing"
              ? "Preparando uma sugestão para sua equipe revisar."
              : "Confira e corrija as informações antes de publicar."}
        </p>
      </div>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {stage === "photo" ? (
        <>
          <div className="camera-zone">
            <Camera size={48} strokeWidth={1.3} color="var(--primary)" />
            <h3>Enquadre todos os alimentos</h3>
            <p className="small muted">Boa iluminação ajuda na análise visual.</p>
            <Button disabled={busy} onClick={() => camera.current?.click()}>
              {busy ? <LoaderCircle className="spin" /> : <Camera size={18} />}Tirar foto
            </Button>
            <Button variant="ghost" disabled={busy} onClick={() => gallery.current?.click()}>
              <ImagePlus size={18} />
              Selecionar da galeria
            </Button>
          </div>
          <input
            ref={camera}
            hidden
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => void select(e.target.files?.[0])}
          />
          <input
            ref={gallery}
            hidden
            type="file"
            accept="image/*"
            onChange={(e) => void select(e.target.files?.[0])}
          />
          <p className="small muted">JPEG, PNG ou WebP · Até 4 MB</p>
        </>
      ) : stage === "analyzing" ? (
        <div className="panel stack analysis-progress">
          <p className="row small" role="status" aria-live="polite">
            {completedSteps === analysisSteps.length ? (
              <CircleCheck color="var(--primary)" size={24} aria-hidden="true" />
            ) : (
              <LoaderCircle className="spin" color="var(--primary)" size={24} aria-hidden="true" />
            )}
            {completedSteps === analysisSteps.length
              ? "Sugestão pronta para revisar"
              : "Preparando as informações do alimento"}
          </p>
          <ul className="analysis-steps" aria-label="Progresso da análise">
            {analysisSteps.map((label, index) => {
              const done = index < completedSteps;
              return (
                <li className={`analysis-step small${done ? " is-complete" : ""}`} key={label}>
                  <Sparkles size={15} aria-hidden="true" />
                  <span>{label}</span>
                  <span className="analysis-step-status" aria-label={done ? "Concluído" : "Analisando"}>
                    {done ? (
                      <CircleCheck size={20} aria-hidden="true" />
                    ) : (
                      <LoaderCircle className="spin" size={18} aria-hidden="true" />
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <>
          <div className="between">
            <span className="pill">
              <Check size={13} />
              {provider === "manual"
                ? "Preenchimento manual"
                : provider === "demo"
                  ? "Análise de demonstração"
                  : "Análise concluída"}
            </span>
            <Button
              variant="ghost"
              onClick={() => {
                setStage("photo");
                setAiError("");
                setError("");
              }}
            >
              Outra foto
            </Button>
          </div>
          {aiError && (
            <div className="error stack" style={{ gap: 12 }}>
              <p>{aiError}</p>
              <div className="row">
                <Button variant="outline" disabled={busy} onClick={() => void analyze(path)}>
                  Tentar novamente
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setAiError("");
                    setProvider("manual");
                  }}
                >
                  Preencher manualmente
                </Button>
              </div>
            </div>
          )}
          <form
            className="form-grid"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError("");
              try {
                const form = new FormData(e.currentTarget);
                const payload = publicationSchema.parse({
                  title: analysis.title,
                  category: analysis.category,
                  description: form.get("description") || "",
                  estimated_weight_kg: analysis.estimated_weight_kg,
                  pickup_priority: analysis.pickup_priority,
                  recommended_pickup_hours: analysis.recommended_pickup_hours,
                  visual_condition: analysis.visual_condition,
                  user_confirmed: confirmed,
                  items: analysis.items,
                });
                const result = await post(
                  "/api/batches",
                  JSON.stringify({ payload, analysisId }),
                  true,
                );
                setBatchId(result.id);
                setStage("published");
              } catch (e) {
                setError(e instanceof Error ? e.message : "Revise os campos e tente novamente.");
              } finally {
                setBusy(false);
              }
            }}
          >
            <FormSections
              labels={["Dados do lote", "Itens", "Condição", "Coleta", "Confirmar", "Foto"]}
            >
              <fieldset className="form-section">
                <legend>Dados do lote</legend>
                <p>Confira o alimento, a categoria e o peso que será disponibilizado.</p>
                <label className="field">
                  Título
                  <Input
                    required
                    minLength={3}
                    maxLength={120}
                    value={analysis.title}
                    onChange={(e) => setAnalysis({ ...analysis, title: e.target.value })}
                    placeholder="Ex.: Hortifrúti misto"
                  />
                </label>
                <div className="form-columns">
                  <label className="field">
                    Categoria
                    <select
                      aria-label="Categoria"
                      value={analysis.category}
                      onChange={(e) =>
                        setAnalysis({
                          ...analysis,
                          category: e.target.value as SurplusAnalysis["category"],
                        })
                      }
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {categoryLabels[c]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    Peso revisado (kg)
                    <Input
                      type="number"
                      min="0.1"
                      max="5000"
                      step="0.1"
                      required
                      value={analysis.estimated_weight_kg}
                      onChange={(e) =>
                        setAnalysis({ ...analysis, estimated_weight_kg: Number(e.target.value) })
                      }
                    />
                  </label>
                </div>
                {provider !== "manual" && (
                  <p className="small muted">
                    Faixa sugerida: {number(analysis.estimated_weight_range.min)}–
                    {number(analysis.estimated_weight_range.max)} kg · Confiança:{" "}
                    {Math.round(analysis.confidence * 100)}%
                  </p>
                )}
              </fieldset>
              <fieldset className="form-section">
                <legend>Itens do lote</legend>
                <p>Revise os nomes e as quantidades. Você pode incluir ou remover itens.</p>
                <PagedItems pageSize={3} mobilePageSize={2} label="Itens do lote">
                  {analysis.items.map((item, i) => (
                    <div className="row item-fields" key={i}>
                      <Input
                        aria-label={`Nome do item ${i + 1}`}
                        value={item.name}
                        required
                        onChange={(e) =>
                          setAnalysis({
                            ...analysis,
                            items: analysis.items.map((it, n) =>
                              n === i ? { ...it, name: e.target.value } : it,
                            ),
                          })
                        }
                      />
                      <Input
                        aria-label={`Quantidade do item ${i + 1}`}
                        className="item-quantity"
                        type="number"
                        min="0"
                        value={item.estimated_quantity}
                        onChange={(e) =>
                          setAnalysis({
                            ...analysis,
                            items: analysis.items.map((it, n) =>
                              n === i ? { ...it, estimated_quantity: Number(e.target.value) } : it,
                            ),
                          })
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Remover ${item.name}`}
                        onClick={() =>
                          setAnalysis({
                            ...analysis,
                            items: analysis.items.filter((_, n) => n !== i),
                          })
                        }
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ))}
                </PagedItems>
                <Button
                  type="button"
                  variant="outline"
                  disabled={analysis.items.length >= 30}
                  onClick={() =>
                    setAnalysis({
                      ...analysis,
                      items: [
                        ...analysis.items,
                        { name: "", estimated_quantity: 1, confidence: 0 },
                      ],
                    })
                  }
                >
                  <Plus size={16} />
                  Adicionar item
                </Button>
              </fieldset>
              <fieldset className="form-section">
                <legend>Condição do alimento</legend>
                <p>Confira a condição visual aparente e avalie o alimento com sua equipe.</p>
                <label className="field">
                  Condição visual aparente
                  <select
                    aria-label="Condição visual aparente"
                    value={analysis.visual_condition}
                    onChange={(e) =>
                      setAnalysis({
                        ...analysis,
                        visual_condition: e.target.value as SurplusAnalysis["visual_condition"],
                      })
                    }
                  >
                    {Object.entries(conditions).map(([v, t]) => (
                      <option key={v} value={v}>
                        {t}
                      </option>
                    ))}
                  </select>
                </label>
              </fieldset>
              <fieldset className="form-section">
                <legend>Informações de coleta</legend>
                <p>Defina o prazo de coleta e os cuidados de transporte.</p>
                <div className="form-columns">
                  <label className="field">
                    Prioridade
                    <select
                      aria-label="Prioridade"
                      value={analysis.pickup_priority}
                      onChange={(e) =>
                        setAnalysis({
                          ...analysis,
                          pickup_priority: e.target.value as SurplusAnalysis["pickup_priority"],
                        })
                      }
                    >
                      {Object.entries(priorities).map(([v, t]) => (
                        <option key={v} value={v}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    Retirar em até (horas)
                    <Input
                      type="number"
                      required
                      min="1"
                      max="72"
                      value={analysis.recommended_pickup_hours}
                      onChange={(e) =>
                        setAnalysis({
                          ...analysis,
                          recommended_pickup_hours: Number(e.target.value),
                        })
                      }
                    />
                  </label>
                </div>
                <label className="field">
                  Observações de coleta
                  <textarea
                    name="description"
                    maxLength={1000}
                    placeholder="Embalagem, acesso e cuidados para retirada"
                  />
                </label>
              </fieldset>
              <fieldset className="form-section">
                <legend>Revisão da equipe</legend>
                {analysis.warnings.map((w, i) => (
                  <p key={i} className="small muted">
                    {w}
                  </p>
                ))}
                <p className="notice">
                  A análise visual não substitui a avaliação da equipe responsável pelo alimento.
                </p>
                <label className="check-label">
                  <input
                    type="checkbox"
                    required
                    checked={confirmed}
                    onChange={(e) => setConfirmed(e.target.checked)}
                  />
                  <span>
                    Confirmo que revisei as informações e que os alimentos atendem às condições
                    internas da unidade para doação.
                  </span>
                </label>
                <Button type="submit" disabled={!confirmed || busy}>
                  {busy ? <LoaderCircle className="spin" size={18} /> : "Confirmar e publicar"}
                </Button>
              </fieldset>
              <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
                <FoodPhoto url={preview} title="Fotografia do excedente" />
              </div>
            </FormSections>
          </form>
        </>
      )}
    </div>
  );
}
