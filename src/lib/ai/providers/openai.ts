import "server-only";
import type { AIProvider } from "../provider";
import { analysisSchema } from "../schema";
import { analysisPrompt } from "../prompts";
export const openaiProvider: AIProvider = {
  async analyze(input) {
    if (!process.env.OPENAI_API_KEY)
      throw new Error("Configure OPENAI_API_KEY para usar a análise real.");
    const model = process.env.AI_MODEL || "gpt-4.1-mini";
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: AbortSignal.timeout(45000),
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_completion_tokens: 1600,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: analysisPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: "Avalie a fotografia para revisão humana." },
              {
                type: "image_url",
                image_url: { url: `data:${input.mimeType};base64,${input.image}`, detail: "low" },
              },
            ],
          },
        ],
      }),
    });
    if (!response.ok)
      throw new Error(
        "Não conseguimos analisar bem esta imagem. Tente novamente ou preencha manualmente.",
      );
    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return {
      analysis: analysisSchema.parse(JSON.parse(data.choices?.[0]?.message?.content || "{}")),
      provider: "openai",
      model,
    };
  },
};
