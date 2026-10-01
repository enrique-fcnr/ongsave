Você vai construir o projeto completo **ONGSave** na pasta local:

`C:\Users\enriq\ongsave`

Trate este documento como a especificação principal do produto. Não crie apenas protótipos visuais ou telas estáticas. O objetivo é entregar um **MVP web funcional de ponta a ponta**, preparado para uma apresentação acadêmica ao vivo usando três celulares simultaneamente.

O produto deve ser uma **plataforma web SaaS mobile-first com suporte a PWA**, visualmente indistinguível de um app quando aberta ou instalada em um celular.

---

# 1. OBJETIVO DO PRODUTO

O ONGSave conecta três participantes:

1. Supermercados / mercados
2. ONGs
3. Motoristas / agentes de resgate

O fluxo central é:

Supermercado fotografa excedente
→ IA analisa a foto
→ supermercado revisa
→ excedente é publicado
→ ONG visualiza e aceita
→ missão logística é criada
→ motorista visualiza no mapa
→ motorista aceita
→ motorista coleta no supermercado
→ transporta até ONG
→ ONG fornece token
→ motorista confirma entrega
→ resgate é finalizado
→ métricas de impacto são atualizadas

Este fluxo deve funcionar de verdade em banco.

---

# 2. PRINCÍPIO DO MVP

O projeto terá componentes:

## Funcionais/reais

- autenticação;
- usuários;
- organizações;
- supermercado;
- ONG;
- motorista;
- banco PostgreSQL;
- persistência;
- realtime;
- upload de fotografia;
- captura via câmera;
- integração multimodal com IA;
- revisão humana da IA;
- publicação do excedente;
- feed de doações;
- aceite da ONG;
- criação da missão;
- aceite do motorista;
- mudanças de status;
- token de entrega;
- conclusão;
- atualização das métricas;
- histórico;
- mapa interativo;
- PWA;
- responsividade desktop/mobile;
- dados seed;
- ambiente de demonstração.

## Mockados/simulados

- matchmaking geográfico avançado;
- GPS real do motorista;
- rastreamento ao vivo;
- previsão real de trânsito;
- ETA real;
- roteamento inteligente;
- previsão de desperdício;
- análise histórica avançada;
- score de matching sofisticado;
- algumas métricas ESG;
- projeções ambientais;
- dados históricos de meses anteriores.

Mockado não significa tela estática.

Os dados simulados devem estar salvos no banco e fazer parte de fluxos funcionais.

---

# 3. STACK

Usar:

- Next.js 16+
- App Router
- React
- TypeScript strict
- Tailwind CSS
- shadcn/ui
- Supabase
  - Auth
  - PostgreSQL
  - Storage
  - Realtime
- Zod
- React Hook Form quando fizer sentido
- Lucide Icons
- PWA via manifest + service worker
- MapLibre GL ou Mapbox
- Vercel-compatible

Preferência:

**MapLibre** se for possível evitar dependência paga.

Se Mapbox entregar melhor resultado com menos esforço, criar provider desacoplado e deixar token no `.env`.

---

# 4. ARQUITETURA

Manter aplicação única.

Não criar três projetos.

Estrutura conceitual:

```text
/app

/(public)
  /
  /login

/(app)
  /home
  /rescues
  /impact
  /profile

/supermarket
  /surplus/new
  /surplus/[id]
  /reports

/ngo
  /donations
  /donations/[id]

/driver
  /missions
  /missions/[id]

/rescue/[id]

/demo
```

Pode melhorar a arquitetura caso haja justificativa técnica.

---

# 5. PAPÉIS

Role:

```text
SUPERMARKET
NGO
DRIVER
ADMIN
```

Cada usuário deve pertencer a um perfil operacional.

Supermercados e ONGs pertencem a organizações.

Motoristas são indivíduos.

---

# 6. OBJETO CENTRAL

O objeto mais importante do sistema é:

`rescue`

Estados:

```text
AVAILABLE
RESERVED
WAITING_DRIVER
DRIVER_ASSIGNED
GOING_TO_PICKUP
AT_PICKUP
PICKED_UP
IN_TRANSIT
AT_DESTINATION
DELIVERED
CANCELLED
```

Não espalhar lógica de status arbitrariamente nos componentes.

Criar:

- enums;
- helpers;
- regras de transição;
- labels de UI;
- cores/status pills.

---

# 7. BANCO DE DADOS

Criar migrations versionadas.

Tabelas mínimas:

## profiles

```text
id
auth_user_id
name
email
phone
role
avatar_url
created_at
updated_at
```

## organizations

```text
id
name
type
slug
description
logo_url
phone
email
address_line
neighborhood
city
state
postal_code
latitude
longitude
created_at
updated_at
```

type:

```text
SUPERMARKET
NGO
```

## organization_members

```text
id
organization_id
profile_id
member_role
created_at
```

## ngo_preferences

```text
id
organization_id
daily_capacity_kg
receiving_enabled
receiving_start
receiving_end
service_radius_km
has_fridge
has_freezer
has_cold_room
accepted_categories
current_needs
created_at
updated_at
```

## drivers

```text
id
profile_id
vehicle_type
vehicle_label
vehicle_capacity_kg
availability
mock_latitude
mock_longitude
created_at
updated_at
```

## surplus_batches

```text
id
supermarket_id
created_by
title
category
description
image_url
estimated_weight_kg
estimated_weight_min
estimated_weight_max
estimated_quantity
visual_condition
pickup_priority
recommended_pickup_hours
expires_at
status
ai_analysis_json
ai_provider
ai_model
ai_confidence
user_confirmed
created_at
updated_at
published_at
```

## surplus_items

```text
id
batch_id
name
estimated_quantity
confidence
created_at
```

## donation_reservations

```text
id
batch_id
ngo_id
accepted_by
accepted_at
status
```

## rescues

```text
id
batch_id
supermarket_id
ngo_id
driver_id
status

pickup_address
pickup_latitude
pickup_longitude

delivery_address
delivery_latitude
delivery_longitude

mock_distance_km
mock_eta_minutes
mock_route_geometry

confirmation_token

created_at
reserved_at
driver_assigned_at
going_to_pickup_at
arrived_pickup_at
picked_up_at
in_transit_at
arrived_destination_at
delivered_at
cancelled_at
updated_at
```

## rescue_events

```text
id
rescue_id
event_type
status
actor_profile_id
metadata
created_at
```

Serve para timeline.

## impact_metrics

```text
id
rescue_id
food_saved_kg
estimated_meals
estimated_disposal_savings
estimated_co2_avoided_kg
estimated_water_saved_liters
created_at
```

## notifications

```text
id
profile_id
type
title
body
read_at
metadata
created_at
```

---

# 8. RLS

Ativar RLS.

Criar policies coerentes.

Exemplos:

Supermercado:
- vê sua organização;
- vê lotes da própria organização;
- vê resgates envolvendo sua organização;
- não altera dados de outras organizações.

ONG:
- vê doações publicadas elegíveis;
- pode reservar lote disponível;
- vê resgates dela;
- edita preferências próprias.

Motorista:
- vê missões WAITING_DRIVER;
- vê missões dele;
- pode aceitar missão disponível;
- atualiza status permitido.

Para MVP acadêmico, priorize funcionamento e isolamento básico correto.

---

# 9. SEED COMPLETO

Criar seed idempotente.

Popular dados de São Paulo.

## Supermercados

1. Mercado Paulista
   - Vila Mariana

2. Supermercado Aurora
   - Moema

3. Empório Central
   - Pinheiros

4. Mercado Nova Vida
   - Santana

Criar coordenadas plausíveis em São Paulo.

## ONGs

1. Instituto Esperança
   - Vila Mariana

2. Casa São Lucas
   - Moema

3. Projeto Viver
   - Pinheiros

4. Associação Mãos Abertas
   - Bela Vista

## Motoristas

1. Lucas Almeida
2. Mariana Costa
3. Rafael Santos

Adicionar veículos e capacidade.

---

# 10. CONTAS DE DEMONSTRAÇÃO

Criar documentação para contas demo.

Idealmente fornecer seed ou script de bootstrap para criar usuários no Supabase Auth.

Conta oficial supermercado:

```text
mercado@ongsave.demo
demo123
```

Relacionado:

Mercado Paulista

Conta oficial ONG:

```text
ong@ongsave.demo
demo123
```

Relacionado:

Instituto Esperança

Conta oficial motorista:

```text
motorista@ongsave.demo
demo123
```

Relacionado:

Lucas Almeida

Caso Supabase Auth não possa ser populado via SQL comum, criar script Node:

```text
scripts/create-demo-users.ts
```

Usando Service Role.

---

# 11. MODO DEMONSTRAÇÃO

Criar:

`/demo`

Não expor na navegação principal.

Tela simples e elegante.

Mostrar:

```text
Modo Demonstração

Mercado Paulista
[ Entrar como supermercado ]

Instituto Esperança
[ Entrar como ONG ]

Lucas Almeida
[ Entrar como motorista ]

[ Resetar demonstração ]
```

O login rápido pode usar as credenciais demo.

Criar reset seguro.

Ao resetar:

- remover lote ativo da demo;
- remover reserva ativa;
- remover rescue ativo;
- restaurar histórico inicial;
- restaurar métricas seed;
- deixar sistema pronto para nova apresentação.

Proteger reset por env:

```text
ENABLE_DEMO_MODE=true
```

---

# 12. EXPERIÊNCIA DO SUPERMERCADO

## Home

Mobile:

Header:

```text
ONGSave
Notificações
```

Saudação:

```text
Bom dia,
Mercado Paulista
```

Card impacto:

```text
184 kg
salvos este mês

368 refeições

R$ 1.420 evitados
```

CTA principal:

```text
Registrar novo excedente
```

Lista:

```text
Resgates de hoje
```

Mostrar resgates recentes.

Bottom nav:

```text
Início
Resgates
Impacto
Perfil
```

---

# 13. NOVO EXCEDENTE

Fluxo principal.

## Passo 1

Tela de câmera.

Permitir:

- usar câmera;
- selecionar imagem da galeria.

Em mobile usar:

```html
<input type="file" accept="image/*" capture="environment">
```

quando apropriado.

Visual:

```text
Registre o excedente

Fotografe os alimentos que serão disponibilizados.

[ câmera ]

Tirar foto
```

---

# 14. ANÁLISE DE IA

Após captura:

Tela:

```text
Analisando excedente

✓ Identificando alimentos
✓ Classificando categoria
✓ Estimando quantidade
✓ Avaliando condição visual
● Calculando impacto
```

Usar loading sofisticado e curto.

A análise deve ser REAL quando:

```text
AI_MODE=live
```

---

# 15. ARQUITETURA DE IA

Não chamar provider diretamente de componente.

Criar:

```text
src/lib/ai/
  provider.ts
  types.ts
  schema.ts
  prompts.ts
  analyze-surplus.ts
  providers/
    openai.ts
```

API principal:

```ts
analyzeSurplus(input)
```

O restante do app não deve saber o provider.

---

# 16. ENV IA

Criar `.env.example`.

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

AI_MODE=live
AI_PROVIDER=openai
OPENAI_API_KEY=
AI_MODEL=

NEXT_PUBLIC_MAP_PROVIDER=maplibre
NEXT_PUBLIC_MAPBOX_TOKEN=

ENABLE_DEMO_MODE=true
```

Não commitar segredo.

O sistema deve ficar pronto de modo que eu só precise preencher API e Supabase.

---

# 17. SCHEMA DE IA

Validar com Zod.

Resposta esperada:

```json
{
  "title": "Hortifrúti misto",
  "category": "produce",
  "items": [
    {
      "name": "banana",
      "estimated_quantity": 18,
      "confidence": 0.93
    }
  ],
  "estimated_weight_kg": 14.5,
  "estimated_weight_range": {
    "min": 12,
    "max": 17
  },
  "visual_condition": "acceptable",
  "pickup_priority": "high",
  "recommended_pickup_hours": 8,
  "confidence": 0.89,
  "warnings": []
}
```

Enums:

category:

```text
produce
bakery
dairy
prepared_food
dry_goods
frozen
other
```

visual_condition:

```text
acceptable
attention
not_recommended
inconclusive
```

pickup_priority:

```text
low
medium
high
urgent
```

---

# 18. PROMPT DE IA

Criar prompt robusto em português.

Objetivo:

- identificar alimentos;
- classificar;
- estimar quantidade;
- estimar faixa de peso;
- avaliar condição APARENTE;
- sugerir prioridade;
- retornar warnings;
- confidence.

A IA NÃO pode dizer:

“seguro para consumo”.

Usar:

“condição visual aparente”.

Prompt deve enfatizar:

- não diagnosticar segurança alimentar;
- não afirmar validade;
- não inventar informações não visíveis;
- retornar JSON estrito.

---

# 19. AI_MODE DEMO

Criar fallback de apresentação.

```env
AI_MODE=demo
```

Nesse modo:

- upload continua real;
- interface continua igual;
- análise retorna fixture compatível com schema;
- salvar metadata indicando `demo`.

Criar:

```text
src/lib/ai/demo-analysis.ts
```

Não mascarar internamente como provider real.

---

# 20. RESULTADO DA IA

Após análise mostrar:

Foto.

```text
Análise concluída

Hortifrúti misto

38 kg estimados

Itens:
Banana
Tomate
Alface
Maçã

Condição visual
Adequada para avaliação

Prioridade
Alta
```

Campos editáveis.

Funcionário deve poder corrigir:

- título;
- categoria;
- peso;
- prioridade;
- retirada;
- itens.

Checkbox obrigatório:

```text
Confirmo que revisei as informações e que os alimentos atendem às condições internas da unidade para doação.
```

CTA:

```text
Confirmar e publicar
```

---

# 21. PUBLICAÇÃO

Após confirmação:

Criar batch.

Status:

```text
AVAILABLE
```

Criar impacto estimado.

Calcular mock simples:

```text
estimated_meals = weight_kg * 2
```

Deixar fórmula centralizada.

Mostrar:

```text
Excedente publicado

38 kg disponíveis

≈ 76 refeições

Estamos disponibilizando este lote para instituições compatíveis.
```

---

# 22. ONG — HOME

Header:

```text
Olá,
Instituto Esperança
```

Resumo:

```text
186 kg recebidos esta semana

372 refeições

4 resgates concluídos
```

Seção:

```text
Doações próximas
```

Cards:

```text
Hortifrúti
38 kg disponíveis

Mercado Paulista
Vila Mariana · 2,4 km

≈ 76 refeições

[ Ver doação ]
```

Bottom nav:

```text
Início
Doações
Resgates
Impacto
Perfil
```

---

# 23. FEED DA ONG

Ordenação MOCKADA.

Pode usar:

- neighborhood;
- categoria aceita;
- capacidade;
- horário;
- status.

Não construir geospatial engine complexo.

Mostrar badge opcional:

```text
Alta compatibilidade
```

Evitar fingir IA avançada.

---

# 24. DETALHE DA DOAÇÃO

Mostrar:

- foto;
- título;
- peso;
- supermercado;
- bairro;
- mock distance;
- items;
- condição visual;
- retirada recomendada;
- refeições estimadas.

CTA:

```text
Aceitar doação
```

Confirmação:

```text
Sua instituição consegue receber aproximadamente 38 kg até 18:00?
```

Ao aceitar:

- criar reservation;
- criar rescue;
- setar NGO;
- mudar batch;
- rescue:

```text
WAITING_DRIVER
```

---

# 25. ONG — ACOMPANHAMENTO

Mostrar timeline:

```text
✓ Doação aceita
● Procurando motorista
○ Coleta
○ Em transporte
○ Entrega
```

Realtime.

Quando motorista aceitar:

```text
Lucas Almeida aceitou o resgate
```

Quando coleta ocorrer:

```text
Sua doação está a caminho
```

---

# 26. TOKEN

Ao chegar:

ONG abre:

```text
Confirmar recebimento
```

Mostrar token de 4 dígitos.

Exemplo:

```text
7429
```

Token deve ser realmente gerado e salvo.

Não fixar sempre 7429.

Pode ser gerado na criação do rescue.

---

# 27. MOTORISTA — HOME

A home deve ser baseada em mapa.

Mapa fullscreen/top 60%.

Estilo:

- clean;
- ruas cinza claro;
- parques discretos;
- poucos POIs;
- pins customizados;
- rota verde.

Mostrar:

```text
3 resgates próximos
```

Pins:

- supermercado;
- ONG;
- localização mockada do motorista.

Bottom sheet.

---

# 28. MAPA

Usar MapLibre ou provider escolhido.

Criar:

```text
src/components/maps/
  DriverMap.tsx
  RouteLayer.tsx
  RescueMarker.tsx
  DriverMarker.tsx
```

Usar coordenadas seed.

Não usar apenas imagem estática.

Mapa deve ter:

- zoom;
- pan;
- markers;
- selected rescue;
- route geometry mock;
- fitBounds.

---

# 29. ROTA MOCKADA

Criar geometria simples entre coordenadas.

Pode usar array de pontos pré-salvo.

Exemplo:

```json
[
  [-46.64, -23.59],
  [-46.638, -23.588],
  [-46.633, -23.586]
]
```

Não precisa calcular trânsito.

---

# 30. MISSÕES DISPONÍVEIS

Bottom sheet:

```text
Resgate disponível

Mercado Paulista
↓
Instituto Esperança

2,4 km · 38 kg

≈ 76 refeições

[ Aceitar missão ]

[ Ver rota ]
```

Aceitar muda:

```text
WAITING_DRIVER
→
DRIVER_ASSIGNED
```

Define driver_id.

Realtime atualiza ONG e supermercado.

---

# 31. FLUXO DO MOTORISTA

Após aceitar:

```text
Missão aceita
```

Timeline:

```text
● Ir até supermercado
○ Retirar
○ Levar até ONG
○ Confirmar entrega
```

Botão:

```text
Iniciar coleta
```

status:

```text
GOING_TO_PICKUP
```

Depois:

```text
Cheguei ao supermercado
```

status:

```text
AT_PICKUP
```

Depois:

```text
Confirmar retirada
```

status:

```text
PICKED_UP
```

Logo depois ou em ação separada:

```text
IN_TRANSIT
```

Mapa muda destino.

---

# 32. ENTREGA

Ao chegar:

```text
Cheguei à ONG
```

status:

```text
AT_DESTINATION
```

Mostrar input de 4 dígitos.

```text
Digite o código da instituição
```

Validar token.

Se correto:

```text
DELIVERED
```

Registrar timestamp.

Criar rescue event.

Atualizar métricas.

---

# 33. FINALIZAÇÃO

Tela:

```text
Missão concluída

38 kg transportados

≈ 76 refeições viabilizadas

2,4 km solidários
```

---

# 34. IMPACTO

Supermercado:

```text
kg salvos
refeições
resgates
economia estimada
CO₂e mock estimado
```

ONG:

```text
kg recebidos
refeições estimadas
resgates
supermercados parceiros
```

Motorista:

```text
kg transportados
refeições viabilizadas
km solidários
resgates
```

---

# 35. DASHBOARD SUPERMERCADO DESKTOP

Desktop deve ser diferente de mobile.

Usar sidebar.

Itens:

```text
Início
Resgates
Impacto
Relatórios
Perfil
```

Home:

cards de métricas.

Gráfico:

```text
Alimentos salvos por semana
```

Gráfico:

```text
Composição do excedente
```

Histórico:

```text
Data
Categoria
Peso
ONG
Status
```

---

# 36. RELATÓRIO ESG

Criar tela.

Mostrar:

```text
Impacto ESG
Setembro / 2026

1.284 kg
alimentos redirecionados

2.568
refeições estimadas

31
resgates

4
ONGs beneficiadas

1.840 kg
CO₂e estimado evitado
```

Os dados ambientais podem ser mockados.

Deixar visualmente indicado como estimativa quando necessário.

Se possível gerar PDF simples no MVP.

Se isso comprometer prazo, priorizar a tela e deixar PDF secundário.

---

# 37. REALTIME

Usar Supabase Realtime.

Atualizar automaticamente:

- novos batches;
- reservas;
- rescues;
- status;
- notifications.

Cenário crítico:

Celular A publica.

Celular B recebe.

Celular B aceita.

Celular C recebe missão.

Celular C aceita.

A e B recebem atualização.

C coleta.

B recebe “a caminho”.

C entrega.

A, B e C mostram finalização.

---

# 38. NOTIFICAÇÕES INTERNAS

Não precisa push real.

Criar sistema interno.

Exemplos:

ONG:

```text
Nova doação disponível
38 kg de hortifrúti.
```

Motorista:

```text
Nova missão próxima
Mercado Paulista → Instituto Esperança
```

Supermercado:

```text
Instituto Esperança aceitou sua doação.
```

ONG:

```text
Lucas Almeida aceitou o resgate.
```

---

# 39. DESIGN SYSTEM

Direção:

- moderno;
- minimalista;
- clean;
- funcional;
- tecnológico;
- premium;
- zero estética de “projeto universitário genérico”.

Referências conceituais:

- Linear;
- Revolut;
- Airbnb;
- apps modernos de mobilidade;
- interfaces SaaS 2026.

Não copiar marcas.

---

# 40. PALETA

Base:

```text
background
#F7F8FA

surface
#FFFFFF

text primary
#111827

text secondary
#667085

border
#E7E9EE

brand
#22C55E

brand dark
#15803D

success surface
#ECFDF3

warning
#F59E0B

error
#EF4444
```

Criar tokens CSS.

---

# 41. TIPOGRAFIA

Usar:

Geist.

Fallback:

Inter.

Hierarquia limpa.

Evitar bold exagerado.

Métricas grandes.

---

# 42. COMPONENTES

Cards:

- radius 16–20;
- borda sutil;
- pouca sombra;
- muito whitespace.

Buttons:

- 48–52 px;
- radius 12–14;
- CTA verde;
- secundário outline.

Status:

- pills discretas.

Ícones:

Lucide.

Não usar emojis na UI final.

---

# 43. MOBILE

Mobile primeiro.

Largura alvo inicial:

```text
390px
```

Bottom nav fixa.

Header compacto.

Sem sidebar.

Deve parecer aplicativo instalado.

---

# 44. DESKTOP

Sidebar 220–240px.

Conteúdo central.

Não simplesmente esticar mobile.

Dashboard deve aproveitar largura.

---

# 45. PWA

Criar:

- manifest;
- icons placeholders;
- theme color;
- apple-mobile-web-app-capable;
- standalone;
- service worker;
- installability básica.

Abrindo pela homescreen:

- sem barra visual desnecessária;
- experiência app-like.

---

# 46. RESPONSIVIDADE

Testar:

- 375px
- 390px
- 430px
- tablet
- 1280px
- 1440px

---

# 47. UX

Regra principal:

**uma ação principal por tela.**

Supermercado:

```text
Registrar excedente
```

ONG:

```text
Aceitar doação
```

Motorista:

```text
Aceitar missão
```

Entrega:

```text
Confirmar entrega
```

Não sobrecarregar telas.

---

# 48. LOADING / EMPTY / ERROR

Criar estados reais.

Exemplos:

Feed vazio:

```text
Nenhuma doação disponível agora.
Novas oportunidades aparecerão aqui.
```

Sem missão:

```text
Nenhum resgate próximo no momento.
```

Erro IA:

```text
Não conseguimos analisar bem esta imagem.
```

Ações:

```text
Tirar outra foto
Preencher manualmente
```

---

# 49. ERROS DA IA

Nunca travar fluxo por IA.

Se provider falhar:

- mostrar erro elegante;
- permitir tentar novamente;
- permitir preenchimento manual;
- se `AI_MODE=demo`, usar fixture.

---

# 50. SEGURANÇA ALIMENTAR

Nunca escrever:

```text
Seguro para consumo
```

Usar:

```text
Condição visual aparente
Adequado para avaliação
```

Mostrar aviso:

```text
A análise visual não substitui a avaliação da equipe responsável pelo alimento.
```

---

# 51. MOCK MATCHING

Criar helper simples.

Exemplo:

```ts
score =
categoryMatch * 30 +
neighborhoodMatch * 20 +
capacityMatch * 20 +
receivingEnabled * 10 +
scheduleMatch * 10 +
needMatch * 10
```

Não precisa chamar de IA.

Apenas usar para ordenar.

---

# 52. DADOS HISTÓRICOS

Criar dados seed suficientes para dashboards não ficarem vazios.

Exemplo:

últimos 30 dias:

- 10–20 resgates;
- categorias variadas;
- pesos;
- ONGs diferentes;
- impacto.

---

# 53. TESTES

Criar pelo menos testes para regras críticas:

- transições de rescue;
- token;
- match mock;
- cálculo de impacto;
- validação Zod da IA.

Se possível:

Vitest.

---

# 54. DOCUMENTAÇÃO

README completo.

Explicar:

## Como instalar

```bash
npm install
```

## Configurar env

```bash
cp .env.example .env.local
```

## Supabase

- migrations;
- seed;
- demo users.

## Rodar

```bash
npm run dev
```

## AI

```text
AI_MODE=live
OPENAI_API_KEY=
AI_MODEL=
```

## Demo

```text
/demo
```

## Reset demo

Explicar.

---

# 55. DEV EXPERIENCE

Criar scripts úteis:

```json
{
  "dev": "...",
  "build": "...",
  "lint": "...",
  "typecheck": "...",
  "test": "...",
  "seed": "...",
  "demo:users": "...",
  "demo:reset": "..."
}
```

---

# 56. ORDEM DE IMPLEMENTAÇÃO

Trabalhe nesta ordem.

## Fase 1

Fundação:

- Next;
- Tailwind;
- shadcn;
- Supabase;
- auth;
- layout;
- design system;
- migrations;
- seed.

## Fase 2

Papéis e navegação.

- supermercado;
- ONG;
- motorista;
- home de cada.

## Fase 3

Supermercado.

- câmera;
- upload;
- Storage;
- IA provider;
- schema;
- análise;
- revisão;
- publicação.

## Fase 4

ONG.

- feed;
- detalhes;
- aceite;
- rescue.

## Fase 5

Motorista.

- mapa;
- missões;
- rota mock;
- aceite;
- coleta;
- entrega.

## Fase 6

Realtime.

## Fase 7

Impacto.

## Fase 8

Demo mode.

## Fase 9

PWA.

## Fase 10

Polimento visual e QA.

---

# 57. CENÁRIO OFICIAL DE DEMONSTRAÇÃO

O sistema precisa suportar:

## Aparelho 1

Login:

```text
mercado@ongsave.demo
```

Abrir Mercado Paulista.

Fotografar caixa de alimentos.

IA analisa.

Funcionário confirma.

Publica.

## Aparelho 2

Login:

```text
ong@ongsave.demo
```

Nova doação aparece.

Abrir.

Aceitar.

## Aparelho 3

Login:

```text
motorista@ongsave.demo
```

Missão aparece no mapa.

Aceitar.

Iniciar coleta.

Chegar ao supermercado.

Confirmar retirada.

Ir para ONG.

## ONG

Mostrar token.

## Motorista

Digitar token.

## Sistema

Marcar DELIVERED.

Atualizar os três perfis.

---

# 58. CRITÉRIO DE ACEITE PRINCIPAL

O MVP está concluído somente se este cenário funcionar sem intervenção no banco:

```text
LOGIN SUPERMERCADO
↓
FOTO REAL
↓
ANÁLISE
↓
PUBLICAÇÃO
↓
LOGIN ONG
↓
ACEITE
↓
LOGIN MOTORISTA
↓
MISSÃO
↓
COLETA
↓
TRANSPORTE
↓
TOKEN
↓
ENTREGA
↓
IMPACTO
```

---

# 59. CRITÉRIO DE ACEITE VISUAL

A interface deve:

- parecer produto comercial;
- parecer PWA/app em celular;
- ser limpa;
- ter bom espaçamento;
- usar tipografia consistente;
- não parecer template administrativo genérico;
- não ter excesso de cards;
- não ter excesso de cores;
- não usar emojis;
- ter mapa premium;
- ter estados de loading;
- ter animações leves;
- ser totalmente utilizável com touch.

---

# 60. CRITÉRIO DE ACEITE DE IA

O projeto só está pronto se:

- existir provider real;
- existir integração preparada;
- `.env.example` estiver pronto;
- schema estiver implementado;
- Zod validar resposta;
- upload real funcionar;
- análise puder ser chamada;
- revisão funcionar;
- modo demo funcionar;
- fallback manual existir.

Não deixar TODOs do tipo:

```text
// integrate AI later
```

A integração precisa existir de fato.

Só deve faltar a minha chave.

---

# 61. NÃO FAZER

Não:

- criar Expo;
- criar React Native;
- criar app iOS;
- criar app Android;
- separar três apps;
- criar backend isolado desnecessário;
- exagerar microservices;
- fazer tracking GPS real;
- fazer matching complexo;
- construir ML próprio;
- inventar features fora do escopo;
- usar mapa estático;
- hardcodar fluxo inteiro em componentes;
- criar dados apenas no frontend;
- criar telas desconectadas do banco.

---

# 62. QUALIDADE

Antes de concluir:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Corrigir erros.

Não entregar projeto quebrado.

---

# 63. HANDOFF FINAL DO CODEX

Ao terminar, me entregue:

1. resumo do que foi criado;
2. arquitetura;
3. migrations;
4. contas demo;
5. variáveis que preciso preencher;
6. comandos para rodar;
7. como criar usuários;
8. como resetar demo;
9. como ativar IA real;
10. como ativar AI_MODE demo;
11. status de lint;
12. status de typecheck;
13. status dos testes;
14. status do build;
15. limitações conhecidas;
16. próximos passos opcionais.

---

# 64. PRIORIDADE

Prioridade absoluta:

**Fluxo funcional > estabilidade > mobile UX > visual > recursos extras.**

Se for necessário escolher entre fazer dez recursos medianos ou o fluxo principal perfeito:

faça o fluxo principal perfeito.

---

# 65. DIREÇÃO FINAL

O usuário deve sentir:

## Supermercado

“Eu tiro uma foto, confirmo e o ONGSave cuida do restante.”

## ONG

“Eu encontro alimento disponível e não preciso resolver a logística sozinha.”

## Motorista

“Eu abro o mapa, aceito uma missão, faço a coleta e entrego.”

## ONGSave

“Uma fotografia inicia um resgate completo.”

Construa o produto com essa ideia guiando toda a experiência.