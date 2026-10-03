# Identidade visual — ONGSave

A referência estética é [Sunbeam, no Land-book](https://land-book.com/websites/99614-sunbeam-the-fun-b2b-saas-template). A aplicação mantém suas páginas, navegação, conteúdos, papéis e fluxos de doação e entrega.

O refinamento usa DM Sans variável hospedada junto ao app, fundos claros, texto em carvão, verde lima e superfícies em lavanda, azul e pêssego. Botões em cápsula, cartões arredondados e espaçamento mais generoso dão unidade ao login, dashboards, formulários, gráficos, modais e telas de cada papel.

## Landing page — 3 de outubro de 2026

A landing tem como referência de composição e movimento a [Pulse AI](https://pulse-ai-one-ashy.vercel.app). Usa menu fixo em cápsula, hero centralizado com gradiente, preview do painel, faixas de cartões em movimento, abas de recursos, benefícios, processo interativo, apresentação da rede, cartões dos três papéis, exemplo de impacto, FAQ e CTA final. O verde da ONGSave substitui o azul da referência. Conteúdo e previews foram criados para os fluxos existentes; números ilustrativos aparecem identificados, sem depoimentos ou parceiros inventados.

O CSS Module está restrito à landing. O conteúdo principal continua renderizado no servidor; menu, abas, seletor de etapas e controle de movimento têm comportamento no cliente. Animações respeitam movimento reduzido e possuem opção de pausa. O FAQ usa elementos HTML nativos e o conteúdo permanece visível sem JavaScript.

A seção de pessoas usa um PNG original com transparência real, otimizado pelo componente Image do Next.js. A imagem é ilustrativa e seu uso de IA está informado no rodapé. O método, o arquivo e o prompt estão em [LANDING-ASSETS.md](LANDING-ASSETS.md).

As ilustrações decorativas de alimentos são SVGs próprios, sem interação e ocultos de leitores de tela. A interface mantém foco visível, alvos de toque confortáveis e suporte à preferência de movimento reduzido. Ícones instaláveis e a página offline acompanham a nova paleta; a versão do cache estático foi atualizada.

O trabalho altera apresentação, sem migrations ou alterações nos contratos de dados e autenticação. A revisão visual cobriu 24 capturas em 390 e 1440 px, incluindo as telas públicas e os três papéis, sem erros JavaScript ou rolagem horizontal. Os resultados automatizados desta revisão estão em [QA.md](QA.md).

O mapa usa uma adaptação local do Positron/OpenFreeMap: terreno em tons claros, parques em verde suave, água azul e nomes discretos. Marcadores em lima e lavanda distinguem coleta e entrega; a posição do motorista e a rota aparecem em verde escuro. O cartão concentra a contagem, a indicação de simulação e a legenda. O enquadramento reserva espaço para esse cartão e para os controles. Os créditos dos dados e do estilo permanecem acessíveis no mapa; as licenças acompanham o JSON em `public/maps/`. A geometria e a seleção das missões continuam iguais.
