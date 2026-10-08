# Relatório 10 · D1 + Drizzle

## O que foi feito
- D1 `ongsave-db` criado na conta `51f772f7656a812951d1ee9ce5c3f9c0` (região ENAM), id `00fa9a8f-288f-4f62-9e54-1bf371087c75`. Binding `DB` no `wrangler.jsonc` com `migrations_dir: drizzle/migrations`. `cloudflare-env.d.ts` regenerado.
- `drizzle-orm@0.45.4` e `drizzle-kit@0.31.11`. `drizzle.config.ts` (dialect `sqlite`).
- `src/server/db/schema.ts` com as 14 tabelas (12 públicas + `rescue_tokens` e `analyses`, que eram do schema `private`) e relações Drizzle com os mesmos nomes que o Supabase devolvia (`surplus_batches`, `impact_metrics`, `surplus_items`), para as linhas chegarem às telas no mesmo formato.
- Migration `drizzle/migrations/0000_init.sql` gerada pelo `drizzle-kit generate` e aplicada **localmente**.
- `src/server/db/client.ts`: `getDb()` (via `getCloudflareContext()`), `getDbAsync()`, `createDb(d1)` para testes e scripts, `runAtomic(db, statements)` sobre `D1Database.batch` e o helper `guard(...)` (ver abaixo).
- `src/server/db/time.ts`: `operationalTime()`, `saoPauloClock()` e `saoPauloDay()` com `Intl.DateTimeFormat` em `America/Sao_Paulo`.
- `src/server/db/impact.ts`: `impactForWeight(kg)`, idêntico a `private.impact_for_weight`.

## Mapa Postgres → D1
| Postgres | D1 |
|---|---|
| `uuid default gen_random_uuid()` | `text primary key`, UUID gerado em código (`crypto.randomUUID()`); seed mantém os ids md5 determinísticos |
| `timestamptz default now()` | `text` ISO-8601 UTC, default `strftime('%Y-%m-%dT%H:%M:%fZ','now')` (mesmo formato de `toISOString()`, então comparar texto = comparar instantes) |
| enums `app_role`, `rescue_status` | `text` + `CHECK (... in (...))` com os valores de `src/lib/domain.ts` |
| `numeric`, `double precision` | `real` |
| `boolean` | `integer` 0/1 (`mode: "boolean"` no Drizzle) |
| `jsonb` | `text` JSON (`mode: "json"`) |
| `text[]` (`accepted_categories`, `current_needs`) | `text` JSON array, com `CHECK json_type(...)='array'` |
| `time` | `text` `HH:MM` com `CHECK GLOB '[0-2][0-9]:[0-5][0-9]'` e `start < end` |
| regex `^[0-9]{4}$` do token | `CHECK confirmation_token GLOB '[0-9][0-9][0-9][0-9]'` |
| `profiles.auth_user_id references auth.users` | `text not null unique`, sem FK por enquanto (vira `user.id` do Better Auth no 11) |
| triggers `estimate_batch_impact`, `init_rescue_token` | nenhuma trigger: `impactForWeight()` e geração do token no mesmo `batch()` (prompt 12) |
| RLS, grants | nada no banco; vira `src/server/permissions.ts` no prompt 12 |

Todos os `CHECK`, `UNIQUE`, `NOT NULL`, defaults, FKs com `on delete cascade` e os 7 índices foram portados. O D1 liga `foreign_keys` por padrão (testado).

## Decisão: travas atômicas com `batch_guards`
O D1 não tem `FOR UPDATE` nem transação interativa. `batch()` roda tudo numa transação implícita e reverte se **qualquer** statement falhar. Criei uma tabela sempre vazia, `batch_guards`, com um `CHECK` nomeado por regra (`guard_unavailable`, `guard_preferences`, `guard_receiving_hours`, `guard_mission_taken`, `guard_vehicle`, `guard_driver_busy`, `guard_not_driver`, `guard_transition`, `guard_token_locked`, `guard_analysis`). Um service coloca no batch `INSERT INTO batch_guards SELECT 'motivo' WHERE NOT (condição)`: se a condição falha, o `CHECK` aborta o batch inteiro e o nome da constraint diz qual regra quebrou. `runAtomic` converte isso em `GuardError(reason)`, que o service traduz para a mesma mensagem do `raise exception` original.

Por que não `changes()`: funciona dentro do batch, mas só olha o statement anterior. Inserções de várias linhas (notificações para N perfis) quebram a corrente. Com a guarda, as checagens e escritas ficam no mesmo batch e a condição é reavaliada dentro da transação, sem "lê, decide, escreve".

## Testes (`tests/d1/`)
Ferramenta: `getPlatformProxy()` do wrangler, com `persist: false` e `remoteBindings: false`. Dá um D1 real do workerd em memória dentro do Vitest em Node, junto dos testes atuais (domínio, IA, PGlite), sem trocar o runner. `@cloudflare/vitest-pool-workers` rodaria os testes dentro do Worker, mas exigiria um segundo projeto Vitest e não ajuda aqui, porque os services recebem o `db` por parâmetro.

`tests/d1/schema.test.ts` (10 testes): migration aplica as 14 tabelas; `CHECK`s rejeitam papel, tipo de organização, peso 0 e 5001, categoria, status, horas, `user_confirmed=0`, `seed_kind`, janela invertida, capacidade 0, token `12a4` e `123`; `UNIQUE(batch_id)` impede segunda reserva e segundo rescue; FK e cascade; guarda aborta o batch inteiro e mantém `batch_guards` vazia; `impactForWeight` para 10, 23, 100 e 12,5 kg igual ao SQL; relógio de São Paulo.

Portão: lint, typecheck, test (35), build e cf:build verdes. Testes PGlite antigos continuam rodando.

## Diferenças em relação ao Postgres
- `time` do Postgres tinha segundos; aqui `HH:MM`. A comparação de horário de recebimento usa `HH:MM:SS` do relógio contra `HH:MM:00`, reproduzindo o `between` original (às 23:59:30 com fim 23:59, fica fora, como antes).
- `notifications_profile_idx` era `(profile_id, created_at desc)`; no SQLite fica ascendente, que serve à mesma consulta.

## Pendente
- **`wrangler d1 migrations apply ongsave-db --remote`** foi bloqueado pelo controle de permissões do Claude Code ("Production Deploy"). O banco remoto existe, mas está sem tabelas.
