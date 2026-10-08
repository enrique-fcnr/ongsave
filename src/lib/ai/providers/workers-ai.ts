import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { AIProvider } from "../provider";
import { analysisSchema } from "../schema";
import { analysisPrompt } from "../prompts";

export const WORKERS_AI_DEFAULT_MODEL = "@cf/meta/llama-3.2-11b-vision-instruct";
const TIMEOUT_MS = 45000;
type Runner = Pick<Ai, "run">;

// Vision models on Workers AI have no documented JSON mode: take the outermost {...}
// from the text (it may come wrapped in prose or ```json fences) and validate it.
export function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("Resposta sem JSON.");
  return JSON.parse(text.slice(start, end + 1));
}

function withTimeout<T>(promise: Promise<T>) {
  let timer: ReturnType<typeof setTimeout>;
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new DOMException("timeout", "TimeoutError")), TIMEOUT_MS);
    }),
  ]).finally(() => clearTimeout(timer));
}

// Llama 3.2 Vision requires accepting Meta's license once per account by sending
// `{ prompt: "agree" }`. Do it on the first license error, then retry once.
const needsLicense = (error: unknown) =>
  error instanceof Error && /agree|licen[cs]e|5016/i.test(error.message);

export function createWorkersAiProvider(ai: () => Runner): AIProvider {
  return {
    async analyze(input) {
      const model = process.env.AI_MODEL?.startsWith("@cf/")
        ? process.env.AI_MODEL
        : WORKERS_AI_DEFAULT_MODEL;
      const request = {
        // A valid answer is ~300 tokens; the cap makes repetition loops fail fast.
        max_tokens: 1024,
        messages: [
          { role: "system", content: analysisPrompt },
          // Without this reminder Llama 3.2 Vision usually answers in prose.
          {
            role: "user",
            content:
              "Avalie a fotografia para revisão humana. Responda somente com o objeto JSON no formato pedido, começando com { e sem texto fora dele.",
          },
        ],
        image: `data:${input.mimeType};base64,${input.image}`,
      };
      const run = () => withTimeout(ai().run(model as never, request as never));
      let output: unknown;
      try {
        output = await run();
      } catch (error) {
        if (!needsLicense(error)) throw error;
        // The acceptance call itself answers with "5016: Thank you for agreeing...".
        await ai()
          .run(model as never, { prompt: "agree" } as never)
          .catch(() => undefined);
        output = await run();
      }
      const response = (output as { response?: unknown })?.response;
      const parsed = typeof response === "string" ? extractJson(response) : response;
      return { analysis: analysisSchema.parse(parsed), provider: "workers-ai", model };
    },
  };
}

export const workersAiProvider = createWorkersAiProvider(() => getCloudflareContext().env.AI);
