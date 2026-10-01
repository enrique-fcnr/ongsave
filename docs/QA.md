# Verificação — 1 de outubro de 2026

## Deploy HTTPS na Vercel

Produção publicada em https://ongsave.vercel.app, com domínio HTTPS, variáveis de ambiente e Supabase Auth configurados. O build da aplicação (`16e8a23`) ficou Ready em 1 minuto e 6 segundos. O repositório GitHub está conectado à branch `main` para os próximos deploys.

A suíte completa foi executada com `E2E_BASE_URL=https://ongsave.vercel.app`, `RUN_LIVE_E2E=true` e `PLAYWRIGHT_CHANNEL=chrome`: **10 testes aprovados em 1,7 minuto**. Confirmou os três logins, upload privado, IA demo e fallback manual, reservas, missões, tiles/mapa/rota, frames Realtime, código de entrega, impacto e reset. A demo foi restaurada após a execução. A chamada OpenAI real e a homologação em aparelhos físicos continuam pendentes.

## Verificação local anterior

| Verificação                      | Resultado                                                          |
| -------------------------------- | ------------------------------------------------------------------ |
| ESLint                           | Aprovado, sem erros ou avisos                                      |
| TypeScript strict / tipos Next   | Aprovado                                                           |
| Vitest                           | 25 testes aprovados, 3 arquivos                                    |
| Browser público/PWA/foto/origem  | 9 testes aprovados em Chrome, build de produção                    |
| Fluxo remoto completo            | 1 teste aprovado, com duas entregas e reset entre elas             |
| Build Next.js de produção        | Aprovado, todas as rotas compiladas                                |
| npm audit                        | 0 vulnerabilidades                                                 |
| Supabase                         | Ongsave xhsbrwksbmxdzhujpyeb, configurado e testado                |
| IA OpenAI live                   | Provider e contrato testados; chamada real não executada sem chave |
| Câmera física / PWA em celulares | Homologação nos aparelhos ainda não realizada                      |

## Fluxo comprovado no Supabase hospedado

O teste `e2e/live-flow.spec.ts` abriu três sessões Chrome isoladas em 390 × 844 px, com as contas oficiais do mercado, ONG e motorista. Uma fotografia CC0 real foi enviada ao bucket privado, analisada no modo demo e revisada antes da publicação. O título e o peso corrigidos foram persistidos.

O cenário verificou mensagens `postgres_changes` no WebSocket; o polling sozinho não satisfaz essas verificações. A imagem assinada carregou no feed da ONG, e sua notificação apareceu. A ONG aceitou a doação, criando a missão. O MapLibre carregou tiles OpenStreetMap, desenhou a rota e exibiu marcadores de coleta, instituição e motorista. O motorista aceitou e avançou cada etapa até a ONG.

O código foi mostrado somente à ONG. Um código errado foi rejeitado, seguido da confirmação com o código correto. As três sessões exibiram a entrega e nove eventos da timeline. Dashboards e históricos ficaram abertos desde antes da publicação e atualizaram automaticamente: +23 kg, +46 refeições estimadas e +1 resgate para cada conta.

O reset pela tela `/demo` restaurou indicadores seed e removeu o lote anterior e sua foto. A exclusão foi conferida pela API autenticada de metadados do Storage: downloads por URLs assinadas já usadas podem permanecer na CDN após a exclusão. Consulte a [documentação do cache Supabase](https://supabase.com/docs/guides/storage/cdn/smart-cdn).

O fluxo foi repetido com falha HTTP 503 injetada em `/api/analyze`, verificando preenchimento manual sem perder o upload. A segunda entrega concluiu com +17 kg, +34 refeições e +1 resgate. O gráfico da última semana também aumentou pelo peso entregue nas três contas. A execução final completa aprovou os dez testes em 1,8 minuto, sem erros JavaScript.

## Banco e segurança

A migration `20261001113753_ongsave_core.sql` foi aplicada via MCP autenticado. Auditoria confirmou 12 tabelas públicas com RLS, seis tabelas Realtime e bucket privado `surplus`, limitado a JPEG/PNG/WebP e 4 MB. O bootstrap criou 11 usuários Auth confirmados, oito organizações, três motoristas e 16 entregas históricas com métricas.

A migration `20261001124638_ongsave_server_clock.sql` adiciona o relógio operacional do banco, usado nos gráficos, relatórios e filtros de prazo. Isso mantém os indicadores coerentes quando o relógio do computador está diferente do Supabase.

Advisors retornaram somente dois avisos informativos sobre tabelas privadas com RLS sem policy. A restrição é intencional: análises e tokens são acessados por funções privilegiadas. Nenhum grant anônimo foi introduzido para corrigir Realtime; o app aguarda a sessão Auth e a assinatura Postgres antes de anunciar conexão ao vivo. O slot usado no diagnóstico foi removido.

Os testes SQL locais executam migration, seed, RLS e fluxo em PostgreSQL PGlite. Incluem isolamento entre contas, proteção de papel, dupla reserva, motorista concorrente, transições, token incorreto, impacto único e reset que preserva histórico. Auth e Storage são schemas substitutos nesses testes; o cenário remoto valida os serviços reais.

## Interface, PWA e IA

Os testes públicos cobriram 375, 390, 430, 768, 1280 e 1440 px, proteção de rotas, navegação, manifest, ícones, service worker e bloqueio de origem externa nas APIs. A preparação de imagem rodou no navegador: entrada 4000 × 3000 px, saída JPEG 1600 × 1200 px abaixo de 4 MB; arquivo inválido rejeitado.

Os dez testes do provider verificam o contrato HTTP multimodal e Zod com respostas controladas: sucesso, demo sem rede, HTTP 429/500, JSON inválido/incompleto, confiança/peso inválidos, timeout e configuração ausente. Não substituem uma chamada OpenAI real. Apenas `OPENAI_API_KEY` falta para ativar `AI_MODE=live`.

Capturas mobile, mapa, telas desktop e relatório ESG ficam em `artifacts/`, `test-results/` e `playwright-report/`, ignorados pelo Git. Traces podem conter sessões e URLs assinadas; mantenha-os locais. O deploy HTTPS foi realizado e homologado no navegador; o teste físico em três celulares ainda não foi realizado.

Nove telas autenticadas desktop foram verificadas em 1440 px, sem overflow ou erros JavaScript. As capturas finais do mapa com ruas e rota e do gráfico semanal com 17 kg foram inspecionadas. O PDF ESG foi exportado para `artifacts/visual/ongsave-esg.pdf`.

Após a homologação, a demo foi resetada. Auditoria final via MCP confirmou 16 entregas históricas, quatro doações disponíveis, três missões iniciais, nenhum lote de teste, nenhuma foto da conta oficial e nenhum slot de diagnóstico remanescente. O servidor de produção permanece ativo na porta 3000.
