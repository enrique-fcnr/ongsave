# Relatório 12 · Regras de negócio e permissões sobre D1

## Resultado
Nenhuma tela ou rota importa mais `src/lib/supabase/` (os arquivos ficam até a limpeza da etapa 16). Leituras passam por `src/server/queries.ts` + `src/server/permissions.ts` (feito na etapa 11). Escritas passam por `src/server/services/*.ts`, com as mesmas mensagens dos `raise exception`.

## Função original → arquivo novo → teste que cobre
| Original (plpgsql / política) | Novo | Testes (`tests/d1/`) |
|---|---|---|
| `private.actor_id`, `actor_role`, `member` | `permissions.ts`: `loadActor`, `member` | auth, flow (todos) |
| `private.can_read_rescue` / `read_rescues`, `read_events`, `read_impact` | `canReadRescue`, `readableRescues` | flow: "segunda ONG não lê", "concorrente perde acesso" |
| `private.can_read_batch` / `read_batches`, `read_items` | `canReadBatch`, `readableBatches` | flow: isolamento; photos: leitura 403/200 |
| `directory`, `own_members`, `own_preferences`, `own_driver`, `own_notifications` | `queries.ts` | auth, flow |
| `public.operational_time` | `db/time.ts` `operationalTime` | schema: relógio SP |
| `private.record_analysis` | `services/analysis.ts` `recordAnalysis` | flow: perfil não autorizado, imagem de outro usuário; photos |
| `private.publish_surplus` | `services/rescue.ts` `publishSurplus` | flow: publicação, "já publicada", publicação dupla simultânea |
| `private.estimate_batch_impact` (trigger) | `impactForWeight` no insert do lote | schema + flow (76 refeições) |
| `private.reserve_donation` | `reserveDonation` | flow: reserva, ONG pausada, categoria, horário, capacidade diária, reserva dupla (com e sem barreira) |
| `private.init_rescue_token` (trigger) | insert em `rescue_tokens` no mesmo batch | flow: token criado |
| `private.accept_mission` | `acceptMission` | flow: concorrente, dois motoristas (com barreira), veículo, indisponível, missão ativa |
| `private.advance_rescue` | `advanceRescue` | flow: etapas, pulo de etapa, token errado/certo, impacto único, bloqueio após 5 erros, avanço duplo simultâneo |
| `private.delivery_token` | `deliveryToken` | flow: motorista, outra ONG e ONG antes da chegada recusados |
| `private.reset_demo` | `services/demo.ts` `resetDemo` | flow: reset restrito, 16 métricas, 3 missões, 4 doações |
| grants `update(phone,name)`, `update(...)` em `ngo_preferences`, `update(availability)` | `services/profile.ts` (etapa 11) | flow: papel não muda; preferências e disponibilidade usadas nos cenários |
| grant `update(read_at)` / `read_notification` | `markNotificationRead` | flow: só o dono marca |
| `seed.sql` idempotente | `scripts/seed-d1.ts` | flow: seed duas vezes = 16 métricas |

## Concorrência
Padrão de todos os services que usavam `FOR UPDATE`: ler e validar (para a mensagem amigável) e depois **um único `batch()`** que começa com as guardas `batch_guards` (relatório 10), refazendo as mesmas condições dentro da transação, seguido das escritas. Nada é gravado fora de um batch guardado.
- **Capacidade diária** e **motorista sem missão ativa** ficaram em SQL puro dentro da guarda (`SUM` do dia em São Paulo + peso ≤ capacidade; `NOT EXISTS` de missão ativa). Não foi preciso Durable Object como trava.
- Reserva dupla também é barrada pelo `UNIQUE(batch_id)`.
- **Prova:** além de `Promise.all`, os testes "Guardas do batch com leituras simultâneas garantidas" seguram os dois `batch()` numa barreira até as duas chamadas terem lido e validado o mesmo estado. Só a guarda pode barrar a segunda, e barra: reserva dupla, dois motoristas, capacidade diária, motorista com duas missões. Rodei a suíte 3 vezes seguidas sem falha.
- Token: 4 dígitos com `crypto.getRandomValues`, só em `rescue_tokens`, nunca no select do resgate (testado). Erro incrementa tentativas e a cada 5 bloqueia 1 minuto; não gera impacto. Acerto: status, `delivered_at`, lote `DELIVERED`, reserva `COMPLETED`, `impact_metrics` (`ON CONFLICT DO NOTHING`), evento e notificações num batch.

## Telas e rotas
- Novas rotas: `POST /api/batches/[id]/reserve`, `/api/rescues/[id]/accept`, `/api/rescues/[id]/advance`, `/api/rescues/[id]/token` (POST, para passar pelo mesmo checador de origem), `/api/notifications/read`. `/api/batches` e `/api/demo/reset` usam os services; o reset também limpa a pasta da conta oficial no R2.
- `rescue-actions.tsx` e `shell.tsx` chamam essas rotas via `src/lib/api-client.ts`. Mesmos textos, mesmos fluxos.

## Testes
- `tests/d1/flow.test.ts`: 23 testes (os 9 cenários de `tests/database.test.ts` portados + concorrência, capacidades, horário, bloqueio, notificações).
- E2E temporário no `cf:preview` com 3 sessões: reset pelo `/demo`, foto real, análise demo, publicação, foto e notificação na ONG, aceite, missão, 5 etapas, código errado, código certo, "Missão concluída" e 9 eventos na linha do tempo nas três contas. **Passou em 9 s.** (Vira o `live-flow.spec.ts` na etapa 16.)
- Portão: lint, typecheck, test (80), build, cf:build verdes.

## Observação
O `e2e/live-flow.spec.ts` antigo procura o botão "Close" do diálogo de notificações; o rótulo atual é "Fechar" (mudou num commit de design anterior à migração). Ajusto quando adaptar esse teste na etapa 16.
