# Handoff ONGSave

O ONGSave roda 100% na Cloudflare, na conta **Eduardofonseca1401@gmail.com's Account** (`51f772f7656a812951d1ee9ce5c3f9c0`), branch `feat/edu`. A versão anterior (Vercel + Supabase do Enrique) segue intocada na `main` até o corte final.

- **URL:** https://ongsave.eduardofonseca1401.workers.dev (login em `/login`, roteiro em `/demo`). Veja em `prompts/PROGRESSO.md` se o primeiro deploy já foi feito.
- **Implementado:** login, três perfis, foto com upload privado, análise demo/OpenAI/Workers AI, revisão humana, publicação, reserva, missão, mapa, coleta, transporte, código de entrega, notificações, tempo real, histórico, impacto, relatório ESG, PWA e reset.
- **Stack:** Next.js 16.3.8 no Workers via `@opennextjs/cloudflare`; D1 + Drizzle; Better Auth; R2; Durable Object `RealtimeHub`; Workers AI opcional. Regras de negócio em `src/server/services/`, permissões em `src/server/permissions.ts`. Detalhes em `docs/ARCHITECTURE.md`.
- **Recursos:** D1 `ongsave-db` (`00fa9a8f-288f-4f62-9e54-1bf371087c75`), bucket R2 `ongsave-photos`, DO `RealtimeHub`, binding `AI`.
- **Contas:** `mercado@ongsave.demo`, `ong@ongsave.demo`, `motorista@ongsave.demo`, senha `demo123` (mais 8 contas de apoio).
- **Segredos:** `BETTER_AUTH_SECRET` (obrigatório) e `OPENAI_API_KEY` (opcional), via `npx wrangler secret put`. Localmente em `.dev.vars` (ignorado pelo Git; modelo em `.dev.vars.example`).
- **Rodar local:** `npm install`, `cp .dev.vars.example .dev.vars` (preencha o segredo), `npm run db:migrate:local`, `npm run demo:users -- --local`, `npm run cf:preview` → http://localhost:8787. O `npm run dev` também funciona, mas sem o Durable Object (o selo fica em "Sincronizando" e vale o refresh de 15 s).
- **IA real:** `AI_MODE=live` e `AI_PROVIDER=workers-ai` (sem chave) ou `AI_PROVIDER=openai` com `OPENAI_API_KEY`. Timeout, Zod e fallback manual valem para os dois.
- **Reset:** botão do `/demo` (como Mercado Paulista) ou `npm run demo:reset` (produção) / `npm run demo:reset -- http://localhost:8787`. Preserva as 16 entregas históricas, restaura doações e missões seed e apaga fluxo e fotos da conta oficial.
- **Validação:** lint, typecheck, 76 testes Vitest (domínio, IA, D1, auth, R2, regras e concorrência), build e build Cloudflare; 30 testes de navegador no `cf:preview`, incluindo o fluxo oficial com três sessões (24 s para duas entregas). Evidências em `docs/QA.md` e `prompts/RELATORIO-*.md`.
- **Limitações:** câmera e instalação PWA em aparelhos físicos ainda não homologadas; GPS, rota, ETA e histórico seed são simulações identificadas; impacto e ESG são estimativas; transações exigem conexão.
