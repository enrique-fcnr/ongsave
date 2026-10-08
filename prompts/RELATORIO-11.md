# Relatório 11 · Auth com Better Auth + D1

## O que mudou

- `better-auth@1.7.7`, adapter Drizzle (`provider: "sqlite"`, `transaction: false`, já que o D1 não tem transação interativa).
- **Tabelas** `user`, `session`, `account`, `verification` no `src/server/db/schema.ts`. Como o D1 remoto ainda estava vazio (a migration remota foi bloqueada), **regenerei a migration inicial** `0000_init.sql` com as tabelas do Better Auth e com a FK `profiles.auth_user_id → user.id on delete cascade`, igual ao `references auth.users` original. As tabelas do Better Auth guardam datas em epoch ms (convenção do adapter); as do ONGSave seguem em ISO.
- `src/server/auth/auth.ts` (`createAuth`): e-mail e senha, `disableSignUp: true`, cookies `httpOnly`, `sameSite=lax` e `secure` quando a URL é HTTPS. `BETTER_AUTH_SECRET` (segredo), `BETTER_AUTH_URL` (var no `wrangler.jsonc`, igual a `NEXT_PUBLIC_APP_URL`) e `BETTER_AUTH_TRUSTED_ORIGINS` (só local). Rota `src/app/api/auth/[...all]/route.ts`.
- **Rate limit:** o padrão do Better Auth é 3 logins a cada 10 s por IP, o que bloqueia três celulares na mesma rede da apresentação. Ajustei `/sign-in/email` para 10 por minuto.
- **Hash de senha:** scrypt do Better Auth. O pacote `@better-auth/utils/password` tem export condicional `workerd` → `node:crypto` scrypt, que o workerd implementa nativamente. Medido no `cf:preview`: login completo em **35–58 ms**. Não foi preciso trocar o algoritmo.
- `requireProfile()` (`src/lib/auth.ts`): sessão do Better Auth → `profiles` por `auth_user_id` → organização via `organization_members`. Mantém `cache()` por request e devolve `{ db, actor, profile, organization }` (o `client` virou `db`; `actor` carrega papel, organizações e motorista para as permissões). A lógica pura ficou em `resolveProfile()` para teste. `apiUser()` (`src/lib/http.ts`) usa a mesma sessão e o mesmo checador de origem.
- **`proxy.ts` removido.** Ele só existia para renovar o token do Supabase. O Better Auth valida a sessão em cada `getSession` (layout e APIs) e não pede middleware no Next 16. Sem ele, o OpenNext também não precisa do suporte experimental a Node middleware.
- **Cliente:** `src/lib/auth-client.ts` (`createAuthClient` de `better-auth/react`). Login, login rápido do `/demo` e os dois botões "Sair da conta" usam `authClient.signIn.email` / `authClient.signOut`, com as mesmas mensagens.
- `isConfigured()` agora é `src/server/config.ts` (binding `DB` + `BETTER_AUTH_SECRET`).
- **Perfil:** `PATCH /api/profile` + `src/server/services/profile.ts`. Só altera o que os grants originais permitiam: `name`/`phone` do próprio perfil, colunas de `ngo_preferences` da própria ONG (papel NGO) e `availability` do próprio motorista. Schemas Zod `strict`: qualquer outro campo (papel, organização, e-mail) é rejeitado. Grava tudo num `batch`.
- **Usuários demo:** `scripts/create-demo-users.ts --local|--remote`. Escolha: **SQL gerado + `wrangler d1 execute`**, com a senha passada pelo `hashPassword` do próprio Better Auth (`better-auth/crypto`). Funciona igual no D1 local e no remoto, é idempotente (upsert) e dispensa endpoint administrativo exposto, então **não foi preciso `ADMIN_SETUP_TOKEN`**. O script também cria organizações e aplica o seed (`scripts/seed-d1.ts`, antecipado da etapa 16) porque `drivers` e as entregas históricas dependem dos perfis.

## Antecipado do prompt 12 (para o portão ficar verde)

Trocar o retorno de `requireProfile` quebraria todas as telas que liam com `client.from(...)`. Por isso as **leituras** já passaram para o D1 nesta etapa:

- `src/server/permissions.ts`: `loadActor`, `member`, `canReadRescue`, `canReadBatch` e as cláusulas `readableRescues`/`readableBatches` (políticas `read_rescues`, `read_events`, `read_impact`, `read_batches`, `read_items`).
- `src/server/queries.ts`: lista de resgates com lote e impacto (limite 200), diretório de organizações, feed de doações com itens, preferências, motorista, notificações (30), detalhe de lote e de resgate.
- Telas ajustadas: layout, home, doações, resgates, impacto, relatórios, perfil, missões, detalhe de lote e de resgate.

Continuam no Supabase até as próximas etapas (código morto sem Supabase configurado, mas compila): `/api/upload` e `/api/analyze` (etapas 13/15), `/api/batches`, `/api/demo/reset`, ações de `rescue-actions.tsx` e o `read_at` das notificações (etapa 12). O `realtime.tsx` virou só o refresh de 15 s até a etapa 14; o selo fica em "Sincronizando".

## Testes

- `tests/d1/auth.test.ts` (5): senha certa (cookie `HttpOnly`, `SameSite=Lax`) e errada / e-mail inexistente (401); autocadastro bloqueado; sem sessão → `/login`; com sessão → perfil e organização; usuário sem profile → `/login?profile=missing`; logout invalida a sessão no servidor.
- `e2e/auth.spec.ts` (contra `cf:preview`): senha errada mostra a mensagem em português, login certo leva a `/home` da ONG, sair da conta, `/home` volta para `/login`, login rápido do motorista no `/demo` cai em `/driver/missions`, sem erro no console. Passou.
- Seed local conferido: 11 usuários, 11 perfis, 8 organizações, 16 métricas, 3 missões aguardando motorista, 4 doações disponíveis; reexecução idempotente.
- Portão: lint, typecheck, test (40), build, cf:build verdes. `e2e/public.spec.ts` e `landing.spec.ts` seguem passando no preview.

## Pendências

- `npx wrangler secret put BETTER_AUTH_SECRET` (gerar com `openssl rand -base64 32`) no Worker de produção. Depende do primeiro deploy, que segue bloqueado pela permissão do Claude Code.
- `npx tsx scripts/create-demo-users.ts --remote` depois da migration remota.
