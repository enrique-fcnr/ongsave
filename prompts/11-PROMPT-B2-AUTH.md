# 11 · Prompt B2 · Auth sem Supabase (Better Auth + D1)

Leia antes: `prompts/00-...`, `prompts/RELATORIO-10.md`, `src/lib/auth.ts`, `src/lib/http.ts`, `src/proxy.ts`, `src/components/login-form.tsx`, `src/components/demo-controls.tsx`, `src/components/shell.tsx`, `src/components/profile-form.tsx`, `src/app/(app)/layout.tsx`, `src/app/login/page.tsx`, `scripts/create-demo-users.ts`.

## Objetivo
Trocar o Supabase Auth por **Better Auth** com e-mail e senha guardados no D1. O resto do app continua igual por fora: mesma tela de login, mesmas contas demo (`mercado@`, `ong@`, `motorista@ongsave.demo`, senha `demo123`) e mesmos redirecionamentos.

## Passos
1. Instale `better-auth`. Siga a doc atual de Better Auth para D1 e Next.js (https://better-auth.com/docs). Gere as tabelas do Better Auth (`user`, `session`, `account`, `verification`) como migration Drizzle/D1, junto com as do prompt 10.
2. `src/server/auth/auth.ts`:
   - instância com `emailAndPassword` habilitado e **autocadastro desabilitado** (o README diz que não há autoinscrição);
   - cookies `httpOnly`, `secure` em produção e `sameSite=lax`;
   - `BETTER_AUTH_SECRET` via `wrangler secret put`;
   - `BETTER_AUTH_URL` igual a `NEXT_PUBLIC_APP_URL`.
   - Monte a rota catch-all `src/app/api/auth/[...all]/route.ts`.
3. **Hash de senha (plano Free, 10 ms de CPU):**
   - o padrão do Better Auth (scrypt) tende a estourar o limite; configure `password.hash`/`password.verify` customizados com **PBKDF2-SHA256 do WebCrypto** (`crypto.subtle.deriveBits`), salt aleatório de 16 bytes e formato versionado `pbkdf2$<iter>$<salt>$<hash>`, que permite subir as iterações no futuro;
   - **calibre** as iterações medindo a CPU do login no `cf:preview`: o maior valor que mantenha o login abaixo de ~8 ms. Registre o número e a medição no relatório, e deixe claro que é um trade-off do plano Free;
   - **compensações:** rate limit de tentativas de login por e-mail e IP (D1 ou Durable Object) e sessão longa, para logar pouco.
4. **`requireProfile()`** (`src/lib/auth.ts`) passa a:
   - ler a sessão do Better Auth;
   - buscar `profiles` por `auth_user_id` e a organização via `organization_members` no D1;
   - manter a mesma assinatura de retorno, trocando `client` por `db`.
   
   Mantenha `cache()` por request. Atualize `src/lib/http.ts` (autenticação das APIs) do mesmo jeito.
5. **`proxy.ts`:** sem Supabase. Só renova ou valida o cookie de sessão se a doc do Better Auth recomendar para o Next 16; se não precisar, deixe o proxy mínimo. Lembre que o suporte a `proxy.ts` no OpenNext é experimental: teste no `cf:preview`.
6. **Cliente:** login, logout e o login rápido do `/demo` usam o client do Better Auth (`signIn.email`, `signOut`). Mantenha as mensagens de erro atuais em português.
7. **`scripts/create-demo-users.ts`:** passa a criar os 11 usuários no Better Auth e a vincular `profiles`, `organization_members` e `drivers` no D1. Escreva o script para rodar contra o D1 local e o remoto. Use a API do Better Auth, ou um endpoint protegido só ativo com `ENABLE_DEMO_MODE=true` e um `ADMIN_SETUP_TOKEN` secreto. Documente a escolha.
8. **Segurança:**
   - papel e organização **nunca** vêm do cliente;
   - só o servidor cria vínculo;
   - o perfil só altera nome e telefone (como no `grant update(phone,name)` original).
9. **Testes:** login certo e errado, rota protegida sem sessão redireciona para `/login`, usuário sem profile vai para `/login?profile=missing`, logout invalida a sessão.
10. Relatório `prompts/RELATORIO-11.md`.

Ao terminar: **"Prompt 11 concluído."**
