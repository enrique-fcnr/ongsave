# Relatório 16 · Seed, limpeza, testes completos e produção

## Seed e reset

- `scripts/seed-d1.ts` (criado na etapa 11, a partir de `scripts/seed-data.ts`): 8 organizações, 3 motoristas, 4 lotes disponíveis, 3 missões seed e 16 entregas históricas com métricas, preservando `is_seed`, `is_demo` e `seed_kind`, mais o código de entrega de cada resgate (antigo trigger). Upsert idempotente, `--local` ou `--remote`.
- `npm run demo:users -- --local|--remote` cria organizações, as 11 contas e aplica o seed. Testado duas vezes seguidas no D1 local.
- `npm run demo:reset` entra como Mercado Paulista e chama `POST /api/demo/reset`, que roda `resetDemo` (batch atômico) e apaga a pasta da conta no R2. Mesmo caminho do botão do `/demo`. Testado contra o `cf:preview`.

## Supabase removido

- Apagados `src/lib/supabase/`, `supabase/` (config, seed.sql), `scripts/migrate.ts`, `scripts/environment.ts`, `scripts/seed.ts`, `scripts/generate-seed-sql.ts`, `tests/database.test.ts` e as dependências `@supabase/ssr`, `@supabase/supabase-js`, `supabase`, `@electric-sql/pglite`, `postgres`.
- As duas migrations originais foram para `docs/legacy-supabase/` como referência.
- `.env.example` sem variáveis Supabase. `grep -ri supabase src scripts tests e2e` volta **vazio**.
- Novos scripts: `db:generate`, `db:migrate:local`, `db:migrate:remote`, `seed:d1`.

## Correspondência dos testes PGlite removidos

| `tests/database.test.ts` (PGlite)                                     | Agora                                                                                        |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| seed idempotente mantém 16 métricas                                   | `flow.test.ts` › seed idempotente                                                            |
| outro mercado não lê lotes nem muda papéis                            | `flow.test.ts` › outro mercado não lê... e ninguém muda o próprio papel                      |
| publica com metadados do servidor; `record_analysis` só pelo servidor | `flow.test.ts` › publica foto...; `photos.test.ts` › análise manual registrada pelo servidor |
| ONG vê publicação; aceite atômico; segunda ONG não reserva            | `flow.test.ts` › ONG vê a publicação... + reserva dupla simultânea (com e sem barreira)      |
| ONG pausada não reserva                                               | `flow.test.ts` › ONG pausada não pode reservar                                               |
| motorista aceita; concorrente perde acesso e não avança               | `flow.test.ts` › motorista aceita... + dois motoristas simultâneos                           |
| motorista não lê token nem pula etapas                                | `flow.test.ts` › motorista não lê o token...                                                 |
| token errado não entrega; certo finaliza com impacto único            | `flow.test.ts` › token errado...                                                             |
| reset restrito preserva métricas seed                                 | `flow.test.ts` › reset restrito...                                                           |

Todos os cenários foram portados antes da remoção, e os novos testes cobrem também capacidade diária e de veículo, horário de recebimento, categoria, bloqueio após 5 códigos e avanço duplo.

## Testes

| Verificação                                                      | Resultado                                                                        |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `npm run lint`                                                   | verde                                                                            |
| `npm run typecheck`                                              | verde                                                                            |
| `npm run test`                                                   | **76 testes, 8 arquivos**, verde                                                 |
| `npm run build`                                                  | verde                                                                            |
| `npm run cf:build`                                               | verde; Worker 3,2 MiB gzip                                                       |
| Playwright no `cf:preview` (`E2E_BASE_URL`, `RUN_LIVE_E2E=true`) | **30/30 em 1,4 min**                                                             |
| Fluxo oficial com três sessões (`live-flow.spec.ts`)             | **24,2 s** para duas entregas completas com reset entre elas (~12 s por entrega) |

Ajustes no `e2e/live-flow.spec.ts`: avisos do WebSocket `/api/realtime` no lugar dos frames `postgres_changes`; foto por `/api/photos/...`; exclusão conferida pela própria rota (404 para o dono depois do reset); rótulo "Fechar" do diálogo (mudou no redesign anterior à migração); a OpenFreeMap passou a servir tiles como `application/vnd.mapbox-vector-tile`, e o filtro do teste agora aceita esse tipo.

Na primeira rodada, 4 testes de `product-design` falharam no login: a suíte faz dezenas de logins por minuto do mesmo IP e bateu no limite de 10/min. O limite continua 10/min em produção; localmente `.dev.vars` define `AUTH_SIGNIN_RATE_LIMIT=1000`.

`npm audit --omit=dev`: 6 alertas "high", todos do pacote `braces` via a CLI `shadcn`. Já existiam antes da migração e a CLI não entra no bundle do Worker. Fica para a rodada de otimização.

## Produção: **não concluída nesta sessão**

| Passo                                              | Situação                                                                                                             |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| R2 habilitado na conta                             | **Pendente (Edu, painel).** `r2 bucket create` respondeu `Please enable R2 through the Cloudflare Dashboard [10042]` |
| `wrangler d1 migrations apply ongsave-db --remote` | **Bloqueado** pelo controle de permissões do Claude Code ("Production Deploy")                                       |
| Seed remoto e usuários demo                        | Pendente (depende da migration)                                                                                      |
| `wrangler secret put BETTER_AUTH_SECRET`           | Pendente (depende do primeiro deploy)                                                                                |
| `npm run cf:deploy`                                | **Bloqueado** pelo controle de permissões                                                                            |
| Cenário oficial na URL publicada                   | Pendente                                                                                                             |

Recursos que **já existem** na conta `51f772f7656a812951d1ee9ce5c3f9c0`: subdomínio `eduardofonseca1401.workers.dev`, D1 `ongsave-db` (vazio) e o aceite da licença Meta do Workers AI.

Comandos, nesta ordem, com o login do wrangler nessa conta:

```bash
# 0. Painel Cloudflare → R2 Object Storage → ativar
npx wrangler r2 bucket create ongsave-photos
npm run db:migrate:remote
npm run demo:users -- --remote
npm run cf:deploy
openssl rand -base64 32 | npx wrangler secret put BETTER_AUTH_SECRET
# conferir
E2E_BASE_URL=https://ongsave.eduardofonseca1401.workers.dev RUN_LIVE_E2E=true npm run test:e2e
```

Se preferir, adicione uma regra de permissão no Claude Code para `npm run cf:deploy` e `wrangler d1 migrations apply` e peça para eu rodar.

## Corte final

Não feito, como pede o prompt: merge `feat/edu` → `main` e o desligamento da Vercel dependem do OK do Edu e de combinar com o Enrique.

## Custos estimados (demo)

| Item                                  | Custo                                                     |
| ------------------------------------- | --------------------------------------------------------- |
| Workers Paid                          | US$ 5/mês (obrigatório: Worker acima de 3 MiB gzip)       |
| D1                                    | incluído (25 bi linhas lidas, 50 mi escritas/mês no Paid) |
| R2                                    | grátis até 10 GB e 1 mi operações classe A/mês            |
| Durable Objects (SQLite, hibernation) | incluído no Paid para este volume                         |
| Workers AI                            | 10 mil neurons/dia grátis; só com `AI_MODE=live`          |
| **Total**                             | **~US$ 5/mês**                                            |
