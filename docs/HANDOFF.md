# Handoff ONGSave

O MVP está integrado ao projeto Supabase **Ongsave**, `xhsbrwksbmxdzhujpyeb`. O fluxo oficial foi concluído duas vezes em produção no Chrome, com reset entre as execuções.

- **Implementado:** Auth, três perfis, foto/upload privado, análise demo/live, revisão humana, publicação, reserva, missão, mapa interativo, coleta/transporte/token/entrega, notificações, Realtime, histórico, impacto, relatório ESG, PWA e reset.
- **Arquitetura:** Next.js 16.3.8 App Router, React, TypeScript strict, Tailwind/shadcn, Zod, MapLibre e Supabase. Server Components consultam dados; componentes clientes operam interações. RPCs PostgreSQL transacionais concentram regras, RLS e concorrência. Provider multimodal desacoplado em `src/lib/ai/`.
- **Banco:** migration `supabase/migrations/20261001113753_ongsave_core.sql` aplicada via MCP OAuth. RLS nas 12 tabelas públicas, seis tabelas Realtime, bucket privado de 4 MB. Bootstrap executado: 11 usuários, oito organizações, três motoristas e 16 entregas históricas.
- **Contas:** `mercado@ongsave.demo`, `ong@ongsave.demo`, `motorista@ongsave.demo`; senha comum `demo123`.
- **Relógio:** segunda migration `20261001124638_ongsave_server_clock.sql` aplicada; gráficos, relatórios e prazos usam a data do banco.
- **Ambiente:** URL, chave pública e chave de servidor Supabase em `.env.local`, ignorado pelo Git. `AI_MODE=demo` e `ENABLE_DEMO_MODE=true`. Apenas `OPENAI_API_KEY` falta para análise live; `DATABASE_URL` é opcional.
- **Rodar:** em `C:\Users\enriq\ongsave`, `npm run dev`; abrir `http://localhost:3000`. Produção: `npm run build` e `npm run start`. O servidor de produção foi deixado ativo na porta 3000.
- **IA real:** preencher `OPENAI_API_KEY`, definir `AI_MODE=live`, `AI_PROVIDER=openai` e `AI_MODEL` multimodal disponível; reiniciar desenvolvimento ou gerar novo build de produção. Timeout, JSON/Zod e fallback manual estão implementados.
- **Demo:** abrir `/demo` e entrar em cada conta. A análise é identificada como demonstrativa; Auth, Storage, banco e Realtime são reais. Roteiro em `docs/DEMONSTRATION.md`.
- **Reset:** pela tela `/demo`, autenticado como mercado oficial, ou `npm run demo:reset`. Preserva as 16 entregas históricas, restaura oportunidades/missões seed e remove o fluxo/fotos da conta oficial. Não reexecutar bootstrap durante uma missão.
- **Validação:** lint sem avisos, typecheck, 25 testes Vitest e build aprovados; nove testes públicos/PWA/foto/origem e o teste remoto de duas entregas aprovados em produção. `npm audit`: zero vulnerabilidades. Evidências em `docs/QA.md`.
- **Limitações:** OpenAI live ainda não chamado; instalação/câmera em aparelhos físicos ainda não homologadas; nenhum deploy HTTPS. GPS, rota, ETA e histórico seed são simulações identificadas. Refeições e ESG são estimativas; PDF usa impressão do navegador. Transações precisam de conexão.

README detalha instalação e comandos. `docs/ARCHITECTURE.md` descreve as responsabilidades; `docs/SPECIFICATION.md` preserva o pedido original. Para apresentação em celulares, publique em HTTPS e execute o roteiro nos aparelhos.
