# ONGSave

Uma fotografia inicia um resgate completo. MVP web mobile-first/PWA que conecta supermercados, ONGs e motoristas em uma aplicação Next.js, com Auth, PostgreSQL, Storage e Realtime do Supabase.

## Instalação

Requer Node.js 22.14+ e npm. Na pasta `C:\Users\enriq\ongsave`:

```powershell
npm install
Copy-Item .env.example .env.local
```

Uma cópia local de `.env.local` já pode existir; preencha-a sem sobrescrever suas credenciais. O arquivo é ignorado pelo Git.

Neste computador o projeto Ongsave `xhsbrwksbmxdzhujpyeb` já foi conectado via MCP OAuth e configurado. Migration, seed, usuários Auth, Storage e Realtime estão prontos, e `.env.local` contém as credenciais Supabase. Para usar o ambiente atual, execute `npm run dev`; não sobrescreva o arquivo nem reaplique a migration.

## Variáveis

| Variável                               | Uso                                                                                |
| -------------------------------------- | ---------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL`                  | URL do app; localhost no desenvolvimento, HTTPS no deploy                          |
| `NEXT_PUBLIC_SUPABASE_URL`             | Project URL                                                                        |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`        | Anon key legada; ou use a publishable key abaixo                                   |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Alternativa moderna; tem precedência sobre ANON_KEY                                |
| `SUPABASE_SERVICE_ROLE_KEY`            | Somente servidor/scripts; bootstrap, proveniência da IA e reset                    |
| `AI_MODE`                              | `demo` para fixture identificada; `live` para análise real                         |
| `AI_PROVIDER`                          | `openai`                                                                           |
| `OPENAI_API_KEY`                       | Necessária somente em live                                                         |
| `AI_MODEL`                             | Modelo multimodal; exemplo `gpt-4.1-mini`                                          |
| `NEXT_PUBLIC_MAP_PROVIDER`             | `maplibre`; é o provider implementado                                              |
| `NEXT_PUBLIC_MAP_TILE_URL`             | Override raster opcional; padrão vetorial OpenFreeMap com estilo ONGSave sem chave |
| `NEXT_PUBLIC_MAPBOX_TOKEN`             | Reservado, não utilizado pelo MVP                                                  |
| `ENABLE_DEMO_MODE`                     | `true` habilita `/demo` e reset; `false` fora da apresentação                      |
| `DATABASE_URL`                         | Opcional: conexão PostgreSQL para `npm run db:migrate`; dispensável com SQL Editor |

Não exponha Service Role ou OpenAI em variáveis `NEXT_PUBLIC_*`. Nenhum segredo foi adicionado ao código.

## Configurar Supabase

Use um projeto novo/dedicado à demo. Não é necessário Docker para Supabase hospedado.

1. Preencha URL, chave pública e Service Role em `.env.local`.
2. Aplique **uma vez**, em ordem de nome, os arquivos de `supabase/migrations/` no SQL Editor. Eles criam o schema e a função de relógio operacional. Alternativamente, preencha `DATABASE_URL` e execute `npm run db:migrate` — registra versões e aplica cada migration em transação. As duas migrations já foram aplicadas ao projeto Ongsave `xhsbrwksbmxdzhujpyeb` via MCP; não as reaplique nesse projeto.
3. Execute `npm run demo:users`. O script cria/confirma os 11 usuários Auth, vincula perfis e organizações e aplica todo o seed. É idempotente e define a senha demo `demo123`.
4. Em Database → Replication, confira as tabelas da publicação `supabase_realtime`: `surplus_batches`, `donation_reservations`, `rescues`, `rescue_events`, `impact_metrics`, `notifications`. A migration adiciona as tabelas se a publicação padrão existe. Caso não exista, habilite-a no projeto antes da apresentação.
5. Confira o bucket privado `surplus`, limite 4 MB e policies criados pela migration. Não o torne público.
6. Configure o Site URL do Auth para o endereço do app. Não exponha o schema `private` na Data API.

```powershell
npm run demo:users
npm run dev
```

Abra `http://localhost:3000`. O servidor de desenvolvimento escuta em `0.0.0.0` para acesso na rede local. Para instalação PWA nos celulares, use um deploy HTTPS.

`supabase/seed.sql` é uma alternativa SQL versionada, gerada da mesma definição em `scripts/seed-data.ts`. Organizações e preferências podem ser populadas antes do Auth; o histórico só é inserido quando existem os perfis demo. O bootstrap Node é a opção recomendada. `npm run seed` reaplica fixtures via Service Role. `npm run seed:sql` regenera o arquivo SQL.

## Contas oficiais

| Papel        | E-mail                 | Senha   | Perfil              |
| ------------ | ---------------------- | ------- | ------------------- |
| Supermercado | mercado@ongsave.demo   | demo123 | Mercado Paulista    |
| ONG          | ong@ongsave.demo       | demo123 | Instituto Esperança |
| Motorista    | motorista@ongsave.demo | demo123 | Lucas Almeida       |

Também são criadas contas para Aurora, Empório Central, Nova Vida, Casa São Lucas, Projeto Viver, Mãos Abertas, Mariana Costa e Rafael Santos. Todas são fixtures acadêmicas. Usuários operacionais adicionais devem ser provisionados pelo administrador em Auth + `profiles` + membership ou `drivers`; autoinscrição e atribuição de papel pelo próprio usuário não estão expostas.

## Fluxo disponível

Supermercado fotografa → upload privado → IA demo/live → revisão humana → publicação → ONG aceita → missão criada → motorista aceita → coleta → transporte → ONG consulta token → motorista valida → entrega → impacto/timeline/notificações atualizados.

As mutações críticas são funções transacionais do PostgreSQL. RLS e grants por coluna impedem alteração arbitrária de papel, status ou impacto. Reservas e missões usam locks; um lote não pode ser reservado duas vezes. O código de entrega é privado e não é enviado ao motorista junto com o rescue.

## IA

```env
AI_MODE=live
AI_PROVIDER=openai
OPENAI_API_KEY=sua-chave
AI_MODEL=gpt-4.1-mini
```

O provider real usa imagens na API OpenAI, JSON estrito e validação Zod. Troque o modelo por outro multimodal disponível à sua conta, se necessário. A revisão salva dados corrigidos e preserva o JSON original e a proveniência. Se a IA falha, o upload permanece e o usuário pode tentar novamente ou preencher manualmente.

```env
AI_MODE=demo
```

Nesse modo a fixture é explicitamente rotulada como demo. Upload, publicação e resgate continuam reais no Supabase. A análise não determina segurança alimentar.

## Demonstração e reset

Abra `/demo`, disponível somente com `ENABLE_DEMO_MODE=true`. Cada celular entra em uma das três contas oficiais. Para resetar pela tela, esteja autenticado como Mercado Paulista e confirme a ação.

```powershell
npm run demo:reset
```

O script exige o modo demo e a Service Role. O reset limpa o fluxo criado pela conta oficial, restaura quatro doações e três missões seed e preserva o histórico de 16 entregas/métricas. Consulte `docs/DEMONSTRATION.md` para o roteiro completo e limites. Use bootstrap/seed apenas no ambiente dedicado; eles regravam fixtures.

## Estrutura

```text
src/app/                 páginas públicas, rotas operacionais e APIs
src/components/          shell, formulários, métricas, timeline e ações
src/components/maps/     MapLibre, markers e rota simulada
src/components/ui/       componentes shadcn/ui
src/lib/ai/              provider, prompt, schema, demo e análise
src/lib/supabase/        clientes browser/server/admin
src/lib/domain.ts        estados, transições, labels, matching e impacto
supabase/migrations/     schema, RLS, RPCs, Storage e Realtime
supabase/seed.sql         seed SQL idempotente
scripts/                 bootstrap, seed, reset, migration e ícones
tests/                   domínio e integração SQL/RLS com PostgreSQL PGlite
e2e/                     responsividade pública e cenário real de três sessões
docs/                    arquitetura, demonstração e resultado do QA
public/                  service worker, fallback offline e ícones PWA
```

## Comandos e validação

```powershell
npm run lint
npm run typecheck
npm run test
npm run build
npm run start
```

Vitest verifica estados, token, impacto, matching, schemas e **executa a migration, seed e fluxo completo em PostgreSQL embarcado PGlite**. Também testa isolamento RLS, proteção de papel, dupla reserva, motorista concorrente, code errado, métrica única e reset. Auth e Storage são schemas substitutos nesse teste; ele não valida a infraestrutura remota do Supabase.

```powershell
npx playwright install chromium
npm run test:e2e
```

Os testes públicos validam 375, 390, 430, 768, 1280 e 1440 px, navegação/login, proteção de rotas, origem das APIs e assets PWA. O cenário completo foi aprovado no projeto Ongsave configurado:

```powershell
# Execute só em um banco dedicado à demonstração: o cenário reseta a demo.
$env:RUN_LIVE_E2E="true"
npm run test:e2e -- e2e/live-flow.spec.ts
```

Use `AI_MODE=demo`, `ENABLE_DEMO_MODE=true` e contas provisionadas antes desse teste. Ele abre três sessões isoladas, envia uma fotografia real, publica, verifica frames Realtime, mapa e rota, coleta, token errado/correto, entrega e indicadores. Depois reseta e repete com fallback manual, conferindo a exclusão da foto pela API do Storage. Para usar o Chrome instalado no Windows, defina `$env:PLAYWRIGHT_CHANNEL="chrome"`. Câmera física e instalação devem ser conferidas nos aparelhos reais. Resultados em `docs/QA.md`.

Os scripts `predev` e `prebuild` copiam o worker MapLibre e seu módulo compartilhado de `node_modules` para `public/maplibre/`. O mapa recebe esses arquivos pelo app, evitando a incompatibilidade do caminho automático do worker com o empacotamento Next.js. A pasta gerada é ignorada pelo Git e regenerada com a versão instalada.

## Deploy Vercel

Publicado em **https://ongsave.vercel.app**, na conta `enrique-fcnrs-projects`, conectado ao repositório `enrique-fcnr/ongsave` e à branch de produção `main`. Login: https://ongsave.vercel.app/login. Demonstração: https://ongsave.vercel.app/demo. As três contas oficiais acima usam a senha `demo123`.

As variáveis de produção e preview foram configuradas na Vercel, com a chave administrativa Supabase restrita ao servidor. O Site URL do Supabase Auth aponta para o domínio publicado; redirecionamentos de desenvolvimento também foram preservados. O deploy mantém `AI_MODE=demo` e `ENABLE_DEMO_MODE=true`. Dez testes de navegador foram aprovados no endereço HTTPS, incluindo duas entregas completas com as três contas e reset entre elas.

Conecte este projeto, configure as mesmas variáveis e execute build padrão Next.js. Adicione a URL HTTPS no Supabase Auth. Chaves `NEXT_PUBLIC_*` exigem um novo build quando alteradas. `/api/analyze` tem timeout do provider de 45 segundos e duração máxima configurada de 60 segundos, sujeita aos limites do plano de hospedagem.

Para demonstração: `ENABLE_DEMO_MODE=true`, `AI_MODE=demo`. Fora da apresentação: desative demo, remova/controle as contas acadêmicas e use contas reais provisionadas pelo administrador.

## Limites conhecidos

- Auth, upload, RLS, Realtime e entregas foram homologados no Supabase remoto pelo Chrome. A chamada OpenAI live depende de `OPENAI_API_KEY`; câmera e instalação PWA ainda precisam de homologação nos aparelhos físicos.
- GPS, roteamento, distância, ETA, matching avançado e histórico são simulados e identificados. O mapa é interativo e depende de Internet/WebGL. A base vetorial OpenFreeMap usa dados OpenStreetMap e estilo Positron adaptado à paleta ONGSave, hospedado em `public/maps/`, com licenças e atribuição preservadas. O override raster opcional permanece disponível em `NEXT_PUBLIC_MAP_TILE_URL`.
- Não há push, tracking GPS real, autoinscrição, painel administrativo completo ou motor de previsão.
- Impacto ambiental/economia são projeções ilustrativas. O histórico demo participa dos indicadores e é informado na tela.
- Relatório PDF utiliza impressão do navegador. Não há geração certificada de relatório ESG.
- PWA opera online; offline exibe uma tela de reconexão e não permite transações.
- O reset pagina a lista de imagens e remove os arquivos da pasta oficial em lotes. URLs assinadas já usadas podem continuar atendidas pelo cache da CDN até sua invalidação.
- Fotos decodificáveis de até 20 MB são reduzidas no celular a JPEG com no máximo 1600 px e 4 MB no upload. HEIC depende de conversão/suporte do navegador; prefira JPEG.
- UI e banco limitam as consultas atuais a 200 rescues; paginação e índices adicionais são próximos passos para escala.

Próximos passos opcionais: homologação em celulares reais, rate limit distribuído para chamadas IA, expiração/cancelamento automático de lotes, fluxo administrativo de onboarding, paginação, monitoramento e fatores ambientais baseados em metodologia validada.

## Referências de integração

[Next.js Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers), [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [Supabase Realtime](https://supabase.com/docs/guides/realtime/postgres-changes) e [OpenAI Vision](https://developers.openai.com/api/docs/guides/images-vision).
