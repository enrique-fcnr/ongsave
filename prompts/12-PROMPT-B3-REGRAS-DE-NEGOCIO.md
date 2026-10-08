# 12 · Prompt B3 · Regras de negócio e permissões (RPCs + RLS → TypeScript sobre D1)

Este é o prompt mais sensível. Leia **inteiras** as duas migrations em `supabase/migrations/`; elas são a especificação. Leia também `docs/ARCHITECTURE.md`, `src/lib/domain.ts`, `src/lib/data.ts`, todas as rotas em `src/app/api/`, `src/components/rescue-actions.tsx`, `src/components/batch-detail.tsx`, `src/components/profile-form.tsx` e `tests/database.test.ts`.

## Objetivo

Toda leitura e escrita que hoje passa por `client.from(...)`, `client.rpc(...)` e pelas policies RLS passa a usar o D1, via um módulo de serviço no servidor, com **as mesmas regras**. Ao fim, `src/lib/supabase/` não é mais importado por nenhuma tela ou rota, exceto storage e realtime, que saem nos prompts 13 e 14.

## Estrutura

- `src/server/permissions.ts`: equivalentes de `actor_id`, `actor_role`, `member(org)`, `can_read_rescue`, `can_read_batch`, e uma função por policy de leitura. Toda query de leitura passa por elas. **Nada de RLS implícito: se a função não filtra, o dado vaza.**
- `src/server/services/*.ts`: uma função por RPC, com nome igual ao original:
  - `publishSurplus`
  - `reserveDonation`
  - `acceptMission`
  - `advanceRescue`
  - `deliveryToken`
  - `recordAnalysis`
  - `resetDemo` (só com `ENABLE_DEMO_MODE=true` e usuário mercado oficial)
  - `operationalTime`
- `src/server/queries.ts`: substitui os selects de `src/lib/data.ts` e das páginas, incluindo os joins `rescues + surplus_batches + impact_metrics` e `surplus_batches + surplus_items`, com o mesmo limite de 200.

## Regras de concorrência (D1 não tem `FOR UPDATE` nem transação interativa)

Para cada função original que usa lock, aplique o padrão:

1. Leia o necessário e valide permissão e regras (horário de recebimento em São Paulo, categorias aceitas, capacidade diária acumulada, capacidade do veículo, motorista sem missão ativa, transição permitida em `domain.ts`).
2. Faça **um único `db.batch()`** cujo primeiro statement é um update condicional que só acontece se o estado ainda for o lido. Exemplo: `UPDATE surplus_batches SET status='RESERVED' WHERE id=? AND status='AVAILABLE' AND expires_at > ?`. Os demais statements (reserva, rescue, token, eventos, notificações) dependem dele via `INSERT ... SELECT ... WHERE changes()=1`, ou outro mecanismo atômico equivalente em SQLite. Confira na doc do D1 se `changes()` funciona dentro de `batch`.
3. Se o update condicional não afetou linha, retorne o mesmo erro amigável que a função original retornava (procure as mensagens `raise exception` na migration e reaproveite os textos).
4. **Não há caminho "lê, decide, escreve" fora de um batch condicionado.** Teste com duas chamadas simultâneas (`Promise.all`): só uma pode vencer.

Casos específicos:

- **Capacidade diária da ONG** (soma de kg do dia) e **"motorista já tem missão ativa":** a checagem e a escrita precisam ficar no mesmo batch condicional (ex.: `INSERT ... SELECT ... WHERE (SELECT SUM(...)) + ? <= capacidade`). Se não for possível em SQL puro, use um Durable Object por ONG/motorista como lock, e explique no relatório.
- **Token de entrega:** 4 dígitos com zeros à esquerda, gerado com `crypto.getRandomValues`, guardado só em `rescue_tokens`. Nunca vai junto do rescue para o motorista; só a ONG do rescue lê, e só em `AT_DESTINATION`. Após 5 erros, bloqueia por 1 minuto. Erro não gera impacto. Acerto: `DELIVERED`, `impact_metrics` com `impactForWeight` e eventos e notificações, tudo num batch.
- **Escritas diretas permitidas** (iguais aos grants):
  - nome e telefone do próprio perfil;
  - campos de `ngo_preferences` da própria ONG;
  - `availability` do próprio motorista;
  - `read_at` das próprias notificações.

  Nada mais.

- **`record_analysis`:** grava `analyses` com o provider e o model **do servidor**, nunca do cliente.

## Trocas nas telas e rotas

Substitua cada uso de `client.from/rpc` pelos services e queries. Mantenha tipos (`domain.ts`) e respostas JSON das APIs iguais, para não mexer nos componentes.

## Testes (obrigatório; o critério de aceite do projeto depende disso)

Porte os cenários de `tests/database.test.ts` para `tests/d1/`:

- fluxo completo (publicar → reservar → aceitar → avançar etapas → token errado → token certo → impacto único);
- isolamento: mercado A não vê lote do B; motorista não lê token; ONG não altera status;
- dupla reserva simultânea: 1 vence;
- dois motoristas simultâneos na mesma missão: 1 vence;
- capacidade diária e de veículo;
- bloqueio após 5 tokens errados;
- métrica criada uma vez só;
- reset da demo.

Relatório `prompts/RELATORIO-12.md` com a tabela "função original → arquivo novo → teste que cobre".

Ao terminar: **"Prompt 12 concluído."**
