# Arquitetura do ONGSave

Uma aplicação Next.js 16 App Router com React e TypeScript strict. As páginas operacionais são Server Components dinâmicos. Componentes client cuidam de câmera, formulários, ações, mapa e subscriptions. Layouts protegidos validam o usuário no Supabase Auth; `proxy.ts` renova os cookies. `requireProfile` usa cache por request, sem compartilhar dados entre usuários.

## Fluxo e persistência

1. `/api/upload` autentica supermercado, verifica tipo pelo conteúdo e envia a fotografia a um bucket privado. Registra uma análise manual provisória em `private.analyses`.
2. `/api/analyze` lê apenas a fotografia do usuário. `analyzeSurplus` escolhe fixture demo ou provider OpenAI multimodal, valida a resposta com Zod e salva os metadados no banco usando a Service Role. A revisão não pode forjar o provider salvo.
3. `/api/batches` valida a revisão e invoca `publish_surplus`. A função exige a análise/foto do usuário, confirmação humana e uma organização de supermercado. Salva lote, itens e a estimativa `estimated_impact_json` na mesma transação. A fórmula do banco é centralizada em `private.impact_for_weight`; a entrega promove essa estimativa a métricas de impacto concluído.
4. `reserve_donation` bloqueia o lote e as preferências da ONG com `FOR UPDATE`, verifica disponibilidade, horário em São Paulo, categorias e capacidade diária acumulada, cria reserva, missão, eventos e notificações.
5. `accept_mission` bloqueia missão e motorista, verifica disponibilidade, capacidade do veículo e missão já ativa. Define o motorista de forma atômica.
6. `advance_rescue` verifica o motorista responsável e a próxima transição permitida. Na chegada, `delivery_token` disponibiliza o token somente à ONG envolvida. Na entrega, o token correto registra impacto e conclusão na mesma transação.
7. Realtime solicita nova renderização de servidor. Um refresh de recuperação a cada 15 segundos e ao retornar foco/rede cobre interrupções. Não há estado operacional persistido em localStorage.

## Modelo

`profiles`, `organizations`, `organization_members`, `ngo_preferences`, `drivers`, `surplus_batches`, `surplus_items`, `donation_reservations`, `rescues`, `rescue_events`, `impact_metrics`, `notifications`.

Extensões para segurança/demo:

- `private.analyses`: fotografia, proveniência de análise e vínculo com o perfil;
- `private.rescue_tokens`: `confirmation_token`, tentativas e bloqueio temporário;
- `surplus_batches.is_seed`, `is_demo`, `seed_kind`: reset limitado ao ambiente demonstrativo;
- `surplus_batches.estimated_impact_json`: estimativa persistida desde a publicação, ainda sem contar como entrega;
- `private.schema_migrations`: criada somente pelo runner opcional `db:migrate`.

O token foi movido de `rescues.confirmation_token` para uma tabela privada: colocá-lo na linha que o motorista pode ler revelaria o código de confirmação. Ele continua sendo realmente gerado e persistido para cada rescue. O trigger gera quatro dígitos, incluindo zeros à esquerda. Cinco erros bloqueiam novas tentativas por um minuto; erros não geram impacto.

## RLS e privilégios

Todas as tabelas públicas têm RLS. As privadas também têm RLS sem policies de leitura direta. O diretório de organizações disponibiliza endereços operacionais para os participantes, enquanto perfis pessoais são visíveis apenas ao próprio usuário.

Antes dos grants explícitos, a migration revoga os grants automáticos do Supabase nas tabelas do ONGSave. Usuários podem ler somente os registros autorizados. As únicas alterações diretas são nome/telefone próprios, preferências da própria ONG, disponibilidade do próprio motorista e leitura de notificações. Papel, organização, motorista atribuído, status e impacto não podem ser editados diretamente.

Os RPCs públicos são `SECURITY INVOKER`. Implementações privilegiadas ficam no schema `private`, com `search_path` vazio, permissões restritas e autorização explícita em cada operação. O schema privado não deve ser exposto na Data API. Os RPCs de proveniência e reset são exclusivos da Service Role e recebem o Auth ID verificado pela API; a chave nunca chega ao navegador. O endpoint de reset também exige `ENABLE_DEMO_MODE=true`.

## Simulações identificadas

- Matching: regras de categoria, bairro, capacidade, janela de recebimento e necessidades.
- Mapa: MapLibre real, tiles OpenStreetMap, pan/zoom/markers; posição, geometria, distância e ETA simulados, persistidos no banco. Workers servidos pelo app, copiados da versão instalada no início do dev/build.
- Histórico: 16 entregas seed. Quatro lotes disponíveis e três missões iniciais.
- Impacto ambiental/economia: fatores ilustrativos por kg; refeições também são estimadas.
- `AI_MODE=demo`: fixture explicitamente identificada como `demo`, com upload real.

## PWA e deploy

Manifest standalone, ícones PNG any/maskable, Apple metadata, viewport/safe areas e service worker. Somente ícones e página offline são cacheados. Páginas autenticadas e APIs não são cacheadas pelo service worker. Operações exigem conexão.

O app é compatível com Vercel. Use HTTPS para instalação e service worker nos celulares. Chaves públicas são incorporadas ao bundle no build: recompile após alterá-las. O mapa não exige token pago. O provider de mapa deste MVP é exclusivamente MapLibre; `NEXT_PUBLIC_MAPBOX_TOKEN` está reservado no exemplo, sem integração Mapbox.

Fotos originais de até 20 MB são decodificadas no navegador e reduzidas a JPEG com lado máximo de 1600 px. O servidor limita o upload a 4 MB. O conteúdo é novamente verificado no servidor; a fotografia armazenada é a versão reduzida da imagem real capturada.
