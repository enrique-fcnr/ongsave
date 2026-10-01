import { z } from "zod";
import { analysisSchema } from "./schema";
export type SurplusAnalysis = z.infer<typeof analysisSchema>;
export type AnalysisInput = { image: string; mimeType: string };
export type AnalysisResult = { analysis: SurplusAnalysis; provider: string; model: string };
