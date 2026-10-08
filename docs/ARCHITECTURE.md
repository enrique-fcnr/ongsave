# Arquitetura do ONGSave

Next.js 16 App Router, React e TypeScript strict, num único **Cloudflare Worker** gerado pelo `@opennextjs/cloudflare`. Não há backend separado: páginas, Route Handlers e o Durable Object de tempo real rodam no mesmo Worker, com bindings para D1 (banco), R2 (fotos), Durable Objects (tempo real) e Workers AI (análise opcional).

```text
navegador ──HTTPS──▶ worker.ts ─┬─▶ handler OpenNext (Next.js: páginas + /api/*)
                                │        ├─ DB        → D1 ongsave-db (Drizzle)
                                │        ├─ PHOTOS    → R2 ongsave-photos (privado)
                                │        ├─ AI        → Workers AI (opcional)
                                │        └─ REALTIME  → notify() após cada escrita
          ◀──WebSocket──────────┴─▶ /api/realtime → RealtimeHub (Durable Object)
```

As páginas operacionais são Server Components dinâmicos. Componentes client cuidam de câmera, formulários, ações, mapa e conexão ao vivo. `requireProfile()` lê a sessão do Better Auth, carrega perfil, organização e o `actor` (papel, organizações, motorista) com cache por request.

## Camadas no servidor

| Pasta                       | Papel                                                                                                             |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `src/server/db/`            | `schema.ts` (Drizzle), `client.ts` (`getDb`, `runAtomic`, guardas), `time.ts` (relógio de São Paulo), `impact.ts` |
| `src/server/auth/`          | Better Auth sobre D1: e-mail e senha, sem autocadastro                                                            |
| `src/server/permissions.ts` | Antigas policies RLS e funções `private.*` como checagens explícitas                                              |
| `src/server/queries.ts`     | Todas as leituras, sempre filtradas pelas permissões                                                              |
| `src/server/services/`      | Uma função por regra de negócio (antigas RPCs plpgsql)                                                            |
| `src/server/storage.ts`     | Upload, leitura autorizada e limpeza de fotos no R2                                                               |
| `src/server/realtime/`      | `RealtimeHub`, canais por papel e `notify()`                                                                      |
| `worker.ts`                 | Entrada do Worker: handler do Next + upgrade de `/api/realtime` + export do DO                                    |

## Fluxo e persistência

1. `/api/upload` autentica o supermercado, verifica o tipo pelos bytes (JPEG/PNG/WebP), limita a 4 MB e grava em `PHOTOS` com chave `<id do usuário>/<uuid>.<ext>`. Registra uma análise manual provisória em `analyses`.
2. `/api/analyze` lê só a foto do próprio usuário no R2. `analyzeSurplus` usa a fixture demo, a OpenAI ou o Workers AI, valida com Zod e grava provider e modelo **do servidor** (`recordAnalysis`).
3. `/api/batches` valida a revisão e chama `publishSurplus`: exige a análise não publicada do usuário, confirmação humana e organização de supermercado. Lote, itens, `estimated_impact_json` (`impactForWeight`), análise publicada e notificações às ONGs vão num único batch.
4. `reserveDonation` confere disponibilidade, categoria aceita, capacidade diária acumulada (dia de São Paulo) e horário de recebimento; cria reserva, resgate, token de entrega, eventos e notificações.
5. `acceptMission` confere disponibilidade e capacidade do veículo e que o motorista não tenha missão ativa; atribui o motorista.
6. `advanceRescue` aceita só o motorista do resgate e as seis transições permitidas. `deliveryToken` mostra o código só à ONG do resgate, quando o motorista chega. O código certo conclui a entrega e registra o impacto uma única vez.
7. Depois de cada escrita, `notify()` avisa o `RealtimeHub`; os navegadores conectados fazem `router.refresh()`. Um refresh a cada 15 s, no foco e na volta da rede cobre falhas. Nada operacional fica em `localStorage`.

## Concorrência sem `FOR UPDATE`

O D1 não tem transação interativa. Cada service lê e valida (para dar a mensagem certa) e depois executa **um único `batch()`**, que é atômico. O batch começa com guardas: `INSERT INTO batch_guards SELECT '<regra>' WHERE NOT (<condição>)`. A tabela `batch_guards` tem um `CHECK` nomeado por regra e fica sempre vazia; se a condição deixou de valer entre a leitura e a escrita, o `CHECK` aborta o batch inteiro e `runAtomic` devolve qual regra falhou. Assim a dupla reserva, dois motoristas na mesma missão, a capacidade diária e "uma missão ativa por motorista" são decididos dentro da transação. Os testes provam isso segurando as duas chamadas numa barreira até ambas terem validado o mesmo estado.

## Modelo

`profiles`, `organizations`, `organization_members`, `ngo_preferences`, `drivers`, `surplus_batches`, `surplus_items`, `donation_reservations`, `rescues`, `rescue_events`, `impact_metrics`, `notifications`, `analyses`, `rescue_tokens`, `batch_guards` e as tabelas do Better Auth (`user`, `session`, `account`, `verification`). Migrations em `drizzle/migrations/`, geradas por `npm run db:generate`.

- IDs são UUID em texto; datas do ONGSave são ISO-8601 UTC; listas e JSON são texto JSON; enums viram `CHECK`.
- `rescue_tokens` guarda o código de 4 dígitos (gerado com `crypto.getRandomValues`), tentativas e bloqueio. Nenhuma query de leitura toca essa tabela, então o código nunca viaja junto do resgate. Cinco erros bloqueiam por um minuto; erros não geram impacto.
- `surplus_batches.is_seed`, `is_demo`, `seed_kind` limitam o reset ao ambiente demonstrativo.
- A especificação original em PostgreSQL está em `docs/legacy-supabase/` como referência.

## Permissões

Sem RLS no banco: cada leitura passa por `readableRescues`/`readableBatches` ou pelo filtro de dono equivalente à policy original. O diretório de organizações é visível a qualquer usuário autenticado; perfis pessoais só ao próprio dono. As únicas escritas diretas são nome e telefone do próprio perfil, preferências da própria ONG, disponibilidade do próprio motorista e `read_at` das próprias notificações (`PATCH /api/profile`, `POST /api/notifications/read`). Papel, organização, motorista atribuído, status e impacto só mudam pelos services. As APIs recusam origem externa.

## Tempo real

`RealtimeHub` é um Durable Object com WebSocket Hibernation. O navegador abre `/api/realtime`; o `worker.ts` pergunta à própria app (sem rede) quais canais a sessão pode ouvir e só então conecta ao DO. Canais: `profile:<id>`, `org:<id>`, `ngos`, `drivers`, `driver:<id>`. A mensagem é só `{ "type": "changed", "scope": ... }`, sem dados; o refresh busca tudo de novo pelo servidor, que aplica as permissões.

## Simulações identificadas

- Matching: regras de categoria, bairro, capacidade, janela de recebimento e necessidades.
- Mapa: MapLibre real com tiles OpenFreeMap; posição, rota, distância e ETA simulados e persistidos. Os workers do MapLibre são copiados para `public/maplibre/` antes de cada build.
- Histórico: 16 entregas seed, quatro lotes disponíveis e três missões iniciais.
- Impacto ambiental e economia: fatores ilustrativos por kg.
- `AI_MODE=demo`: fixture identificada como `demo`, com upload real.

## PWA e deploy

Manifest standalone, ícones any/maskable, metadados Apple e service worker que só guarda ícones e a página offline. Páginas autenticadas e APIs não são cacheadas. Deploy com `npm run cf:deploy` na conta Cloudflare fixada no `wrangler.jsonc`; `NEXT_PUBLIC_*` entram no build, então recompile ao alterá-las.

Fotos de até 20 MB são reduzidas no navegador a JPEG com lado máximo de 1600 px; o servidor aceita até 4 MB e verifica o conteúdo de novo.
