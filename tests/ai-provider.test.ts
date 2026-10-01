import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { analyzeSurplus } from "../src/lib/ai/analyze-surplus";
import { demoAnalysis } from "../src/lib/ai/demo-analysis";
import { analysisPrompt } from "../src/lib/ai/prompts";

const photo = {
  image: readFileSync("e2e/fixtures/vegetables.jpg").toString("base64"),
  mimeType: "image/jpeg",
};
const fallback =
  "Não conseguimos analisar bem esta imagem. Tente novamente ou preencha manualmente.";
const completion = (content: string) => Response.json({ choices: [{ message: { content } }] });

beforeEach(() => {
  vi.stubEnv("AI_MODE", "live");
  vi.stubEnv("AI_PROVIDER", "openai");
  vi.stubEnv("AI_MODEL", "gpt-4.1-mini");
  vi.stubEnv("OPENAI_API_KEY", "test-only-key");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("Provider multimodal e recuperação de falhas", () => {
  it("envia a fotografia ao provider e valida JSON antes de devolver a análise", async () => {
    const fetchMock = vi.fn().mockResolvedValue(completion(JSON.stringify(demoAnalysis)));
    vi.stubGlobal("fetch", fetchMock);
    const result = await analyzeSurplus(photo);
    expect(result).toEqual({ analysis: demoAnalysis, provider: "openai", model: "gpt-4.1-mini" });
    const [url, request] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.openai.com/v1/chat/completions");
    expect(request.method).toBe("POST");
    expect(request.headers.Authorization).toBe("Bearer test-only-key");
    expect(request.signal).toBeInstanceOf(AbortSignal);
    const body = JSON.parse(request.body);
    expect(body.model).toBe("gpt-4.1-mini");
    expect(body.response_format).toEqual({ type: "json_object" });
    expect(body.messages[0]).toEqual({ role: "system", content: analysisPrompt });
    expect(body.messages[1].content[1]).toEqual({
      type: "image_url",
      image_url: { url: `data:image/jpeg;base64,${photo.image}`, detail: "low" },
    });
  });

  it("modo demo usa fixture validada sem chamar a rede nem exigir chave", async () => {
    vi.stubEnv("AI_MODE", "demo");
    vi.stubEnv("OPENAI_API_KEY", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect(await analyzeSurplus(photo)).toEqual({
      analysis: demoAnalysis,
      provider: "demo",
      model: "fixture-v1",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    ["HTTP 429", () => Promise.resolve(new Response("rate limit", { status: 429 }))],
    ["HTTP 500", () => Promise.resolve(new Response("provider failed", { status: 500 }))],
    ["JSON malformado", () => Promise.resolve(completion("não é JSON"))],
    ["resposta incompleta", () => Promise.resolve(completion("{}"))],
    [
      "confiança inválida",
      () => Promise.resolve(completion(JSON.stringify({ ...demoAnalysis, confidence: 2 }))),
    ],
    [
      "peso fora da faixa",
      () =>
        Promise.resolve(
          completion(
            JSON.stringify({ ...demoAnalysis, estimated_weight_range: { min: 50, max: 60 } }),
          ),
        ),
    ],
    ["timeout", () => Promise.reject(new DOMException("timeout", "TimeoutError"))],
  ])("%s permite recuperação manual e nunca troca live por demo", async (_name, response) => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation(response));
    await expect(analyzeSurplus(photo)).rejects.toThrow(fallback);
  });

  it("configuração incompleta falha antes de transmitir a fotografia", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("OPENAI_API_KEY", "");
    await expect(analyzeSurplus(photo)).rejects.toThrow("Configure OPENAI_API_KEY");
    vi.stubEnv("AI_PROVIDER", "desconhecido");
    await expect(analyzeSurplus(photo)).rejects.toThrow("Configure AI_MODE e AI_PROVIDER");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
