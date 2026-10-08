import "server-only";
import type { AnalysisInput, AnalysisResult } from "./types";
import type { AIProvider } from "./provider";
import { analysisSchema } from "./schema";
import { demoAnalysis } from "./demo-analysis";
import { openaiProvider } from "./providers/openai";
import { workersAiProvider } from "./providers/workers-ai";
const providers: Record<string, AIProvider> = {
  openai: openaiProvider,
  "workers-ai": workersAiProvider,
};
export async function analyzeSurplus(input: AnalysisInput): Promise<AnalysisResult> {
  if (process.env.AI_MODE === "demo")
    return { analysis: analysisSchema.parse(demoAnalysis), provider: "demo", model: "fixture-v1" };
  const provider = providers[process.env.AI_PROVIDER || ""];
  if (process.env.AI_MODE !== "live" || !provider)
    throw new Error("Configure AI_MODE e AI_PROVIDER no servidor.");
  try {
    return await provider.analyze(input);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Configure OPENAI_API_KEY")) throw error;
    throw new Error(
      "Não conseguimos analisar bem esta imagem. Tente novamente ou preencha manualmente.",
    );
  }
}
