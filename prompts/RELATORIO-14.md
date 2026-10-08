# Relatório 14 · Tempo real com Durable Object

## O que mudou
- **`RealtimeHub`** (`src/server/realtime/hub.ts`): Durable Object com backend SQLite e **WebSocket Hibernation** (`ctx.acceptWebSocket`). Cada socket recebe como *tags* os canais definidos pelo servidor e guarda os mesmos canais com `serializeAttachment`. `setWebSocketAutoResponse("ping" → "pong")` responde ao heartbeat sem acordar o objeto; `webSocketMessage` e `webSocketClose` tratam o resto. `POST /notify` envia `{ "type": "changed", "scope": "<canal>" }` aos sockets dos canais (o canal `*` alcança todos; usado só no reset da demo). Um hub único (`idFromName("global")`) basta para o volume da demo.
- **Canais** (`src/server/realtime/channels.ts`): `profile:<id>` para todos; `org:<id>` por organização; `ngos` para ONGs; `drivers` e `driver:<id>` para motoristas. Calculados no servidor a partir da sessão.
- **`worker.ts`** (novo `main` do `wrangler.jsonc`): reexporta o handler do `.open-next/worker.js`, exporta `RealtimeHub` e trata o upgrade de `/api/realtime`. Bindings `durable_objects` (`REALTIME`) e `migrations` com `new_sqlite_classes: ["RealtimeHub"]`.
  - **Decisão:** o upgrade fica no `worker.ts`, não num Route Handler, porque uma resposta 101 com `webSocket` não atravessa o handler do Next no OpenNext de forma suportada. A autenticação **continua no Next**: o worker chama internamente (mesmo isolate, sem rede) `GET /api/realtime`, que lê a sessão do Better Auth e devolve os canais permitidos (401 sem sessão). Só então conecta ao DO, passando os canais num cabeçalho que o navegador não controla. Origem cruzada é recusada. Assim o Better Auth não é empacotado duas vezes.
- **Publicação** (`src/server/realtime/notify.ts`): `notify(channels)` roda em `ctx.waitUntil` depois do batch bem-sucedido, sem atrasar a resposta. Falha só gera log; a operação não falha e o refresh de 15 s cobre. Chamado em: publicar (`org` do mercado + `ngos`), reservar (orgs do resgate + `ngos` + `drivers`), aceitar missão (orgs + motorista + `drivers`), avançar etapa e entregar (orgs + motorista), perfil/preferências/disponibilidade (canais da própria conta), notificação lida (`profile`), reset (`*`). Ler o código de entrega não muda estado e não avisa.
- **Cliente** (`src/components/realtime.tsx`): `WebSocket` para `/api/realtime` (`ws`/`wss` conforme a página), reconexão com backoff exponencial e jitter (1 s → 30 s), ping a cada 25 s, refresh ao conectar (recupera o que perdeu desconectado). Mantidos o refresh de 15 s, o foco, o `online` e o selo "Atualizações ao vivo" / "Sincronizando".

## Testes
- `tests/realtime-channels.test.ts` (5): canais por papel; nenhum papel recebe canal de outra organização ou `*`; aviso de resgate vai às duas organizações e ao motorista.
- `e2e/realtime.spec.ts` (no `cf:preview`): mercado publica, a lista da ONG aberta mostra o lote **sem recarregar em 299 ms** (critério: < 2 s). Os quadros recebidos só contêm `{"type":"changed"...}`, nunca o título. WebSocket sem sessão é recusado. Passou.
- Portão: lint, typecheck, test (85), build, cf:build verdes.

## Observações
- O `opennextjs-cloudflare preview` imprime avisos de que `RealtimeHub` "não está exportado". Vêm do proxy auxiliar de bindings que o adapter sobe ao lado; o Worker principal exporta a classe, tanto que o teste ao vivo passa.
- No `next dev` não há Durable Object: o selo fica em "Sincronizando" e vale o refresh de 15 s. Para testar o tempo real localmente, use `npm run cf:preview`.
- Na publicação, a migration `v1` cria a classe do DO junto com o deploy.
