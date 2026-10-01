import "server-only";
import type { AnalysisInput, AnalysisResult } from "./types";
import { analysisSchema } from "./schema";
import { demoAnalysis } from "./demo-analysis";
import { openaiProvider } from "./providers/openai";
export async function analyzeSurplus(input: AnalysisInput): Promise<AnalysisResult> {
  if (process.env.AI_MODE === "demo")
    return { analysis: analysisSchema.parse(demoAnalysis), provider: "demo", model: "fixture-v1" };
  if (process.env.AI_MODE !== "live" || process.env.AI_PROVIDER !== "openai")
    throw new Error("Configure AI_MODE e AI_PROVIDER no servidor.");
  try {
    return await openaiProvider.analyze(input);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Configure OPENAI_API_KEY")) throw error;
    throw new Error(
      "Não conseguimos analisar bem esta imagem. Tente novamente ou preencha manualmente.",
    );
  }
}
