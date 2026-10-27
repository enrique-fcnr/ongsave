# ONGSave

**Uma fotografia inicia um resgate completo.** PWA mobile-first que conecta supermercados, ONGs e motoristas para resgatar excedentes de alimentos, com análise da foto por IA.

🏆 **3º lugar no FIAP NEXT 2026** · Desenvolvido por [Enrique Fernandes](https://www.linkedin.com/in/enrique-fernandes-b21754217)

**Demo:** https://ongsave.vercel.app · [Login](https://ongsave.vercel.app/login) · [Roteiro de demonstração](https://ongsave.vercel.app/demo)

| Papel | E-mail | Senha |
| --- | --- | --- |
| Supermercado | mercado@ongsave.demo | demo123 |
| ONG | ong@ongsave.demo | demo123 |
| Motorista | motorista@ongsave.demo | demo123 |

Contas e dados são fixtures acadêmicas. A demo publicada roda com `AI_MODE=demo` (análise de IA simulada e rotulada como demo); upload, publicação, reserva e entrega são reais no Supabase.

## Como funciona

Supermercado fotografa o excedente → upload privado → **IA analisa a foto** → revisão humana → publicação → ONG reserva → missão criada → motorista aceita, coleta e transporta → entrega validada por código → impacto, linha do tempo e notificações atualizados em tempo real.

Papéis: supermercado, ONG, motorista, administrador e doador financeiro.

## Decisões técnicas

- **IA multimodal com humano no circuito:** a foto vai para um modelo multimodal da OpenAI com saída em JSON estrito validada por Zod. A revisão humana salva os dados corrigidos e preserva o JSON original e a proveniência. Se a IA falha, o upload permanece e o usuário tenta de novo ou preenche manualmente.
- **Integridade no banco, não só na interface:** as mutações críticas são funções transacionais do PostgreSQL. RLS e grants por coluna impedem alterar papel, status ou impacto. Reservas e missões usam locks: um lote não pode ser reservado duas vezes.
- **Segurança da entrega:** o código de validação é privado e não é enviado ao motorista junto com a missão.
- **Tempo real:** lotes, reservas, missões, eventos, métricas e notificações publicados via Supabase Realtime.
- **Storage privado:** bucket `surplus` privado, limite de 4 MB; fotos reduzidas no celular para JPEG de até 1600 px antes do upload.

## Stack

Next.js 16 · React 19 · TypeScript · Supabase (Auth, PostgreSQL, Storage, Realtime) · OpenAI (modelo multimodal) · Zod · MapLibre (OpenFreeMap) · PWA · Tailwind · shadcn/ui · Vitest · Playwright · Vercel

## Testes

- **Vitest:** estados, token, impacto, matching e schemas; **executa as migrations, o seed e o fluxo completo em PostgreSQL embarcado (PGlite)**, testando isolamento RLS, proteção de papel, reserva dupla, motorista concorrente, código errado, métrica única e reset.
- **Playwright:** responsividade de 375 a 1440 px, login, proteção de rotas e assets PWA; e um cenário real com três sessões isoladas (supermercado, ONG e motorista) que envia uma foto, verifica Realtime, mapa e rota, testa código errado e certo, entrega e indicadores.
- No deploy HTTPS, dez testes de navegador passaram, incluindo duas entregas completas com reset entre elas.

## Rodar localmente

Requer Node.js 22.14+ e um projeto Supabase dedicado.

```bash
npm install
cp .env.example .env.local   # preencha as variáveis abaixo
npm run db:migrate           # ou aplique supabase/migrations/ no SQL Editor, em ordem
npm run demo:users           # cria as contas demo e aplica o seed (idempotente)
npm run dev
```

| Variável | Uso |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Chave pública (ou `NEXT_PUBLIC_SUPABASE_ANON_KEY`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Somente servidor e scripts |
| `AI_MODE` | `demo` (fixture rotulada) ou `live` (análise real) |
| `OPENAI_API_KEY` / `AI_MODEL` | Necessárias em `live`; ex.: `gpt-4.1-mini` |
| `ENABLE_DEMO_MODE` | `true` habilita `/demo` e o reset |
| `DATABASE_URL` | Opcional, para `npm run db:migrate` |

Nunca exponha a Service Role ou a chave da OpenAI em variáveis `NEXT_PUBLIC_*`.

Validação: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` e `npm run test:e2e`. O cenário completo de três sessões (`RUN_LIVE_E2E=true`) reseta a demo: rode só em um banco dedicado. Roteiro e resultados em `docs/DEMONSTRATION.md` e `docs/QA.md`.

## Estrutura

```text
src/app/              páginas, rotas operacionais e APIs
src/lib/ai/           provider, prompt, schema e análise
src/lib/domain.ts     estados, transições, matching e impacto
src/lib/supabase/     clientes browser/server/admin
supabase/migrations/  schema, RLS, RPCs, Storage e Realtime
tests/                domínio e integração SQL/RLS com PGlite
e2e/                  responsividade e cenário real de três sessões
docs/                 arquitetura, demonstração e QA
```

## Limites conhecidos

- GPS, rotas, distância e ETA são simulados e identificados como tal; não há push nem rastreamento real.
- Impacto ambiental e economia são projeções ilustrativas, não relatório ESG certificado.
- A análise de IA não determina segurança alimentar; a revisão humana é obrigatória.
- O PWA opera online; offline mostra uma tela de reconexão.
- Câmera e instalação do PWA ainda precisam de homologação em aparelhos físicos.

Próximos passos: rate limit para chamadas de IA, expiração automática de lotes, onboarding administrativo e paginação.
