# 14 · Prompt B5 · Tempo real com Durable Object

Leia antes: `prompts/00-...`, `src/components/realtime.tsx`, `docs/ARCHITECTURE.md` (seção Realtime), a lista de tabelas da publicação `supabase_realtime` nas migrations e os services do prompt 12.

## Como funciona hoje
O componente assina `postgres_changes` de 6 tabelas e, a cada evento, chama `router.refresh()`. Também faz refresh a cada 15 s, no foco da janela e quando a rede volta. Mostra o selo "Atualizações ao vivo" / "Sincronizando".

## Objetivo
Mesmo comportamento sem Supabase: um **Durable Object `RealtimeHub`** (backend SQLite, WebSocket Hibernation) recebe avisos do servidor e repassa aos navegadores conectados. O aviso não carrega dado sensível, só `{ type: "changed", scope }`. O navegador continua buscando os dados pelo servidor (`router.refresh()`), que aplica as permissões.

## Passos
1. **Classe `RealtimeHub`** em `src/server/realtime/hub.ts`, com `ctx.acceptWebSocket()`, `webSocketMessage` (ping/pong) e `webSocketClose`.
   - Canais por público: `org:<organizationId>`, `driver:<driverId>`, `drivers` (missões disponíveis), `ngos` (feed de doações) e `profile:<profileId>` (notificações).
   - Guarde o canal com `serializeAttachment`.
2. **Exportar o DO junto do Worker do OpenNext:** siga a doc oficial do `@opennextjs/cloudflare` para custom worker / exportar Durable Objects. O caminho usual é um `worker.ts` que reexporta o handler de `.open-next/worker.js` e exporta a classe. Atualize o `main` do `wrangler.jsonc`, os bindings `durable_objects` e uma `migrations` com `new_sqlite_classes: ["RealtimeHub"]`.
3. **Rota `GET /api/realtime`:**
   - exige sessão;
   - calcula no servidor os canais permitidos pelo papel e organização (o cliente não escolhe);
   - faz o upgrade para o DO.
4. **Publicar:** em cada service que muda estado (publish, reserve, accept, advance, delivery, preferências, notificações), depois do batch bem-sucedido, chame `notify(channels)`. Se o aviso falhar, a operação não falha: loga e segue. O refresh de 15 s cobre.
5. **Cliente** (`realtime.tsx`):
   - troca o canal do Supabase por `WebSocket` para `/api/realtime`;
   - reconecta com backoff;
   - mantém o refresh de 15 s, o foco, o online e o selo "Atualizações ao vivo" / "Sincronizando" com os mesmos textos.
6. **Testes:**
   - unitário do cálculo de canais por papel;
   - teste de integração local (`cf:preview`) com duas sessões: ação de uma aparece na outra em menos de 2 s.
7. Relatório `prompts/RELATORIO-14.md`.

Ao terminar: **"Prompt 14 concluído."**
