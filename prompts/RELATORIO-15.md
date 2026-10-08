# Relatório 15 · IA: provider Workers AI

## O que mudou

- Binding `"ai": { "binding": "AI" }` no `wrangler.jsonc`.
- `src/lib/ai/providers/workers-ai.ts` implementa a mesma interface `AIProvider`:
  - modelo padrão `@cf/meta/llama-3.2-11b-vision-instruct` (confirmado na doc em 08/10/2026; `AI_MODEL` só substitui se começar com `@cf/`);
  - mesmo `analysisPrompt` como mensagem de sistema, com a proteção contra instruções na imagem; foto como data URL no campo `image`;
  - **licença Meta:** a doc exige mandar `{ "prompt": "agree" }` uma vez por conta. O provider detecta o erro `5016`, aceita e repete. Achado na chamada real: a própria resposta do aceite vem como **erro** (`5016: Thank you for agreeing...`), então o provider ignora esse retorno. A conta Eduardofonseca1401 já aceitou durante o teste;
  - **JSON:** a doc não lista JSON mode para modelos de visão, e testei `response_format: json_object`: foi ignorado. O provider extrai o objeto `{...}` mais externo do texto (aceita prosa e cercas ```json) e valida com o **mesmo schema Zod**. Falha → mesmo erro de hoje, que leva ao preenchimento manual com o upload preservado;
  - timeout de 45 s e as mesmas mensagens.
- `analyze-surplus.ts`: `AI_PROVIDER` aceita `openai | workers-ai`. O `provider` gravado em `analyses` vem do servidor (`"workers-ai"`), nunca do cliente. `AI_MODE=demo` segue padrão.
- README: como ligar (`AI_MODE=live`, `AI_PROVIDER=workers-ai`, sem chave).

## Testes (`tests/ai-workers.test.ts`, 11)

Resposta válida (prompt, data URL, provider e modelo certos); JSON embrulhado em texto e cercas; resposta já como objeto; aceite da licença com retentativa; texto sem JSON, JSON incompleto, confiança inválida, resposta vazia e erro do binding caem no manual; timeout de 45 s; modo demo não chama o binding. Os testes OpenAI antigos seguem passando. Portão: lint, typecheck, test (57), build, cf:build verdes.

## Chamada real (foto `e2e/fixtures/vegetables.jpg`, via `getPlatformProxy`)

| Tentativa | Pedido                                                                    | Tempo  | Resultado                                                                   |
| --------- | ------------------------------------------------------------------------- | ------ | --------------------------------------------------------------------------- |
| 1         | prompt original                                                           | 6,4 s  | prosa em português, sem JSON → cairia no manual                             |
| 2         | + `response_format: json_object`                                          | 3,3 s  | prosa, sem JSON                                                             |
| 3         | + lembrete "responda somente com o objeto JSON..." na mensagem do usuário | 12,3 s | **JSON válido** pelo schema                                                 |
| 4         | idem                                                                      | 45 s   | entrou em repetição ("alho", "cogumelo"...) até o limite → cairia no manual |

**Qualidade percebida: fraca para produção.** Reconhece hortifrúti (cenoura, alho, cebola, abóbora, batata), mas copia o peso e a faixa do exemplo do prompt (14,5 kg, 12–17), mistura inglês ("carrot", "garlic"), dá confiança 1,0 em tudo e às vezes repete itens até estourar o limite. Adotei o lembrete de formato (sistema e proteção inalterados) e reduzi `max_tokens` para 1024, para a repetição falhar mais rápido. Recomendação: manter `AI_MODE=demo` na apresentação; para análise real de qualidade, `AI_PROVIDER=openai`. O Workers AI serve como alternativa sem chave, sempre com a revisão humana que o fluxo já exige.

## Custo

Cada análise gastou poucos centésimos dos 10 mil neurons/dia grátis. Só roda com `AI_MODE=live`.
