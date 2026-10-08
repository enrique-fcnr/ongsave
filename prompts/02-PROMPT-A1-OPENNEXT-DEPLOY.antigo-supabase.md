# 02 · Prompt A1 · Tirar da Vercel e rodar em produção na Cloudflare (Supabase continua)

Você está no repositório `ongsave`, branch `feat/edu`. Leia antes: `prompts/00-PLANO-MIGRACAO-CLOUDFLARE.md`, `AGENTS.md`, `README.md`, `docs/ARCHITECTURE.md`, `next.config.ts`, `src/proxy.ts`, `package.json`.

## Objetivo

O app atual, sem mudar nenhuma funcionalidade, roda em produção num Cloudflare Worker via `@opennextjs/cloudflare`, ainda usando o Supabase. Ao fim existe uma URL `https://ongsave.<subdominio>.workers.dev` com login, foto, publicação, aceite, missão, entrega e impacto funcionando.

## Conta Cloudflare (obrigatório)

O login do wrangler enxerga três contas. O ONGSave vai **somente** em `Eduardofonseca1401@gmail.com's Account`. Antes de qualquer comando que crie ou publique algo, rode `npx wrangler whoami`, mostre as contas ao Edu e peça o Account ID dessa conta, caso ele não tenha colado. Grave como `"account_id"` no `wrangler.jsonc`. Nunca crie recurso em Agentdoctoradm nem em Paulatoridol. Se o `whoami` não listar a conta Eduardofonseca1401, pare e peça ao Edu para refazer `npx wrangler login`.

## Passos

1. **Dependências:** instale `@opennextjs/cloudflare@^1.20.8` e `wrangler@latest` como devDependencies. Confirme no changelog oficial (https://github.com/opennextjs/opennextjs-cloudflare/releases) que a versão instalada suporta Next 16.3.8 e `proxy.ts`. Se o suporte a `proxy.ts` (node middleware) falhar no build ou no preview, siga o que a doc indicar; se ela não indicar nada, **pare e registre em `prompts/DUVIDAS.md`**, sem trocar o proxy por outra coisa por conta própria.
2. **Config**, seguindo https://opennext.js.org/cloudflare/get-started:
   - `wrangler.jsonc` com `name: "ongsave"`, `main: ".open-next/worker.js"`, `compatibility_date` recente (hoje), `compatibility_flags: ["nodejs_compat", "global_fetch_strictly_public"]`, `assets: { directory: ".open-next/assets", binding: "ASSETS" }` e `observability.enabled: true`.
   - `open-next.config.ts` com `defineCloudflareConfig()`. Cache incremental só se precisar; o app é dinâmico e não usa ISR. Se não precisar de R2 para cache, não crie.
   - `next.config.ts`: adicione `initOpenNextCloudflareForDev()` conforme a doc, sem remover os headers existentes.
   - Remova qualquer `export const runtime = "edge"`, se existir. Mantenha `maxDuration` só onde a doc disser que tem efeito; senão comente que no Workers o limite é de CPU.
3. **Scripts** no `package.json`: `cf:build` (`opennextjs-cloudflare build`), `cf:preview`, `cf:deploy` e `cf-typegen`. Os scripts `predev`/`prebuild` do MapLibre precisam rodar antes do build do OpenNext. Confira que `public/maplibre/` vai para os assets.
4. **Variáveis:**
   - As `NEXT_PUBLIC_*` (`NEXT_PUBLIC_APP_URL` com a URL workers.dev, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_MAP_PROVIDER`) entram no build. Garanta que o build leia o `.env.local` ou um `.env.production`. Nunca commite valores.
   - Segredos de runtime (`SUPABASE_SERVICE_ROLE_KEY`, e `OPENAI_API_KEY` se existir) via `npx wrangler secret put`. Variáveis não secretas (`AI_MODE=demo`, `AI_PROVIDER=openai`, `AI_MODEL`, `ENABLE_DEMO_MODE=true`) em `vars` no `wrangler.jsonc`.
   - Crie `.dev.vars.example` e adicione `.dev.vars` e `.open-next/` ao `.gitignore`.
5. **Compatibilidade:** procure APIs Node que não existem no Workers (fs, child_process, sharp em runtime). `sharp` só pode aparecer em scripts, nunca no bundle do servidor. Confira `src/app/api/upload/route.ts` (detecção de tipo pelo conteúdo) e `src/lib/prepare-photo.ts`. Se algo depender de Node não suportado, troque pelo equivalente Web (Uint8Array, Response, crypto.subtle) sem mudar o comportamento.
6. **Teste local:** `npm run cf:preview`. Teste os 3 papéis pelo `/demo` (contas `mercado@`, `ong@` e `motorista@ongsave.demo`, senha `demo123`): login, foto (use `e2e/fixtures/vegetables.jpg`), publicação, aceite da ONG, missão, coleta, token, entrega e impacto. Confira o mapa (workers do MapLibre servidos de `/maplibre/`) e o "Atualizações ao vivo" (Supabase Realtime). No fim, resete pelo `/demo`.
7. **Deploy:** `npm run cf:deploy`. Repita o teste do passo 6 na URL publicada. Rode `npm run test:e2e` apontando para a URL (veja `playwright.config.ts`; use uma variável de base URL se existir, sem rodar o `live-flow` sem combinar com o Edu, porque ele reseta a demo).
8. **Documentação:** em `README.md`, uma seção "Deploy Cloudflare (Etapa A)" com comandos, variáveis e o passo manual de adicionar a URL nas Redirect URLs do Supabase Auth. Não apague a seção da Vercel ainda; marque-a como "legado".
9. Relatório em `prompts/RELATORIO-02.md`: URL publicada, versão do adapter, o que foi testado, tempo de resposta percebido, avisos do build e pendências.

## Não fazer

- Não trocar Supabase por nada ainda.
- Não mexer em telas, textos ou regras.
- Não fazer merge na `main` nem desligar a Vercel. Isso só depois que o Edu validar.

Ao terminar: **"Prompt 02 concluído."**
