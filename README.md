# ONGSave

Uma fotografia inicia um resgate completo. MVP web mobile-first/PWA que conecta supermercados, ONGs e motoristas. Next.js 16 rodando 100% na Cloudflare: Workers (via OpenNext), banco D1, login com Better Auth, fotos no R2, tempo real com Durable Object e análise opcional com Workers AI ou OpenAI.

## Instalação

Requer Node.js 22.14+, npm e a CLI `wrangler` logada na conta do projeto (`npx wrangler login`; confira com `npx wrangler whoami`).

```bash
npm install
cp .dev.vars.example .dev.vars        # preencha BETTER_AUTH_SECRET (openssl rand -base64 32)
npm run db:migrate:local              # cria o D1 local em .wrangler/
npm run demo:users -- --local         # 11 contas demo + organizações + seed
npm run cf:preview                    # build + Worker local em http://localhost:8787
```

O `npm run dev` (http://localhost:3000) também funciona com os bindings locais, mas sem o Durable Object: o selo fica em "Sincronizando" e as telas se atualizam pelo refresh de 15 s. Para o tempo real e para o comportamento de produção, use o `cf:preview`. Para instalar o PWA nos celulares, use o endereço HTTPS publicado.

## Variáveis

Não secretas, em `vars` no `wrangler.jsonc`; segredos com `npx wrangler secret put <NOME>`; localmente tudo pode ser sobrescrito em `.dev.vars` (ignorado pelo Git).

| Variável                      | Onde                               | Uso                                                                     |
| ----------------------------- | ---------------------------------- | ----------------------------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL`         | `.env.production` (entra no build) | URL pública do app                                                      |
| `BETTER_AUTH_URL`             | `vars`                             | Igual à URL pública; `http://localhost:8787` no `.dev.vars`             |
| `BETTER_AUTH_SECRET`          | segredo                            | Assina as sessões. Obrigatório                                          |
| `BETTER_AUTH_TRUSTED_ORIGINS` | `.dev.vars`                        | Origens extras aceitas localmente (127.0.0.1, porta 3000)               |
| `AUTH_SIGNIN_RATE_LIMIT`      | `.dev.vars`                        | Só para a suíte e2e local; produção usa 10 logins/min por IP            |
| `AI_MODE`                     | `vars`                             | `demo` para fixture identificada; `live` para análise real              |
| `AI_PROVIDER`                 | `vars`                             | `openai` ou `workers-ai` (sem chave, usa o binding `AI`)                |
| `OPENAI_API_KEY`              | segredo                            | Só com `AI_PROVIDER=openai`                                             |
| `AI_MODEL`                    | `vars`                             | Opcional: modelo OpenAI (ex. `gpt-4.1-mini`) ou `@cf/...` do Workers AI |
| `NEXT_PUBLIC_MAP_PROVIDER`    | `vars`                             | `maplibre`; é o provider implementado                                   |
| `NEXT_PUBLIC_MAP_TILE_URL`    | build                              | Override raster opcional; padrão vetorial OpenFreeMap sem chave         |
| `ENABLE_DEMO_MODE`            | `vars`                             | `true` habilita `/demo` e reset; `false` fora da apresentação           |

Bindings (no `wrangler.jsonc`): `DB` (D1 `ongsave-db`), `PHOTOS` (R2 `ongsave-photos`, privado), `REALTIME` (Durable Object `RealtimeHub`), `AI` (Workers AI), `ASSETS`. Depois de mudar bindings, rode `npm run cf-typegen`.

## Banco (D1)

O schema está em `src/server/db/schema.ts` (Drizzle). As migrations SQL ficam em `drizzle/migrations/`.

```bash
npm run db:generate          # gera nova migration após mudar o schema
npm run db:migrate:local     # aplica no D1 local
npm run db:migrate:remote    # aplica no D1 de produção
npm run demo:users -- --remote   # contas demo + seed na produção (idempotente)
npm run seed:d1 -- --local       # só o seed operacional (exige as contas)
```

`scripts/seed-data.ts` é a fonte da demo: 8 organizações, 3 motoristas, 4 doações disponíveis, 3 missões e 16 entregas históricas com métricas, com `is_seed`, `is_demo` e `seed_kind` preservados. Os scripts geram SQL e aplicam com `wrangler d1 execute`; as senhas usam o hash do próprio Better Auth. As regras de negócio que eram funções PostgreSQL estão em `src/server/services/`, e a especificação original fica em `docs/legacy-supabase/`.

## Contas oficiais

| Papel        | E-mail                 | Senha   | Perfil              |
| ------------ | ---------------------- | ------- | ------------------- |
| Supermercado | mercado@ongsave.demo   | demo123 | Mercado Paulista    |
| ONG          | ong@ongsave.demo       | demo123 | Instituto Esperança |
| Motorista    | motorista@ongsave.demo | demo123 | Lucas Almeida       |

Também são criadas contas para Aurora, Empório Central, Nova Vida, Casa São Lucas, Projeto Viver, Mãos Abertas, Mariana Costa e Rafael Santos. Todas são fixtures acadêmicas. Usuários operacionais adicionais devem ser provisionados pelo administrador em Auth + `profiles` + membership ou `drivers`; autoinscrição e atribuição de papel pelo próprio usuário não estão expostas.

## Fluxo disponível

Supermercado fotografa → upload privado → IA demo/live → revisão humana → publicação → ONG aceita → missão criada → motorista aceita → coleta → transporte → ONG consulta token → motorista valida → entrega → impacto/timeline/notificações atualizados.

As mutações críticas são services no servidor que gravam num único batch atômico do D1, com guardas que reconferem as regras dentro da transação: um lote não pode ser reservado duas vezes, uma missão não tem dois motoristas, a capacidade diária e a do veículo valem mesmo com chamadas simultâneas. Papel, status e impacto não podem ser alterados pelo navegador. O código de entrega é privado e não é enviado ao motorista junto com o resgate.

## IA

```env
AI_MODE=live
AI_PROVIDER=openai
OPENAI_API_KEY=sua-chave
AI_MODEL=gpt-4.1-mini
```

O provider real usa imagens na API OpenAI, JSON estrito e validação Zod. Troque o modelo por outro multimodal disponível à sua conta, se necessário. A revisão salva dados corrigidos e preserva o JSON original e a proveniência. Se a IA falha, o upload permanece e o usuário pode tentar novamente ou preencher manualmente.

Sem chave nenhuma, a análise real também pode usar o **Workers AI** da própria conta Cloudflare:

```env
AI_MODE=live
AI_PROVIDER=workers-ai
# Opcional; padrão @cf/meta/llama-3.2-11b-vision-instruct
AI_MODEL=@cf/meta/llama-3.2-11b-vision-instruct
```

Use o binding `AI` do `wrangler.jsonc`. Na primeira chamada o app aceita sozinho a licença Meta exigida pelo modelo. A resposta passa pelo mesmo schema Zod; se vier fora do formato, o upload permanece e o usuário preenche manualmente. A qualidade é inferior à da OpenAI (veja `prompts/RELATORIO-15.md`).

```env
AI_MODE=demo
```

Nesse modo a fixture é explicitamente rotulada como demo. Upload, publicação e resgate continuam reais no banco. A análise não determina segurança alimentar.

## Demonstração e reset

Abra `/demo`, disponível somente com `ENABLE_DEMO_MODE=true`. Cada celular entra em uma das três contas oficiais. Para resetar pela tela, esteja autenticado como Mercado Paulista e confirme a ação.

```bash
npm run demo:reset                            # produção
npm run demo:reset -- http://localhost:8787   # cf:preview local
```

O script entra como Mercado Paulista e chama o mesmo reset do botão. O reset limpa o fluxo criado pela conta oficial e as fotos dela no R2, restaura quatro doações e três missões seed e preserva o histórico de 16 entregas e métricas. Consulte `docs/DEMONSTRATION.md` para o roteiro completo.

## Estrutura

```text
src/app/                 páginas públicas, rotas operacionais e APIs
src/components/          shell, formulários, métricas, timeline, ações e tempo real
src/components/maps/     MapLibre, markers e rota simulada
src/components/ui/       componentes shadcn/ui
src/lib/ai/              providers (OpenAI, Workers AI), prompt, schema, demo e análise
src/lib/domain.ts        estados, transições, labels, matching e impacto
src/server/db/           schema Drizzle, cliente D1, guardas atômicas, relógio e impacto
src/server/auth/         Better Auth
src/server/permissions.ts  antigas policies de leitura, como código
src/server/queries.ts    leituras filtradas por permissão
src/server/services/     regras de negócio (publicar, reservar, missão, entrega, reset, perfil)
src/server/realtime/     Durable Object RealtimeHub, canais e notify
worker.ts                entrada do Worker: handler do Next + WebSocket + Durable Object
drizzle/migrations/      SQL do D1
scripts/                 contas demo, seed, reset, ícones e MapLibre
tests/                   domínio, IA e tests/d1 (D1 real em memória via wrangler)
e2e/                     responsividade, login, tempo real e cenário de três sessões
docs/                    arquitetura, demonstração, QA e o schema PostgreSQL legado
prompts/                 plano e relatórios da migração para a Cloudflare
public/                  service worker, fallback offline e ícones PWA
```

## Comandos e validação

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run cf:build
```

O Vitest verifica estados, token, impacto, matching, schemas e os providers de IA. Os testes em `tests/d1/` sobem um D1 real em memória (`getPlatformProxy` do wrangler) e rodam o fluxo completo nos services: isolamento entre contas, proteção de papel, dupla reserva e dois motoristas simultâneos (inclusive com as duas chamadas forçadas a validar o mesmo estado), capacidades, horário, bloqueio após cinco códigos errados, métrica única, reset, login do Better Auth e fotos no R2.

```bash
npx playwright install chromium
npm run cf:preview                      # em outro terminal
E2E_BASE_URL=http://localhost:8787 npm run test:e2e
```

Sem `E2E_BASE_URL` o Playwright sobe o `next dev` e roda só os testes públicos. Os testes públicos validam 375 a 1440 px, navegação, login, proteção de rotas, origem das APIs e assets PWA. O cenário completo reseta a demo, então rode só num banco dedicado:

```bash
E2E_BASE_URL=http://localhost:8787 RUN_LIVE_E2E=true npm run test:e2e -- e2e/live-flow.spec.ts
```

Ele abre três sessões isoladas, envia uma fotografia real, publica, confere os avisos do WebSocket `/api/realtime`, mapa e rota, coleta, token errado e correto, entrega e indicadores. Depois reseta e repete com fallback manual, conferindo que a foto anterior saiu do R2. Para usar o Chrome instalado, defina `PLAYWRIGHT_CHANNEL=chrome`. Resultados em `docs/QA.md`.

Os scripts `predev`, `prebuild` e `cf:build` copiam o worker MapLibre e seu módulo compartilhado de `node_modules` para `public/maplibre/`, evitando a incompatibilidade do caminho automático do worker com o empacotamento. A pasta é ignorada pelo Git.

## Deploy (Cloudflare)

- **Conta:** somente `Eduardofonseca1401@gmail.com's Account` (`51f772f7656a812951d1ee9ce5c3f9c0`), fixada em `account_id` no `wrangler.jsonc`. As outras contas do mesmo login não recebem nada do ONGSave.
- **URL:** https://ongsave.eduardofonseca1401.workers.dev
- **Plano:** Workers Paid (US$ 5/mês). O Worker tem ~3,2 MiB gzip, acima do limite de 3 MiB do Free, e o SSR passa dos 10 ms de CPU do Free.

Primeira publicação (uma vez):

```bash
# Painel: R2 Object Storage → ativar na conta. Depois:
npx wrangler r2 bucket create ongsave-photos
npm run db:migrate:remote
npm run demo:users -- --remote
npm run cf:deploy
openssl rand -base64 32 | npx wrangler secret put BETTER_AUTH_SECRET
```

Publicações seguintes: `npm run cf:deploy` (e `npm run db:migrate:remote` quando houver migration nova). `NEXT_PUBLIC_*` entram no build: recompile ao alterá-las. `/api/analyze` tem timeout de 45 s no provider.

Para demonstração: `ENABLE_DEMO_MODE=true`, `AI_MODE=demo`. Fora da apresentação: desative o demo, controle as contas acadêmicas e use contas reais provisionadas pelo administrador.

A versão anterior (Vercel + Supabase, https://ongsave.vercel.app, conta `enrique-fcnrs-projects`, branch `main`) segue no ar até o corte final combinado com o Enrique.

## Limites conhecidos

- Login, upload, permissões, tempo real e entregas foram homologados no `cf:preview` pelo Chrome. A chamada OpenAI live depende de `OPENAI_API_KEY`; câmera e instalação PWA ainda precisam de homologação nos aparelhos físicos.
- GPS, roteamento, distância, ETA, matching avançado e histórico são simulados e identificados. O mapa é interativo e depende de Internet/WebGL. A base vetorial OpenFreeMap usa dados OpenStreetMap e estilo Positron adaptado à paleta ONGSave, hospedado em `public/maps/`, com licenças e atribuição preservadas. O override raster opcional permanece disponível em `NEXT_PUBLIC_MAP_TILE_URL`.
- Não há push, tracking GPS real, autoinscrição, painel administrativo completo ou motor de previsão.
- Impacto ambiental/economia são projeções ilustrativas. O histórico demo participa dos indicadores e é informado na tela.
- Relatório PDF utiliza impressão do navegador. Não há geração certificada de relatório ESG.
- PWA opera online; offline exibe uma tela de reconexão e não permite transações.
- O reset pagina a lista de imagens e remove os arquivos da pasta oficial do R2 em lotes. Fotos já abertas podem ficar no cache privado do navegador por até 1 hora.
- Fotos decodificáveis de até 20 MB são reduzidas no celular a JPEG com no máximo 1600 px e 4 MB no upload. HEIC depende de conversão/suporte do navegador; prefira JPEG.
- UI e banco limitam as consultas atuais a 200 rescues; paginação e índices adicionais são próximos passos para escala.

Próximos passos opcionais: homologação em celulares reais, rate limit distribuído para chamadas IA, expiração/cancelamento automático de lotes, fluxo administrativo de onboarding, paginação, monitoramento e fatores ambientais baseados em metodologia validada.

## Referências de integração

[OpenNext Cloudflare](https://opennext.js.org/cloudflare), [D1](https://developers.cloudflare.com/d1/), [Durable Objects WebSocket Hibernation](https://developers.cloudflare.com/durable-objects/best-practices/websockets/), [Better Auth](https://better-auth.com/docs), [Drizzle D1](https://orm.drizzle.team/docs/connect-cloudflare-d1), [Workers AI](https://developers.cloudflare.com/workers-ai/) e [OpenAI Vision](https://developers.openai.com/api/docs/guides/images-vision).
