# Relatório 02 · Base Cloudflare (Next no Workers)

## O que mudou

- `@opennextjs/cloudflare@1.20.9` e `wrangler@4.149.0` como devDependencies. O 1.20.9 suporta Next 16.3.8; o `proxy.ts` compila como "Node.js middleware", com o aviso do OpenNext de que o suporte é experimental. No preview funcionou sem erro.
- `wrangler.jsonc`: `name: ongsave`, `account_id: 51f772f7656a812951d1ee9ce5c3f9c0`, `compatibility_date: 2026-10-08`, `nodejs_compat` + `global_fetch_strictly_public`, assets com `html_handling: "none"` (sem isso `/offline.html` virava redirect 307 para `/offline`, e o service worker cacheia `/offline.html`), observability ligada, `vars` `AI_MODE=demo`, `ENABLE_DEMO_MODE=true`, `NEXT_PUBLIC_MAP_PROVIDER=maplibre`. Sem D1/R2/DO/AI ainda.
- `open-next.config.ts`: `defineCloudflareConfig()` sem cache incremental.
- `next.config.ts`: `initOpenNextCloudflareForDev()`; headers mantidos.
- Scripts: `cf:build` (roda `prepare-maplibre.mjs` antes), `cf:preview`, `cf:deploy`, `cf-typegen` (com `--strict-vars=false`, senão `AI_MODE` vira o literal `"demo"` e quebra comparações).
- `.env.production` (versionado, sem segredo): `NEXT_PUBLIC_APP_URL=https://ongsave.eduardofonseca1401.workers.dev`. `.gitignore` libera só esse arquivo e ignora `.open-next/`, `.dev.vars`, `.wrangler/`. Criado `.dev.vars.example`.
- `public/_headers`: cache imutável para `/_next/static/*`, como pede a doc do OpenNext.
- **Subdomínio workers.dev:** a conta não tinha. Registrei `eduardofonseca1401` via API (o mesmo nome que o painel geraria a partir do e-mail).
- **Tipos:** o `cloudflare-env.d.ts` gerado traz os tipos do runtime Workers, em que `Response.json()` devolve `unknown`. Tipei as 4 chamadas (`surplus-form.tsx`, `demo-controls.tsx`, `providers/openai.ts`). Só tipos; sem mudança de comportamento.
- **Guarda "não configurado":** `apiUser` agora responde "Faça login para continuar." quando não há banco, em vez de estourar a exceção do Supabase. `/home` e demais rotas protegidas já redirecionavam para `/login?setup=1`.
- ESLint/Prettier ignoram `.open-next/`, `.wrangler/` e `cloudflare-env.d.ts` (o lint estourava memória varrendo o bundle).
- Playwright: com `E2E_BASE_URL` definido, não sobe `next dev`.
- README: seção "Cloudflare".
- Sem `runtime = "edge"` no código. `sharp` segue só em scripts. `Buffer` nas rotas funciona com `nodejs_compat` e sai nas etapas 13/15.

## Testes

- `npm run lint`, `typecheck`, `test` (25), `build`, `cf:build`: verdes.
- `cf:preview` (porta 8787): `/`, `/login`, `/demo` 200; `/home` → `/login?setup=1`; manifest, `sw.js`, `offline.html`, `maplibre-gl-worker.mjs`, `maplibre-gl-shared.mjs` 200.
- Playwright `e2e/landing.spec.ts` + `e2e/public.spec.ts` contra o preview: **12/12 passando**.

## Tamanho do Worker

`wrangler deploy --dry-run`: 14.885 KiB, **3.245 KiB gzip**. Acima dos 3 MiB do Free: **o plano Workers Paid é obrigatório**, não só recomendado.

## Pendências

- **Deploy não executado.** `opennextjs-cloudflare deploy` foi bloqueado pelo controle de permissões do Claude Code (modo automático). O Edu precisa rodar `npm run cf:deploy` (ou liberar a permissão) e repetir os testes na URL publicada.
- Confirmar que a conta está no Workers Paid antes do deploy.
