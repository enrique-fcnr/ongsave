import type { AnalysisInput, AnalysisResult } from "./types";
export interface AIProvider {
  analyze(input: AnalysisInput): Promise<AnalysisResult>;
}
