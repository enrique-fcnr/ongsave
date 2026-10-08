# 15 · Prompt B6 · IA sem dependência externa obrigatória

Leia antes: `src/lib/ai/` inteiro, `src/app/api/analyze/route.ts`, README (seção IA) e `.env.example`.

## Objetivo

Manter os modos atuais e acrescentar o provider **Workers AI**:

- `AI_MODE=demo`: fixture identificada (continua o padrão);
- `AI_MODE=live` com `AI_PROVIDER=openai`: mantido como está, só troca de onde vem a foto (R2).

## Passos

1. **Binding:** `ai` (`"ai": { "binding": "AI" }`) no `wrangler.jsonc`.
2. **Provider `src/lib/ai/providers/workers-ai.ts`**, implementando a mesma interface de `provider.ts`:
   - modelo padrão `@cf/meta/llama-3.2-11b-vision-instruct`; confira na doc atual (https://developers.cloudflare.com/workers-ai/models/) se continua disponível e se exige aceite de licença na primeira chamada. Se exigir, implemente e documente;
   - mesmo prompt de `prompts.ts` (com a proteção contra instruções na imagem);
   - resposta validada pelo **mesmo schema Zod**. Se a doc não confirmar JSON mode para modelos de visão, extraia o JSON do texto e valide. Se a validação falhar, retorne o mesmo erro que hoje leva ao fallback manual (o upload permanece).
3. `AI_PROVIDER` aceita `openai | workers-ai`. O valor salvo em `analyses.provider` vem do servidor.
4. **Timeout de 45 s** e as mesmas mensagens de erro.
5. **Testes:** o provider workers-ai com resposta mockada válida, inválida e com JSON embrulhado em texto. O modo demo continua passando.
6. Documente no README como ligar: `AI_MODE=live`, `AI_PROVIDER=workers-ai`, sem chave nenhuma.
7. Relatório `prompts/RELATORIO-15.md`, com uma chamada real de teste se possível (foto `e2e/fixtures/vegetables.jpg`) e a qualidade percebida da resposta.

Ao terminar: **"Prompt 15 concluído."**
