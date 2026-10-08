# 16 · Prompt B7 · Seed, limpeza, testes completos e produção 100% Cloudflare

Leia antes todos os `prompts/RELATORIO-*.md`, `scripts/`, `e2e/`, `docs/` e `README.md`.

## Objetivo
Remover o Supabase do projeto, popular o D1 de produção com a mesma demo, passar em todos os testes e publicar.

## Passos
1. **Seed:**
   - `scripts/seed-data.ts` continua sendo a fonte;
   - crie `scripts/seed-d1.ts`, que gera SQL ou usa a API para popular o D1 (local e remoto) com 8 organizações, 3 motoristas, 4 lotes disponíveis, 3 missões seed e 16 entregas históricas com métricas, preservando `is_seed`, `is_demo` e `seed_kind`;
   - junto com `create-demo-users` (prompt 11), deixe tudo idempotente.
2. **Reset:** `npm run demo:reset` e o botão do `/demo` usam `resetDemo` (prompt 12) e a limpeza do R2 (prompt 13).
3. **Remover Supabase:**
   - apague `src/lib/supabase/`, `supabase/` (mova as migrations antigas para `docs/legacy-supabase/` como referência), `@supabase/*` e `supabase` do package.json, e `scripts/migrate.ts`;
   - tire as variáveis Supabase do `.env.example`.
   
   `grep -ri supabase src scripts tests e2e` deve voltar vazio, salvo docs.
4. **Testes:**
   - Vitest: domínio + `tests/d1/`. Remova os testes PGlite antigos depois de confirmar que todos os cenários foram portados (liste a correspondência no relatório);
   - Playwright: ajuste `e2e/live-flow.spec.ts`. Antes ele checava frames do Supabase Realtime no WebSocket; agora checa o WebSocket do `/api/realtime`. Rode contra o `cf:preview` e depois contra produção.
5. **Produção:**
   - `wrangler d1 migrations apply ongsave-db --remote`;
   - seed remoto e usuários demo;
   - `wrangler secret put` (`BETTER_AUTH_SECRET`, `ADMIN_SETUP_TOKEN` se usado, `OPENAI_API_KEY` opcional);
   - `npm run cf:deploy`;
   - rode o cenário oficial com três sessões (`docs/DEMONSTRATION.md`) na URL publicada.
6. **Verificação do plano Free:**
   - durante o e2e em produção, acompanhe `wrangler tail` (ou Observability);
   - liste a CPU por rota (landing, login, home de cada papel, feed, missão, upload, analyze, avançar etapa, entrega);
   - qualquer rota com `exceededCpu` ou acima de ~8 ms: otimize e repita.
   
   O relatório precisa mostrar zero erro 1102 no fluxo completo.
7. **Documentação:**
   - reescreva as seções de instalação, variáveis, banco, deploy e reset do `README.md`, além de `docs/ARCHITECTURE.md`, `docs/HANDOFF.md` e `docs/QA.md`, para a stack Cloudflare;
   - tire os caminhos Windows antigos.
8. **Corte final, só com o OK do Edu:** merge `feat/edu` → `main` e combine com o Enrique desligar o deploy da Vercel ou apontar o domínio.
9. Relatório `prompts/RELATORIO-16.md` com:
   - URL;
   - resultado de lint, typecheck, testes e build;
   - tempo do fluxo completo;
   - custo: confirmação de R$ 0 (todas as cotas Free usadas e o consumo do teste);
   - pendências.

Ao terminar: **"Prompt 16 concluído. ONGSave 100% Cloudflare."**
