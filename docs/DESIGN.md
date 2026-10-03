# Identidade visual — ONGSave

## Sistema visual do produto — 3 de outubro de 2026

A linguagem da landing Pulse AI foi aplicada ao produto completo. Os tokens compartilhados ficam em `src/app/globals.css`: verde principal `#22694f`, texto `#1d3026`, fundo `#f7faf6`, menta `#e8f2eb`, lima `#edf5d9` e bordas `#e2e9e1`. A landing usa os mesmos tokens de cor. DM Sans, botões em cápsula, cantos de 16–30 px, contornos leves e espaçamento consistente conectam as áreas públicas e autenticadas.

A navegação desktop fica em um painel branco e o cabeçalho em uma cápsula, com contexto do papel e acesso ao perfil. No celular, cabeçalho e menu inferior flutuam, com áreas seguras e alvos de toque. O mercado tem acesso direto ao registro de excedente; o painel também oferece o relatório em celular. A área do motorista começa nas missões, evitando dois acessos ao mesmo destino. A tela ativa é anunciada com `aria-current`, e o conteúdo possui um link de salto por teclado.

Login e demonstração apresentam o propósito e o próximo passo sem instruções de infraestrutura. A fotografia ilustrativa da equipe da landing é reutilizada no login. Dashboards, doações, detalhes, histórico, impacto, relatórios, notificações, perfil, carregamento, erros, página ausente e página offline seguem a mesma família de superfícies e controles.

Os formulários agrupam os dados em fieldsets: perfil, disponibilidade, alimentos e armazenamento; no registro de excedente, dados do lote, itens, condição/retirada e revisão da equipe. As três etapas têm nomes visíveis. A confirmação humana continua necessária para publicar. Valores estimados, demonstrações, prazos, condições visuais e cuidados não foram transformados em garantias. As explicações extensas das métricas ficam em detalhes expansíveis e os rótulos dão prioridade à ação. As mensagens de falha não expõem comandos ou configuração interna ao participante.

O mapa mantém sua geometria e seu enquadramento, com coleta em lima, entrega em verde e rota no verde principal. Transições curtas orientam a interação; a entrada das telas respeita movimento reduzido. O modo de impressão remove a navegação, e o shell offline mantém a paleta e a ação de reconexão. Contratos de dados, permissões e regras de resgate permanecem os mesmos.

## Referência inicial

A primeira referência estética foi [Sunbeam, no Land-book](https://land-book.com/websites/99614-sunbeam-the-fun-b2b-saas-template). A aplicação mantém suas páginas, papéis e fluxos de doação e entrega.

O primeiro refinamento usou DM Sans variável hospedada junto ao app, fundos claros, texto em carvão, verde lima e superfícies em lavanda, azul e pêssego. A paleta atual do produto está descrita acima.

## Landing page — 3 de outubro de 2026

A landing tem como referência de composição e movimento a [Pulse AI](https://pulse-ai-one-ashy.vercel.app). Usa menu fixo em cápsula, hero centralizado com gradiente, preview do painel, faixas de cartões em movimento, abas de recursos, benefícios, processo interativo, apresentação da rede, cartões dos três papéis, exemplo de impacto, FAQ e CTA final. O verde da ONGSave substitui o azul da referência. Conteúdo e previews foram criados para os fluxos existentes; números ilustrativos aparecem identificados, sem depoimentos ou parceiros inventados.

O CSS Module está restrito à landing. O conteúdo principal continua renderizado no servidor; menu, abas, seletor de etapas e controle de movimento têm comportamento no cliente. Animações respeitam movimento reduzido e possuem opção de pausa. O FAQ usa elementos HTML nativos e o conteúdo permanece visível sem JavaScript.

A seção de pessoas usa um PNG original com transparência real, otimizado pelo componente Image do Next.js. A imagem é ilustrativa e seu uso de IA está informado no rodapé. O método, o arquivo e o prompt estão em [LANDING-ASSETS.md](LANDING-ASSETS.md).

As ilustrações decorativas de alimentos são SVGs próprios, sem interação e ocultos de leitores de tela. A interface mantém foco visível, alvos de toque confortáveis e suporte à preferência de movimento reduzido. Ícones instaláveis e a página offline acompanham a nova paleta; a versão do cache estático foi atualizada.

O trabalho altera apresentação, sem migrations ou alterações nos contratos de dados e autenticação. A revisão visual cobriu 24 capturas em 390 e 1440 px, incluindo as telas públicas e os três papéis, sem erros JavaScript ou rolagem horizontal. Os resultados automatizados desta revisão estão em [QA.md](QA.md).

O mapa usa uma adaptação local do Positron/OpenFreeMap: terreno em tons claros, parques em verde suave, água azul e nomes discretos. Marcadores em lima e verde distinguem coleta e entrega; a posição do motorista e a rota aparecem em verde escuro. O cartão concentra a contagem, a indicação de simulação e a legenda. O enquadramento reserva espaço para esse cartão e para os controles. Os créditos dos dados e do estilo permanecem acessíveis no mapa; as licenças acompanham o JSON em `public/maps/`. A geometria e a seleção das missões continuam iguais.
