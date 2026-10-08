# Relatório final · Migração do ONGSave para a Cloudflare

Branch `feat/edu`, conta `Eduardofonseca1401@gmail.com's Account` (`51f772f7656a812951d1ee9ce5c3f9c0`). As 8 etapas foram executadas em sequência. O código está 100% Cloudflare e validado localmente no runtime do Workers (`cf:preview`). **A publicação em produção não foi feita**: depende de ativar o R2 no painel e de comandos que o controle de permissões do Claude Code bloqueou (detalhes em "Pendências").

## URL de produção

https://ongsave.eduardofonseca1401.workers.dev (subdomínio criado; o Worker ainda não foi publicado).

## Contas demo

Senha `demo123` para todas. Entre por `/login` ou pelo login rápido do `/demo`.

| Papel        | E-mail                 | Perfil              |
| ------------ | ---------------------- | ------------------- |
| Supermercado | mercado@ongsave.demo   | Mercado Paulista    |
| ONG          | ong@ongsave.demo       | Instituto Esperança |
| Motorista    | motorista@ongsave.demo | Lucas Almeida       |

Mais 8 contas de apoio (Aurora, Empório Central, Nova Vida, Casa São Lucas, Projeto Viver, Mãos Abertas, Mariana Costa, Rafael Santos). Criadas por `npm run demo:users -- --local|--remote`.

## Status

| Verificação                 | Resultado                                                                                |
| --------------------------- | ---------------------------------------------------------------------------------------- |
| Lint                        | verde                                                                                    |
| Typecheck                   | verde                                                                                    |
| Testes (Vitest)             | 76/76, 8 arquivos                                                                        |
| Build Next                  | verde                                                                                    |
| Build Cloudflare (OpenNext) | verde, Worker 3,2 MiB gzip                                                               |
| E2E no `cf:preview`         | 30/30 em 1,4 min, incluindo o fluxo oficial com três sessões (24,2 s para duas entregas) |
| E2E em produção             | não executado (sem deploy)                                                               |

## O que era Supabase → o que é agora

| Antes                                                   | Agora                                                                                                                     |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Vercel                                                  | Cloudflare Workers via `@opennextjs/cloudflare` 1.20.9 (`worker.ts`)                                                      |
| Supabase Postgres (12 tabelas + `private`)              | D1 `ongsave-db` + Drizzle (`src/server/db/schema.ts`, `drizzle/migrations/`)                                              |
| 23 funções plpgsql / RPCs com `FOR UPDATE`              | `src/server/services/*` com batches atômicos e guardas `batch_guards`                                                     |
| RLS e grants por coluna                                 | `src/server/permissions.ts` + `src/server/queries.ts`; escritas diretas só via `/api/profile` e `/api/notifications/read` |
| Triggers (`estimate_batch_impact`, `init_rescue_token`) | `impactForWeight()` e token gerado no mesmo batch                                                                         |
| Supabase Auth                                           | Better Auth (e-mail e senha, sem autocadastro, cookies httpOnly/lax/secure)                                               |
| Supabase Storage (bucket `surplus`)                     | R2 `ongsave-photos` privado + `GET /api/photos/[...key]` com checagem de permissão                                        |
| Supabase Realtime (`postgres_changes`)                  | Durable Object `RealtimeHub` (WebSocket Hibernation), avisos sem dados                                                    |
| `proxy.ts` renovando token                              | removido (Better Auth valida a sessão em cada request)                                                                    |
| OpenAI (opcional)                                       | OpenAI ou Workers AI (`AI_PROVIDER=workers-ai`, sem chave); `AI_MODE=demo` continua padrão                                |
| `seed.sql`, `migrate.ts`, Service Role                  | `scripts/seed-d1.ts`, `create-demo-users.ts`, `reset-demo.ts` sobre `wrangler d1 execute` e a própria API                 |
| PGlite nos testes                                       | D1 real em memória (`getPlatformProxy`) em `tests/d1/`                                                                    |

## Custos estimados

~**US$ 5/mês** (Workers Paid, obrigatório porque o Worker passa de 3 MiB gzip). D1, R2, Durable Objects e Workers AI cabem nas cotas incluídas para o volume da demo. Detalhe em `RELATORIO-16.md`.

## Pendências

1. **Ativar o R2** no painel da conta Eduardofonseca1401 (R2 Object Storage) e rodar `npx wrangler r2 bucket create ongsave-photos`.
2. **Confirmar o plano Workers Paid** na conta.
3. Rodar, nesta ordem (bloqueados aqui pelo controle de permissões do Claude Code):
   ```bash
   npm run db:migrate:remote
   npm run demo:users -- --remote
   npm run cf:deploy
   openssl rand -base64 32 | npx wrangler secret put BETTER_AUTH_SECRET
   E2E_BASE_URL=https://ongsave.eduardofonseca1401.workers.dev RUN_LIVE_E2E=true npm run test:e2e
   ```
4. Corte final (só com o OK do Edu): merge `feat/edu` → `main` e combinar com o Enrique o desligamento da Vercel ou o apontamento do domínio.
5. Homologar câmera e instalação PWA em celulares reais.
6. `npm audit`: 6 alertas "high" do `braces`, via a CLI `shadcn` (anteriores à migração, fora do bundle).

Nenhuma dúvida de regra de negócio ficou em aberto; `prompts/DUVIDAS.md` está vazio.

## Próximos passos sugeridos (prompts 20+)

- **Caixa OngSave, motorista remunerado, nota das ONGs e painel Admin**, já sobre D1, com o mesmo padrão de service + guarda atômica (código de referência citado no plano 00).
- **Desempenho:** juntar as leituras de `operationalData` num `db.batch()` de leitura (hoje são várias idas ao D1 por página); paginação acima de 200 resgates; read replication do D1 (Sessions API) se a demo crescer.
- **Imagens:** binding `IMAGES` do OpenNext para otimizar as fotos da landing e servir miniaturas das fotos do R2.
- **Tempo real:** um `RealtimeHub` por organização se o número de conexões crescer; hoje um hub global atende a demo.
- **Segurança:** rate limit do Better Auth em armazenamento compartilhado (D1 ou KV) em vez de memória por isolate; trocar a CLI `shadcn` de `dependencies` para `devDependencies` e atualizar para eliminar o alerta do `braces`.
- **IA:** testar um modelo de visão mais novo do Workers AI com saída estruturada; o Llama 3.2 Vision às vezes responde em prosa ou entra em repetição.
- **Observabilidade:** logs estruturados dos services e alerta no painel para erros 5xx.
