# 00 · Plano: ONGSave 100% na Cloudflare

> Preparado em 08/10/2026. Branch de trabalho: `feat/edu`. Não mexer na `main` (ela publica na Vercel de produção do Enrique) até o corte final.
> Cada prompt desta pasta é rodado no Claude Code, na raiz do repositório, um de cada vez (ou em paralelo quando indicado).

## Conta de destino
`Eduardofonseca1401@gmail.com's Account`, fixada por `account_id` no `wrangler.jsonc`. As outras contas do mesmo login (Agentdoctoradm, Paulatoridol) **não** recebem nada do ONGSave.

## Onde estamos
- Next.js **16.3.8** (App Router, React 19, `src/proxy.ts` no lugar do middleware), hospedado na **Vercel**.
- **Supabase** faz 5 papéis: Auth (e-mail/senha), Postgres (12 tabelas, RLS, 23 funções plpgsql), Storage (bucket privado `surplus`), Realtime (`postgres_changes`) e scripts de seed/reset.
- O banco e a Vercel estão na conta do Enrique (`xhsbrwksbmxdzhujpyeb`, `enrique-fcnrs-projects`).

## Onde queremos chegar
| Hoje | Cloudflare |
|---|---|
| Vercel | **Workers** com `@opennextjs/cloudflare` (≥ 1.20.8, exige Next ≥ 16.3.8) |
| Supabase Postgres + RLS + RPCs | **D1** (SQLite) + Drizzle; regras das RPCs viram TypeScript no servidor; RLS vira checagem de permissão em código |
| Supabase Auth | **Better Auth** com D1 (e-mail/senha, sessão em cookie) |
| Supabase Storage | **R2** (bucket privado; foto servida por rota autenticada) |
| Supabase Realtime | **Durable Object** com WebSocket (hub que avisa "algo mudou"; o refresh de 15 s continua como rede de segurança) |
| OpenAI (opcional) | continua opcional; adiciona provider **Workers AI** como alternativa; `AI_MODE=demo` segue padrão |

Sem backend separado: tudo roda dentro do mesmo Worker do Next (Route Handlers + Server Components + bindings D1/R2/DO/AI).

## Decisão (08/10, Edu)
**Banco do zero na Cloudflare.** O Supabase do Enrique não é usado em nenhum momento: nem as chaves, nem os dados. Aproveitamos **só o código** (telas, componentes, regras descritas nas migrations, seed em `scripts/seed-data.ts`) e montamos D1, R2, Auth, tempo real e deploy na conta `Eduardofonseca1401`. A Vercel e o Supabase atuais ficam intocados até o corte final.

Enquanto a migração não termina, a URL da Cloudflare mostra a landing e o login. O fluxo completo passa a funcionar no fim do prompt 12, e os dados demo entram no 16.

## Ordem de execução
| # | Arquivo | Quem | Depende de | Paralelo com |
|---|---|---|---|---|
| 01 | `01-GUIA-CONTA-CLOUDFLARE.md` | **Edu, manual** | — | — |
| 02 | `02-PROMPT-A1-INFRA-CLOUDFLARE.md` | Claude Code | 01 | — |
| 10 | `10-PROMPT-B1-D1-SCHEMA.md` | Claude Code | 02 | — |
| 11 | `11-PROMPT-B2-AUTH.md` | Claude Code | 10 | 13, 15 |
| 13 | `13-PROMPT-B4-R2-FOTOS.md` | Claude Code | 10 | 11, 15 |
| 15 | `15-PROMPT-B6-IA.md` | Claude Code | 10 | 11, 13 |
| 12 | `12-PROMPT-B3-REGRAS-DE-NEGOCIO.md` | Claude Code | 10, 11 | 14 |
| 14 | `14-PROMPT-B5-REALTIME.md` | Claude Code | 10, 11 | 12 |
| 16 | `16-PROMPT-B7-SEED-TESTES-DEPLOY.md` | Claude Code | todos | — |

Depois do 16 vem uma rodada de otimização e melhorias para a apresentação (Caixa OngSave, motorista remunerado, desempenho), em prompts novos a partir do 20.

## Regras para todos os prompts
1. **Leia antes de escrever.** `AGENTS.md` avisa que o Next 16 mudou; consulte `node_modules/next/dist/docs/` e a doc do OpenNext/Cloudflare antes de usar uma API. Não invente opção de config.
2. **Fonte da verdade das regras de negócio:** `supabase/migrations/20261001113753_ongsave_core.sql` e `20261001124638_ongsave_server_clock.sql`. Porte 1:1; se algo for ambíguo, pare e anote em `prompts/DUVIDAS.md` em vez de supor.
3. **Nenhum segredo no código ou no git.** Segredos via `wrangler secret put` e `.dev.vars` (ignorado no `.gitignore`).
4. **UI não muda** nesta migração: mesmas telas, textos e fluxos. Só a camada de dados/infra.
5. **D1 não tem transação interativa nem `FOR UPDATE`.** Use `db.batch([...])` (atômico) e update condicional (`... WHERE id=? AND status=?`) conferindo `meta.changes`. Nunca leia-decida-escreva em chamadas separadas sem essa trava.
6. Ao fim de cada prompt: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` e `npx opennextjs-cloudflare build` passando. Escreva `prompts/RELATORIO-<numero>.md` com o que mudou, o que foi testado e o que ficou pendente.
7. Commits pequenos na `feat/edu`, mensagem em inglês no padrão do repositório (`feat(cf): ...`), e push.
8. Ao terminar, diga exatamente: **"Prompt <numero> concluído."**

## Custo: plano **Free**, meta de R$ 0 (decisão do Edu, 08/10)
Nada de Workers Paid. Isso muda o projeto em um ponto: **no Free cada requisição tem 10 ms de CPU**. Esperar banco, R2 ou fetch não conta, só o processamento. Há uma folga para estouros ocasionais, mas estouro constante gera o erro **1102 "Worker exceeded resource limits"**. Regras para todos os prompts:
1. **Renderizar o mínimo no servidor.** A landing e as páginas públicas são estáticas (prerender). Nas páginas logadas, só o necessário; nada de cálculo pesado por request.
2. **Senha:** hash caro (scrypt/bcrypt) estoura 10 ms. Use **PBKDF2 do WebCrypto** (nativo) com iterações calibradas pela medição (ver prompt 11) e documente o trade-off.
3. **Imagens:** o redimensionamento da foto já acontece no celular (`prepare-photo.ts`). O servidor não processa imagem.
4. **Medir sempre:**
   - em cada etapa, rode o `cf:preview` e veja o tempo de CPU pelos logs (`wrangler tail` ou Observability no painel);
   - qualquer rota com CPU acima de ~8 ms vai para o relatório, com a causa e a correção.
5. **Cotas Free usadas:**
   - Workers: 100 mil requisições por dia;
   - D1: 5 milhões de leituras e 100 mil escritas por dia, 500 MB;
   - Durable Objects (backend SQLite): 100 mil requisições por dia;
   - Workers AI: 10 mil neurons por dia.
   
   Sobra para uma demo.
6. **R2:** a cota grátis é de 10 GB, mas a Cloudflare pode pedir um meio de pagamento para ativar o R2 (sem cobrança dentro da cota). Se o Edu não quiser cadastrar cartão, o prompt 13 usa **KV** para as fotos (grátis, sem cartão, valor de até 25 MB), com a mesma interface.

## Fontes consultadas (08/10/2026)
- OpenNext Cloudflare releases (Next 16 desde 1.15; 1.20.8 exige Next ≥ 16.3.8; `proxy.ts` experimental desde 1.20.3): https://github.com/opennextjs/opennextjs-cloudflare/releases
- Get started / bindings / env vars: https://opennext.js.org/cloudflare
- Limites de Workers (CPU 10 ms Free com folga ocasional; I/O não conta; 64 MiB): https://developers.cloudflare.com/workers/platform/limits/
- D1 batch e limites: https://developers.cloudflare.com/d1/worker-api/d1-database/ · https://developers.cloudflare.com/d1/platform/limits/
- Durable Objects WebSocket hibernation: https://developers.cloudflare.com/durable-objects/best-practices/websockets/
- Better Auth + D1: https://better-auth.com/docs/concepts/database
- Workers AI modelos: https://developers.cloudflare.com/workers-ai/models/

## Depois da migração (fora deste plano)
Recuperar o **Caixa OngSave**, motorista remunerado, nota das ONGs e painel Admin. O código de referência existe em `.../trabalho NEXT/Ong/front/src` (`contexts/FundContext.jsx`, `utils/distributionCalculator.js`, `utils/constants.js`, `components/fund`, `components/earnings`) e a documentação em `entrega-challenge/front/DOCUMENTACAO.md`. Será um plano separado, já sobre D1.
