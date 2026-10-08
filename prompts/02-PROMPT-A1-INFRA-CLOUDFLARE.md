# 02 · Prompt A1 · Base Cloudflare: Next no Workers, sem Supabase

Leia antes: `prompts/00-PLANO-MIGRACAO-CLOUDFLARE.md` (decisão e regras), `AGENTS.md`, `README.md`, `docs/ARCHITECTURE.md`, `next.config.ts`, `src/proxy.ts`, `src/lib/supabase/config.ts`, `package.json`.

## Conta Cloudflare (obrigatório)
Use **somente** `Eduardofonseca1401@gmail.com's Account`, Account ID **`51f772f7656a812951d1ee9ce5c3f9c0`**, gravado como `"account_id"` no `wrangler.jsonc`.
- Antes de criar ou publicar qualquer coisa, rode `npx wrangler whoami` e confirme que esse ID aparece.
- Nunca use as contas Agentdoctoradm (`5464e9...`) nem Paulatoridol (`83eee4...`).

## Decisão
O app **não** vai usar o Supabase atual em nenhum momento. Não peça e não use chaves do Supabase. O banco novo nasce no prompt 10. Este prompt monta só a base de hospedagem.

## Objetivo
O código atual compila e roda num Cloudflare Worker via `@opennextjs/cloudflare`, publicado em `https://ongsave.<subdominio>.workers.dev`. Como ainda não há banco:
- a **landing** (`/`) funciona inteira;
- o **mapa** carrega;
- `/login` e as rotas protegidas mostram o estado "não configurado" que o app já tem (`isConfigured() === false` → `/login?setup=1`), **sem erro 500**.

## Passos
1. **Dependências:** `@opennextjs/cloudflare@^1.20.8` e `wrangler@latest` como devDependencies. Confirme no changelog (https://github.com/opennextjs/opennextjs-cloudflare/releases) o suporte a Next 16.3.8 e a `proxy.ts`. Se o `proxy.ts` quebrar no build ou no preview, siga a doc; se a doc não resolver, **pare e registre em `prompts/DUVIDAS.md`**.
2. **`wrangler.jsonc`:**
   - `name: "ongsave"` e o `account_id` acima;
   - `main: ".open-next/worker.js"` e `compatibility_date` de hoje;
   - `compatibility_flags: ["nodejs_compat", "global_fetch_strictly_public"]`;
   - `assets: { directory: ".open-next/assets", binding: "ASSETS" }`;
   - `observability.enabled: true`.
   
   **Ainda sem** D1, R2, DO ou AI: cada prompt seguinte adiciona o seu binding.
3. **`open-next.config.ts`** com `defineCloudflareConfig()`, sem cache incremental em R2 (o app é dinâmico). **`next.config.ts`:** `initOpenNextCloudflareForDev()` conforme a doc, mantendo os headers atuais.
4. **Scripts:** `cf:build`, `cf:preview`, `cf:deploy` e `cf-typegen`. Garanta que `scripts/prepare-maplibre.mjs` rode antes do build do OpenNext e que `public/maplibre/` vá para os assets. `.gitignore`: `.open-next/`, `.dev.vars`, `.wrangler/`. Crie `.dev.vars.example`.
5. **Variáveis:**
   - `vars` no `wrangler.jsonc`: `AI_MODE=demo`, `ENABLE_DEMO_MODE=true`, `NEXT_PUBLIC_MAP_PROVIDER=maplibre`;
   - `NEXT_PUBLIC_APP_URL`: a URL workers.dev, que entra no build (`.env.production`, sem segredo).
   
   **Nenhuma variável Supabase.**
6. **Compatibilidade:**
   - `sharp` só em scripts, nunca no bundle;
   - troque APIs Node não suportadas por equivalentes Web sem mudar comportamento;
   - remova `runtime = "edge"`, se existir.
7. **Sem banco, sem erro:** confira que a ausência das variáveis Supabase leva ao comportamento "não configurado" já existente, e não a exceção. Se alguma rota quebrar, ajuste **só** a guarda (`isConfigured`) e registre. Não comece a trocar o Supabase aqui; isso é dos prompts 10+.
8. **Plano Free (10 ms de CPU por requisição):** garanta que a landing e as páginas públicas sejam pré-renderizadas como estáticas (sem SSR por request), se o código permitir sem mudar o visual. No `cf:preview` e depois em produção, meça a CPU de `/`, `/login` e `/demo` pelos logs e registre no relatório. Meta: abaixo de ~8 ms.
9. **Teste:** `npm run cf:preview` → landing, `/login`, `/demo`, mapa (workers do MapLibre sem 404), `manifest`/`sw.js`, sem erro no console. Rode os testes públicos do Playwright (`e2e/landing.spec.ts`, `e2e/public.spec.ts`) contra o preview.
10. **Deploy:** `npm run cf:deploy`. Repita o teste na URL publicada.
11. **Docs e commit:** seção "Cloudflare" no README (contas, comandos, variáveis) e relatório `prompts/RELATORIO-02.md` com a URL, a versão do adapter, o tamanho do Worker, avisos e pendências. Commit na `feat/edu`, incluindo a pasta `prompts/`. Push.

## Não fazer
- Usar ou pedir chaves do Supabase.
- Mudar telas, textos ou regras.
- Mexer na `main` ou na Vercel.

Ao terminar: **"Prompt 02 concluído."**
