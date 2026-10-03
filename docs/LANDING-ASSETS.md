# Imagens da landing — ONGSave

## iPhone 16 e fotos das doações

As três imagens foram produzidas pela ferramenta integrada `image_gen`, com fundo fotográfico opaco. A versão atual da câmera, `public/landing/apple-ai-iphone16.png` (1024 × 1536 px), é uma edição da fotografia anterior: o aparelho passa a representar um iPhone 16 com Dynamic Island, preservando as dez maçãs e as dez detecções. O cartão de revisão também apresenta o exemplo de qualidade “Alimento em boas condições”.

Os cards de doação usam `public/landing/donation-produce.png` (caixa de hortifrúti) e `public/landing/donation-bread.png` (cesto de pães franceses), ambos de 1536 × 1024 px. Todos os arquivos são servidos pelo componente Image do Next.js e são ilustrações da landing.

### Prompts utilizados

#### Edição do iPhone 16

```text
Edit the attached target photograph. Change ONLY the smartphone hardware into a realistic BLACK base-model Apple iPhone 16 seen from the front: thin uniform bezels, rounded rectangular flat-edge aluminum frame, and the distinctive small pill-shaped Dynamic Island floating near the top center of the display, with NO broad notch touching the upper screen edge. Preserve the existing hand, counter, warm natural lighting, camera angle, portrait 2:3 composition, exactly ten red apples on the counter, and exactly ten matching apples on the phone display arranged two rows of five. Preserve one mint-green AI detection bounding box around every screen apple with numbered labels 01 through 10, ten boxes total, legible and correctly aligned. Do not add any extra apples, hands, phones or labels. Keep all ten apples and all ten boxes fully visible. Photorealistic premium product photograph. No watermark, no added branding text, no extra UI. Keep the background opaque. The provided image is the edit target; preserve everything except replacing its old notched phone with the iPhone 16 and its Dynamic Island.
```

#### Hortifrúti

```text
Use case: photorealistic-natural. Website donation-card photo for ONGSave. A shallow clean wooden produce crate full of wholesome fresh mixed supermarket produce: carrots, red tomatoes, green lettuce, zucchini, a few apples and yellow bell peppers. All produce looks intact, fresh and cared for. Editorial close-up shot from a slight overhead three-quarter angle, entire crate centered, on a clean pale cream supermarket sorting counter, soft natural daylight, subtle sage-green background softly out of focus, warm authentic textures, tasteful restrained styling. Landscape 3:2 composition with generous margins for crop into a wide rounded card. No people, no hands, no text, no logos, no watermark, no pricing stickers, no packaging branding. Opaque photographic background, not transparent.
```

#### Pães

```text
Use case: photorealistic-natural. Website donation-card photo for ONGSave, matching a premium natural food photograph in a cream and sage website. A clean shallow wicker bakery basket lined with neutral beige linen, full of golden freshly baked Brazilian pão francês bread rolls with crisp crusts and visible scoring. Several rolls arranged naturally, wholesome and cared for, no mold or damage. Close-up editorial photograph from a slight overhead three-quarter angle, entire basket centered on a clean pale cream supermarket bakery counter, warm soft daylight, gently blurred subtle cream background, realistic crust texture. Landscape 3:2 composition with generous margins for a wide rounded card crop. No people, no hands, no text, no logos, no watermark, no pricing stickers or packaging. Opaque photographic background, not transparent.
```

## Pessoas da rede

Arquivo: `public/landing/rescue-team.png`, 1536 × 1024 px, PNG RGBA com canal alfa transparente. Gerado com a ferramenta integrada `image_gen` e `transparent_background: true`. Não houve remoção de fundo ou alteração manual da imagem. Representa os três participantes da rede; as pessoas são fictícias. O arquivo é servido pelo componente Image do Next.js, com tamanhos responsivos e carregamento sob demanda.

## Prompt utilizado

```text
Use case: photorealistic-natural. Generate one premium editorial website PNG cutout with a truly transparent alpha background for ONGSave, a Brazilian food rescue app. Three adult coworkers standing closely together, photographed from waist up, warm genuine smiles, diverse ordinary Brazilian appearance with realistic skin and fabric texture. Center: a Black Brazilian female NGO coordinator about 35 with naturally curly hair, cream cotton shirt and dark sage-green apron, holding a wooden crate of fresh carrots, tomatoes and leafy vegetables at waist level. Left: a Brazilian male supermarket employee about 40, short dark hair, cream polo shirt and subtle light sage apron. Right: a Brazilian female delivery driver about 30, brown skin, dark hair tied back, olive utility overshirt over white T-shirt, holding a small plain reusable tote. All faces and hands anatomically natural, every head fully visible and generous transparent margins, no cutoff fingers or props. Cohesive warm studio daylight, polished but authentic documentary feel. No background, no floor, no backdrop, no drop shadow, no scene, no logos, no text, no watermark. Wide horizontal composition approximately 3:2, silhouettes clean and genuinely isolated on transparency, friendly confident people, no poverty imagery. Asset will sit over soft green and mint website gradients.
```

## Câmera identificando maçãs

Arquivo: `public/landing/apple-ai-camera.png`, 1024 × 1536 px, PNG fotográfico com fundo opaco. Gerado pela ferramenta integrada `image_gen`. A fotografia ilustrativa mostra exatamente dez maçãs e dez caixas de detecção numeradas na tela do celular. A landing identifica a cena como exemplo de visão de IA e mostra Maçãs, 10 unidades e peso estimado de 1,8 kg para revisão da equipe.

### Prompt utilizado

```text
Use case: photorealistic-natural. Asset: portrait editorial photograph for the ONGSave food rescue website, to sit in a narrow rounded card. Show a realistic modern unbranded smartphone camera held in one human hand, pointed down at exactly TEN red apples arranged neatly in two rows of five on a clean pale wooden supermarket sorting counter. Photograph from just behind the person so the front screen of the smartphone is clearly visible and dominates the center of the composition. The actual apples on the counter and the live camera image on the phone match in arrangement and perspective. On the phone screen, show an AI computer-vision demonstration: exactly one thin vivid mint green rectangular detection bounding box around each of the ten apples, ten boxes total, all aligned precisely to individual fruits, with small numbered green labels 01 to 10. The phone screen fills most of the image and every apple and every detection box on the screen is clearly separated and visible. Clean natural soft daylight, believable skin and hand anatomy, realistic glass screen, premium photographic detail, harmonious cream and sage environment, natural red apple skins. Portrait composition approximately 2:3 with generous safety margins so neither phone nor any screen apples or boxes are cropped. This is a product illustration, not a real capture from the app. No logos, no watermark, no brand name, no extra fruits, no extra phone, no extra fingers, no dense HUD, no long sentences. Keep the screen clear and the AI boxes unmistakable. Opaque photographic background, not transparent.
```
