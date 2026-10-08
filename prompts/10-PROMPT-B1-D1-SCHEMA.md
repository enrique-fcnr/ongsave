# 10 · Prompt B1 · Banco D1 + Drizzle (schema e acesso a dados)

Leia antes: `prompts/00-PLANO-MIGRACAO-CLOUDFLARE.md` (regras), `prompts/RELATORIO-02.md`, as duas migrations em `supabase/migrations/`, `src/lib/domain.ts`, `src/lib/data.ts`, `scripts/seed-data.ts` e `tests/database.test.ts`.

## Objetivo
Criar o banco **D1** `ongsave-db` com o schema equivalente ao Postgres atual, usando **Drizzle ORM**. Fornecer uma camada de acesso `src/server/db/` que as próximas etapas vão usar. O banco é novo e nasce vazio nesta conta (nenhum dado do Supabase antigo é migrado; os dados demo vêm de `scripts/seed-data.ts` no prompt 16). As telas só passam a ler do D1 a partir dos prompts 11 e 12.

## Passos
1. `npx wrangler d1 create ongsave-db` e coloque o binding `DB` no `wrangler.jsonc`, com `migrations_dir` apontando para `drizzle/migrations`. Rode `npm run cf-typegen` para tipar `CloudflareEnv`.
2. Instale `drizzle-orm` e `drizzle-kit`. Crie `drizzle.config.ts` (dialect `sqlite`, driver `d1-http` só para o studio, se quiser).
3. Escreva `src/server/db/schema.ts` portando **todas** as tabelas, incluindo as do schema `private` (`rescue_tokens`, `analyses`). Convenções:
   - **IDs:** `text` com UUID gerado em código (`crypto.randomUUID()`).
   - **Datas:** `text` ISO-8601 em UTC, ou `integer` epoch ms. Escolha um padrão só e documente. Sugestão: ISO, porque o front já trata strings.
   - **Enums** (`app_role`, `rescue_status`) viram `text` com `CHECK` usando os valores de `src/lib/domain.ts`.
   - **`numeric`:** `real`. **`jsonb`:** `text` com `{ mode: "json" }`. **`text[]`** (`accepted_categories`, `current_needs`): `text` JSON.
   - **`time`:** `text` `HH:MM`.
   - Porte todos os `CHECK`, `UNIQUE`, `NOT NULL`, defaults, FKs (`on delete cascade`) e índices.
   - **`profiles.auth_user_id`:** vai referenciar o `user.id` do Better Auth (prompt 11). Por ora `text not null unique`, sem FK.
   - **Triggers:** `estimate_batch_impact` vira função TS chamada ao inserir/alterar peso; `init_rescue_token` vira geração do token na mesma `batch()` que cria o rescue. Não use triggers SQLite para regra de negócio.
4. Gere a migration com `drizzle-kit generate`. Aplique local (`wrangler d1 migrations apply ongsave-db --local`) e remoto (`--remote`), sempre na conta `51f772f7656a812951d1ee9ce5c3f9c0`.
5. **`src/server/db/client.ts`:** `getDb()` usando `getCloudflareContext()` do `@opennextjs/cloudflare` (versão async onde a doc pedir), retornando `drizzle(env.DB, { schema })`. Também um helper `runAtomic(statements)` que usa `db.batch`.
6. **`src/server/db/time.ts`:** `operationalTime()` equivalente à função do server clock, usando a hora do servidor do Worker. A regra de janela de recebimento usa o fuso `America/Sao_Paulo`; confira como a função original calcula e reproduza com `Intl.DateTimeFormat`.
7. **`src/server/db/impact.ts`:** `impactForWeight(kg)` idêntico a `private.impact_for_weight` (refeições = kg × 2 arredondado; descarte = kg × 7,72; CO2 = kg × 1,43; água = kg × 250; mesmos arredondamentos).
8. **Testes:** crie `tests/d1/` com Vitest usando um D1 local (`getPlatformProxy()` do wrangler, ou `@cloudflare/vitest-pool-workers`; escolha o que a doc recomenda hoje e registre o porquê). Teste:
   - a migration aplica;
   - os `CHECK` rejeitam valores inválidos;
   - o `UNIQUE` de `donation_reservations.batch_id` e de `rescues.batch_id` impede reserva dupla;
   - `impactForWeight` dá os mesmos valores da função SQL para 10, 23 e 100 kg.
   
   Mantenha os testes PGlite antigos rodando por enquanto. Eles saem no prompt 16.
9. Relatório `prompts/RELATORIO-10.md`: mapa tabela Postgres → D1, decisões de tipo e o que ficou diferente.

Ao terminar: **"Prompt 10 concluído."**
