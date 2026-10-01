"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Camera,
  Check,
  CheckCheck,
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
  const camera = useRef<HTMLInputElement>(null);
  const gallery = useRef<HTMLInputElement>(null);
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );
  async function analyze(imagePath: string) {
    setStage("analyzing");
    setAiError("");
    try {
      const result = await post("/api/analyze", JSON.stringify({ path: imagePath }), true);
      setAnalysis(result.analysis);
      setAnalysisId(result.analysisId);
      setProvider(result.provider);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "Não conseguimos analisar bem esta imagem.");
    } finally {
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
      <div
        className="narrow panel stack"
        style={{ textAlign: "center", justifyItems: "center", padding: "45px 25px" }}
      >
        <span className="avatar" style={{ width: 65, height: 65 }}>
          <CheckCheck size={30} />
        </span>
        <span className="eyebrow muted">O primeiro passo está feito</span>
        <h1>Excedente publicado</h1>
        <h1 style={{ color: "var(--primary)", fontSize: 44 }}>
          {number(analysis.estimated_weight_kg)} kg
        </h1>
        <p className="muted">≈ {number(analysis.estimated_weight_kg * 2)} refeições estimadas</p>
        <p className="small muted" style={{ lineHeight: 1.7 }}>
          Estamos disponibilizando este lote para instituições compatíveis. Você acompanha cada
          etapa por aqui.
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
    <div className="narrow stack">
      <div className="stepper" aria-label="Etapas do cadastro">
        {[0, 1, 2].map((n) => (
          <span
            key={n}
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
          />
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
              : "Um novo destino começa aqui."}
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
        <div className="panel stack" style={{ padding: 35 }}>
          <LoaderCircle className="spin" color="var(--primary)" size={32} />
          {[
            "Identificando alimentos",
            "Classificando categoria",
            "Estimando quantidade",
            "Avaliando condição visual aparente",
            "Calculando impacto",
          ].map((t) => (
            <div className="row muted small" key={t}>
              <Sparkles size={15} />
              {t}
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
            <FoodPhoto url={preview} title="Fotografia do excedente" />
          </div>
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
            <div className="grid grid-cols-2 gap-4">
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
            <h3>Itens identificados</h3>
            {analysis.items.map((item, i) => (
              <div className="row" key={i}>
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
                  style={{ width: 90 }}
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
                    setAnalysis({ ...analysis, items: analysis.items.filter((_, n) => n !== i) })
                  }
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              disabled={analysis.items.length >= 30}
              onClick={() =>
                setAnalysis({
                  ...analysis,
                  items: [...analysis.items, { name: "", estimated_quantity: 1, confidence: 0 }],
                })
              }
            >
              <Plus size={16} />
              Adicionar item
            </Button>
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
            <div className="grid grid-cols-2 gap-4">
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
                    setAnalysis({ ...analysis, recommended_pickup_hours: Number(e.target.value) })
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
                Confirmo que revisei as informações e que os alimentos atendem às condições internas
                da unidade para doação.
              </span>
            </label>
            <Button type="submit" disabled={!confirmed || busy}>
              {busy ? <LoaderCircle className="spin" size={18} /> : "Confirmar e publicar"}
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
