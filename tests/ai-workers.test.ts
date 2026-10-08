import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { demoAnalysis } from "../src/lib/ai/demo-analysis";
import { analysisPrompt } from "../src/lib/ai/prompts";

const ai = { run: vi.fn() };
vi.mock("@opennextjs/cloudflare", () => ({ getCloudflareContext: () => ({ env: { AI: ai } }) }));
const { analyzeSurplus } = await import("../src/lib/ai/analyze-surplus");
const { extractJson, WORKERS_AI_DEFAULT_MODEL } =
  await import("../src/lib/ai/providers/workers-ai");

const photo = {
  image: readFileSync("e2e/fixtures/vegetables.jpg").toString("base64"),
  mimeType: "image/jpeg",
};
const fallback =
  "Não conseguimos analisar bem esta imagem. Tente novamente ou preencha manualmente.";

beforeEach(() => {
  ai.run.mockReset();
  vi.stubEnv("AI_MODE", "live");
  vi.stubEnv("AI_PROVIDER", "workers-ai");
  vi.stubEnv("AI_MODEL", "");
  vi.stubEnv("OPENAI_API_KEY", "");
});
afterEach(() => vi.unstubAllEnvs());

describe("Provider Workers AI", () => {
  it("resposta válida: mesmo prompt, foto em data URL e provider do servidor", async () => {
    ai.run.mockResolvedValue({ response: JSON.stringify(demoAnalysis) });
    expect(await analyzeSurplus(photo)).toEqual({
      analysis: demoAnalysis,
      provider: "workers-ai",
      model: WORKERS_AI_DEFAULT_MODEL,
    });
    const [model, request] = ai.run.mock.calls[0];
    expect(model).toBe("@cf/meta/llama-3.2-11b-vision-instruct");
    expect(request.messages[0]).toEqual({ role: "system", content: analysisPrompt });
    expect(request.image).toBe(`data:image/jpeg;base64,${photo.image}`);
  });

  it("aceita JSON embrulhado em texto e cercas de código", async () => {
    ai.run.mockResolvedValue({
      response: `Claro! Segue a análise:\n\`\`\`json\n${JSON.stringify(demoAnalysis)}\n\`\`\`\nRevise antes de publicar.`,
    });
    expect((await analyzeSurplus(photo)).analysis).toEqual(demoAnalysis);
    expect(extractJson('texto {"a":1} fim')).toEqual({ a: 1 });
  });

  it("aceita resposta já estruturada como objeto", async () => {
    ai.run.mockResolvedValue({ response: demoAnalysis });
    expect((await analyzeSurplus(photo)).analysis).toEqual(demoAnalysis);
  });

  it("na primeira chamada aceita a licença Meta e repete", async () => {
    ai.run
      .mockRejectedValueOnce(
        new Error("5016: Prior to using this model, you must submit the prompt 'agree'"),
      )
      .mockRejectedValueOnce(
        new Error("5016: Thank you for agreeing to this model's terms. You may now use the model."),
      )
      .mockResolvedValueOnce({ response: JSON.stringify(demoAnalysis) });
    expect((await analyzeSurplus(photo)).analysis).toEqual(demoAnalysis);
    expect(ai.run.mock.calls[1][1]).toEqual({ prompt: "agree" });
  });

  it.each([
    ["texto sem JSON", { response: "Vejo frutas e legumes." }],
    ["JSON incompleto", { response: "{}" }],
    ["confiança inválida", { response: JSON.stringify({ ...demoAnalysis, confidence: 2 }) }],
    ["resposta vazia", {}],
  ])("%s cai no preenchimento manual", async (_name, output) => {
    ai.run.mockResolvedValue(output);
    await expect(analyzeSurplus(photo)).rejects.toThrow(fallback);
  });

  it("erro do binding cai no preenchimento manual", async () => {
    ai.run.mockRejectedValue(new Error("3040: capacity temporarily exceeded"));
    await expect(analyzeSurplus(photo)).rejects.toThrow(fallback);
  });

  it("timeout de 45 s cai no preenchimento manual", async () => {
    vi.useFakeTimers();
    ai.run.mockReturnValue(new Promise(() => {}));
    const pending = expect(analyzeSurplus(photo)).rejects.toThrow(fallback);
    await vi.advanceTimersByTimeAsync(45000);
    await pending;
    vi.useRealTimers();
  });

  it("modo demo continua sem chamar o binding", async () => {
    vi.stubEnv("AI_MODE", "demo");
    expect((await analyzeSurplus(photo)).provider).toBe("demo");
    expect(ai.run).not.toHaveBeenCalled();
  });
});
