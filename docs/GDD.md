# Ceramic Relax — Documento de Design do Jogo (GDD)

Oct 6, 2026 · @Giovanna

## Visão geral

Ceramic Relax é um jogo web 3D e relaxante onde o jogador modela um vaso no torno, pinta, leva ao forno e salva a imagem da peça pronta. Roda no navegador, no desktop e no celular, sem instalação e sem cadastro.

**Pilares**

- **Relaxante:** sem tempo, sem pontuação, sem falha. Qualquer forma é válida e pode ser desfeita.
- **Fofo:** visual pastel arredondado, inspirado em Animal Crossing, com reações suaves a cada ação.
- **Tátil:** a argila responde ao mouse ou ao dedo como na vida real, com som ASMR e leve vibração no celular.

**Decisões fechadas**

| Tema | Decisão |
| --- | --- |
| Estrutura | Sandbox livre, sem objetivos |
| Estilo visual | 3D pastel fofo, estilo Animal Crossing |
| Cenário | Ateliê aconchegante com janela e plantas |
| Torno no desktop | Segurar SPACE |
| Torno no celular | Pedal virtual com controle de velocidade |
| Pintura | Pincel com tamanhos, faixas com torno, carimbos, balde |
| Forno | Jogador escolhe acabamento brilhante ou fosco |
| Áudio | Música lo-fi + sons ASMR da argila |
| Idiomas | Português e inglês, com seletor |
| Tecnologia | React + React Three Fiber |

**Público:** adultos e jovens que buscam um momento de pausa de 5 a 15 minutos, jogadores casuais de jogos aconchegantes (cozy games).

## Fluxo do jogo

O jogo tem quatro fases em sequência dentro de uma única cena 3D; a câmera se move suavemente entre elas, sem telas de carregamento.

1. **Tela inicial:** o ateliê ao fundo com o torno vazio, logo "Ceramic Relax", botão "Começar", seletor PT/EN e controle de som.
2. **Modelagem:** uma bola de argila cai no torno com um "ploft" fofo. O jogador gira e molda. Botão "Pronto, vamos pintar!".
3. **Pintura:** a argila fica com cor de biscoito (cerâmica crua) e aparece a barra de ferramentas. Botão "Levar ao forno".
4. **Forno:** o jogador escolhe brilhante ou fosco, a peça entra no forno e há uma animação de 6 a 8 segundos.
5. **Resultado:** a peça sai brilhando sobre uma prateleira, girando devagar. Botões "Salvar imagem" e "Fazer outra peça".

**Regras de navegação**

- Entre modelagem e pintura existe "Voltar a modelar", que apaga a pintura após confirmação.
- Desfazer (até 20 passos) existe na modelagem e na pintura.
- "Fazer outra peça" volta para o passo 2, sem passar pela tela inicial.
- Nada é salvo no servidor; a peça vive só na sessão até o jogador baixar a imagem.

## Fase 1 — Modelagem

A argila só se deforma enquanto o torno gira, como na vida real: parado, o cursor apenas "toca" a peça sem mudá-la. Isso ensina a mecânica sem tutorial.

**O torno**

- Desktop: segurar SPACE acelera o torno até a velocidade máxima em cerca de 1 segundo; soltar desacelera em cerca de 1,5 segundo.
- Celular: pedal virtual no canto inferior direito. Quanto mais para cima o dedo desliza no pedal, mais rápido gira (3 níveis de velocidade perceptíveis).
- Velocidade maior deixa a deformação mais suave e uniforme; velocidade baixa gera marcas leves, que dão charme artesanal.

**Como a argila é moldada**

- A peça é um sólido de revolução: um perfil de cerca de 64 pontos (raio por altura) girado em torno do eixo.
- Mouse sobre a lateral da peça com o torno girando: empurra o raio para dentro naquela altura (afinar).
- Segurar clique esquerdo + mover: puxa o raio para fora (alargar). No celular, um dedo afina e dois dedos alargam.
- Arrastar o cursor para cima no topo da peça estica a argila (fica mais alta e mais fina); arrastar para baixo achata.
- Clicar no topo com o torno girando abre a boca do vaso (cria a cavidade interna).
- A deformação usa um pincel suave (queda gaussiana), então nunca cria pontas ou degraus.

**Limites físicos simplificados**

- Raio mínimo de parede para a peça não "quebrar"; ao chegar perto, a argila vibra levemente e para de afinar.
- O volume total de argila é aproximadamente conservado: afinar embaixo faz crescer em altura.
- Botão "Mais argila" adiciona volume (máximo de 3 vezes), para quem quiser peças maiores.
- Gotas de água: um botão de esponja deixa a argila brilhante e úmida por alguns segundos; é só visual e sonoro, puro conforto.

**Formas iniciais (opcional)**

- Além da bola livre, o jogador pode começar de uma base pronta: tigela, caneca, vaso alto ou prato. Ajuda quem quer resultado rápido.

## Fase 2 — Pintura

A pintura acontece direto sobre a peça 3D, com quatro ferramentas e uma paleta de 12 cores pastel; o torno continua disponível e muda o comportamento de algumas ferramentas.

| Ferramenta | Torno parado | Torno girando |
| --- | --- | --- |
| Pincel (P, M, G) | Pinta onde o cursor ou dedo toca | Pinta um anel contínuo naquela altura |
| Faixas | Não se aplica | Segurar e mover para cima/baixo cria faixas largas e retas, como o pincel encostado no vaso girando |
| Carimbos | Aplica um carimbo (estrela, coração, flor, gota, folha, bolinha) | Repete o carimbo ao redor da peça em intervalos iguais |
| Balde | Pinta a peça inteira (exterior ou interior) | Mesmo efeito, com animação da cor "escorrendo" |

**Paleta de cores**

- 12 cores fixas em tons pastel: branco creme, rosa, coral, pêssego, amarelo manteiga, verde menta, verde sálvia, azul céu, azul lavanda, lilás, marrom caramelo e grafite suave.
- Sem seletor livre de cor, para manter a harmonia visual e a simplicidade.

**Detalhes de conforto**

- Borracha incluída como quinta ferramenta discreta, voltando à cor de biscoito.
- As cores ficam levemente opacas antes do forno, como esmalte cru; o forno revela a cor final vibrante. Isso cria o momento de surpresa.
- A camada interna do vaso pode ser pintada separadamente (alternância "Fora / Dentro").

## Fase 3 — Forno e resultado

O jogador escolhe brilhante ou fosco, assiste a uma animação curta e recebe a peça pronta para salvar como imagem.

**Escolha do acabamento**

- Dois cartões grandes com prévia da peça: "Brilhante" (reflexo marcado, aspecto vitrificado) e "Fosco" (aspecto aveludado, sem reflexo).
- Tecnicamente, muda apenas os parâmetros do material: rugosidade baixa + clearcoat no brilhante; rugosidade alta no fosco.

**Animação do forno (6 a 8 segundos)**

1. A peça desliza até um forninho redondo e fofo no canto do ateliê; a porta fecha.
2. A janelinha do forno brilha de laranja para dourado, com partículas de calor e um termômetro sorridente subindo.
3. Um "ding" suave toca, a porta abre com uma nuvem de vapor.
4. A peça sai com a cor final vibrante e um brilho de estrelinhas.

O jogador pode tocar na tela para pular a animação.

**Tela de resultado e salvar imagem**

- A peça fica em uma prateleira, girando devagar, com fundo do ateliê desfocado.
- O jogador pode girar a peça com o mouse ou dedo para escolher o melhor ângulo.
- "Salvar imagem" gera um PNG 1080 x 1350 (formato bom para redes sociais) com moldura suave e o logo "Ceramic Relax" pequeno no canto.
- No celular, usa o compartilhamento nativo (Web Share API) quando disponível; senão, baixa o arquivo.

## Controles

Toda ação tem equivalente no desktop e no celular; no celular, a tela fica em modo retrato com os controles na metade de baixo, ao alcance do polegar.

| Ação | Desktop | Celular |
| --- | --- | --- |
| Girar o torno | Segurar SPACE | Pedal virtual; deslizar para cima aumenta a velocidade |
| Afinar a argila | Passar o mouse na lateral (hover) | Um dedo arrastando na lateral |
| Alargar a argila | Clique esquerdo + mover | Dois dedos na lateral |
| Esticar / achatar | Arrastar no topo para cima / baixo | Arrastar no topo para cima / baixo |
| Abrir a boca do vaso | Clique no topo com torno girando | Toque no topo com torno girando |
| Pintar / carimbar | Clique na peça | Toque na peça |
| Girar a câmera | Clique direito + arrastar | Botão de câmera + arrastar |
| Zoom | Roda do mouse | Pinça com dois dedos (fora da peça) |
| Desfazer | Ctrl + Z | Botão de desfazer |
| Trocar ferramenta | Teclas 1 a 5 | Barra inferior de ícones |

**Acessibilidade**

- Opção "Torno sempre ligado" para quem não consegue segurar uma tecla ou o pedal.
- Botões com no mínimo 48 px de área de toque.
- Opção de reduzir animações e de desligar a vibração.

## Direção de arte, áudio e idiomas

Tudo deve parecer macio, arredondado e quentinho: formas sem quinas, cores pastel dessaturadas e luz de fim de tarde.

**Cenário: o ateliê**

- Sala pequena e acolhedora vista em 3/4, com o torno no centro.
- Janela grande ao fundo com luz dourada entrando e cortina leve balançando.
- Plantas em vasos (feitos de cerâmica, claro), prateleiras com peças fofas, um tapete redondo e um gatinho dormindo que às vezes mexe a orelha.
- Pequenas animações de ambiente: folhas balançando, poeira dourada no feixe de luz, nuvens passando pela janela.

**Paleta e materiais**

- Fundo: creme (#FFF4E6), pêssego (#FFD9C0), sálvia (#C9DDC4), lavanda (#D9D2F0).
- Madeira em mel claro; argila crua em terracota rosada (#E3A587); biscoito em bege (#EBD9C4).
- Sombreado suave com luz ambiente alta, sombras macias e sem contornos pretos.

**Interface**

- Botões em formato de pílula, cantos bem arredondados, leve sombra e animação "squish" ao toque.
- Ícones desenhados em traço grosso e arredondado; tipografia arredondada (sugestão: Nunito ou Baloo 2).
- Interface mínima: a peça é a estrela, a UI aparece só quando necessária.

**Áudio**

- Música lo-fi instrumental em loop, volume baixo, de 2 a 3 faixas que se alternam.
- Sons ASMR: zumbido suave do torno (o tom sobe com a velocidade), argila úmida "squish" ao moldar, pincel, "pop" do carimbo, crepitar do forno e o "ding" final.
- Controles separados de volume para música e efeitos; o jogo começa sem som até o primeiro toque (regra dos navegadores).

**Idiomas**

- Português e inglês, com seletor na tela inicial e no menu de opções.
- Idioma inicial detectado pelo navegador; a escolha fica salva no próprio aparelho.
- Todos os textos ficam em arquivos de tradução separados (pt.json e en.json).

## Arquitetura técnica

O jogo é uma aplicação estática (sem backend) feita em React + React Three Fiber, empacotada com Vite e publicável em qualquer hospedagem estática como Vercel ou Netlify.

**Bibliotecas**

| Necessidade | Biblioteca |
| --- | --- |
| Renderização 3D | three, @react-three/fiber |
| Utilitários 3D (câmera, ambiente, sombras suaves) | @react-three/drei |
| Pós-processamento (bloom, profundidade de campo) | @react-three/postprocessing |
| Estado global | zustand |
| Animações de câmera e UI | @react-spring/three, framer-motion |
| Áudio | howler |
| Tradução | i18next, react-i18next |
| Linguagem | TypeScript |

**Estrutura de pastas**

```
src/
  app/            App.tsx, roteamento de fases
  scene/          Atelier.tsx, Lights.tsx, CameraRig.tsx
  pottery/        PotteryMesh.tsx, profile.ts, sculpt.ts
  wheel/          Wheel.tsx, useWheelInput.ts
  paint/          PaintLayer.tsx, brushes.ts, stamps/
  kiln/           Kiln.tsx, firing.ts
  ui/             Toolbar, Pedal, Buttons, Settings
  audio/          sounds.ts, music.ts
  i18n/           pt.json, en.json
  store/          useGameStore.ts
```

**Geometria da peça**

- O estado da forma é um array de cerca de 64 raios (um por faixa de altura) + altura total + profundidade da boca.
- A malha é gerada com LatheGeometry a partir desse perfil, com parede externa, borda arredondada e parede interna.
- A cada quadro com deformação, só o array de posições é atualizado e as normais são recalculadas; nada de recriar a geometria.
- O ponto tocado é obtido por raycast na malha; a altura do toque define quais raios mudam.

**Pintura**

- A pintura é desenhada em um canvas 2D de 1024 x 1024 usado como textura (CanvasTexture), mapeado pelas coordenadas UV do torno (U = ângulo, V = altura).
- Por isso, faixas e anéis são retas horizontais simples no canvas, e a repetição de carimbos é só desenhar em vários valores de U.
- Interior e exterior usam dois canvas separados.

**Forno e captura**

- O acabamento troca o material para MeshPhysicalMaterial com rugosidade e clearcoat diferentes.
- A imagem é capturada renderizando a cena em um render target de 1080 x 1350 e convertendo para PNG.

**Desempenho no celular**

- Meta de 60 fps em celulares médios dos últimos 4 anos.
- Limitar a resolução (dpr no máximo 2), sombras pré-calculadas (baked) para o cenário e cenário em low-poly.
- Reduzir pós-processamento automaticamente quando o fps cair (PerformanceMonitor do drei).
- Bloquear rolagem e zoom da página durante o jogo (touch-action: none).

## Prompt para criação do design

São três prompts: um para a interface completa (Claude Design, Figma AI ou similar) e dois para imagens de referência (Midjourney, DALL-E ou similar). Os prompts de imagem estão em inglês porque essas ferramentas respondem melhor assim.

**Prompt 1 — Interface e telas (UI/UX)**

```
Crie o design de interface do jogo web "Ceramic Relax", um jogo 3D relaxante e fofo de modelagem de cerâmica, no estilo pastel aconchegante de Animal Crossing.

Contexto: o jogador molda argila em um torno (segurando SPACE no desktop ou um pedal virtual no celular), pinta a peça, escolhe acabamento brilhante ou fosco, leva ao forno e salva uma imagem da peça final. Sem pontuação, sem tempo, sem falha.

Crie as telas em duas versões, desktop (1440x900) e celular retrato (390x844):
1. Tela inicial: ateliê ao fundo, logo "Ceramic Relax", botão Começar, seletor PT/EN, ícone de som.
2. Modelagem: peça no centro, indicador de velocidade do torno, botões Desfazer, Mais argila, Esponja, Formas iniciais e "Pronto, vamos pintar!". No celular, pedal virtual no canto inferior direito com 3 níveis de velocidade.
3. Pintura: barra de ferramentas (Pincel P/M/G, Faixas, Carimbos, Balde, Borracha), paleta de 12 cores pastel, alternância Fora/Dentro, botão "Levar ao forno".
4. Escolha do forno: dois cartões grandes, Brilhante e Fosco, com prévia.
5. Resultado: peça em uma prateleira, botões "Salvar imagem" e "Fazer outra peça".
6. Menu de opções: volume de música e efeitos, idioma, torno sempre ligado, reduzir animações, vibração.

Estilo visual:
- Paleta: creme #FFF4E6, pêssego #FFD9C0, sálvia #C9DDC4, lavanda #D9D2F0, terracota rosada #E3A587, bege biscoito #EBD9C4, texto em marrom suave #6B4F3F.
- Botões em pílula, cantos muito arredondados (16 a 24 px), sombra suave, estados de toque com efeito "squish".
- Ícones de traço grosso e arredondado, fofos, com pequenas expressões quando fizer sentido (forno e termômetro sorridentes).
- Tipografia arredondada: Baloo 2 para títulos, Nunito para textos.
- Interface mínima: a peça 3D é a protagonista; a UI fica nas bordas e some quando não é usada.
- Áreas de toque de no mínimo 48 px no celular; controles ao alcance do polegar na metade inferior.

Entregue também: um mini design system com cores, tipografia, botões, ícones, cartões e a paleta de 12 cores de pintura (branco creme, rosa, coral, pêssego, amarelo manteiga, verde menta, verde sálvia, azul céu, azul lavanda, lilás, marrom caramelo, grafite suave).
```

**Prompt 2 — Arte de referência do cenário**

```
Cozy tiny pottery studio interior, isometric 3/4 view, cute pastel 3D style inspired by Animal Crossing, soft rounded low-poly shapes, a pottery wheel in the center with a pink terracotta clay ball, big window with warm golden afternoon light and a light curtain, potted plants in handmade ceramic pots, wooden shelves with cute small vases, round rug, a sleeping orange cat, small round cute kiln in the corner, soft ambient occlusion, gentle shadows, pastel cream, peach, sage green and lavender palette, warm, calm, relaxing mood, no text, no people, high quality 3D render, Blender, octane --ar 16:9
```

**Prompt 3 — Arte de referência das peças finais**

```
Collection of cute handmade ceramic pieces on a wooden shelf: small vase, mug, bowl and tall vase, painted in pastel colors with simple stripes, little hearts, stars and flowers, half glossy glazed and half matte finish, soft studio lighting, warm cozy pastel 3D style inspired by Animal Crossing, rounded chubby shapes, gentle reflections, cream background, high quality 3D render --ar 4:5
```

## Prompt para criação do código

O código deve ser construído em etapas, não de uma vez: um prompt principal define o projeto e a etapa 1, e os prompts seguintes avançam uma fase por vez, testando no navegador entre elas. Funciona melhor no Claude Code, que cria e testa os arquivos do projeto.

**Prompt principal (contexto + etapa 1)**

```
Você vai me ajudar a construir "Ceramic Relax", um jogo web 3D relaxante e fofo de modelagem de cerâmica que roda no navegador, no desktop e no celular.

STACK: React + TypeScript + Vite, three, @react-three/fiber, @react-three/drei, @react-three/postprocessing, zustand, @react-spring/three, howler, i18next/react-i18next. Sem backend; deve ser publicável como site estático.

FLUXO: Tela inicial → Modelagem → Pintura → Forno (escolha brilhante/fosco + animação) → Resultado (salvar PNG) → Fazer outra peça. Tudo em uma única cena 3D, com transições suaves de câmera entre as fases. Estado global em zustand com a fase atual, o perfil da peça, as texturas de pintura, o acabamento e as configurações.

ESTRUTURA DE PASTAS: src/app, src/scene, src/pottery, src/wheel, src/paint, src/kiln, src/ui, src/audio, src/i18n, src/store.

REGRAS GERAIS:
- Visual pastel fofo estilo Animal Crossing: formas arredondadas, luz quente, sombras suaves, sem contornos pretos.
- Cores base: creme #FFF4E6, pêssego #FFD9C0, sálvia #C9DDC4, lavanda #D9D2F0, argila #E3A587, biscoito #EBD9C4.
- Textos sempre via i18n (pt.json e en.json); idioma inicial pelo navegador.
- Mobile first: touch-action none no canvas, dpr máximo 2, PerformanceMonitor para reduzir efeitos se o fps cair, áreas de toque de 48 px.
- Código limpo, componentes pequenos, comentários em português.

ETAPA 1 — base + torno + modelagem:
1. Crie o projeto com a cena 3D, luzes, câmera e um ateliê provisório com formas simples (chão, parede, janela, mesa do torno).
2. Torno: a velocidade sobe até o máximo em cerca de 1 s segurando SPACE e desce em cerca de 1,5 s ao soltar. No celular, um pedal virtual no canto inferior direito: deslizar o dedo para cima aumenta a velocidade (0 a 100%).
3. Peça: perfil de 64 raios por altura + altura total + profundidade da boca, gerando uma malha de revolução (LatheGeometry) com parede externa, borda arredondada e parede interna. Atualize só o buffer de posições e recalcule normais a cada deformação.
4. Modelagem por raycast, que só deforma com o torno girando:
   - hover/arrastar um dedo na lateral afina o raio naquela altura;
   - clique esquerdo + mover, ou dois dedos, alarga;
   - arrastar no topo para cima estica, para baixo achata;
   - clique/toque no topo abre a boca.
   Use queda gaussiana na deformação, raio mínimo de parede e conservação aproximada de volume.
5. Desfazer com até 20 passos (Ctrl+Z e botão).
6. Botão "Pronto, vamos pintar!" que apenas troca a fase por enquanto.

Ao terminar, explique como rodar o projeto e o que devo testar no desktop e no celular. Não avance para a pintura até eu pedir.
```

**Prompt da etapa 2 — Pintura**

```
Etapa 2 — Pintura. Ao entrar na fase, a peça fica cor de biscoito (#EBD9C4). Pinte em dois canvas 2D de 1024x1024 (exterior e interior) usados como CanvasTexture, mapeados por UV do torno (U = ângulo, V = altura). Ferramentas: Pincel (P/M/G), Faixas, Carimbos (estrela, coração, flor, gota, folha, bolinha, desenhados em vetor), Balde e Borracha. Com o torno girando, o pincel pinta anéis, faixas criam listras retas e carimbos se repetem ao redor da peça. Paleta fixa de 12 cores pastel. Alternância Fora/Dentro. Antes do forno, as cores aparecem levemente opacas, como esmalte cru. Desfazer também funciona na pintura. Botão "Voltar a modelar" (com confirmação, apaga a pintura) e "Levar ao forno".
```

**Prompt da etapa 3 — Forno, resultado e imagem**

```
Etapa 3 — Forno e resultado. Tela com dois cartões, Brilhante e Fosco, com prévia. Use MeshPhysicalMaterial: brilhante = rugosidade baixa + clearcoat; fosco = rugosidade alta. Animação de 6 a 8 s: a peça desliza até um forno redondo e fofo, a porta fecha, a janelinha brilha de laranja para dourado com partículas, toca um ding, a porta abre com vapor e a peça sai com cores vibrantes e estrelinhas. Toque na tela pula a animação. Resultado: peça em uma prateleira, girando devagar, que o jogador pode girar. "Salvar imagem" renderiza em render target 1080x1350 com moldura suave e logo pequeno, e baixa um PNG; no celular, usa a Web Share API quando disponível. "Fazer outra peça" reinicia na modelagem.
```

**Prompt da etapa 4 — Polimento, áudio e cenário final**

```
Etapa 4 — Polimento. Áudio com howler: música lo-fi em loop baixo e sons ASMR (zumbido do torno com tom ligado à velocidade, argila úmida ao moldar, pincel, pop do carimbo, crepitar do forno, ding). Volume separado de música e efeitos; o áudio só inicia após o primeiro toque. Vibração leve no celular ao moldar (desligável). Tela inicial com logo, Começar, seletor PT/EN. Menu de opções: volumes, idioma, torno sempre ligado, reduzir animações, vibração. UI com botões em pílula e animação squish, fontes Baloo 2 e Nunito. Substitua o ateliê provisório pelos modelos finais (GLB) que vou fornecer, mantendo o desempenho de 60 fps em celulares médios.
```

## Roadmap e próximos passos

O MVP é a etapa 1 a 3 do código com cenário provisório: já dá para modelar, pintar, queimar e salvar a imagem. Áudio, cenário final e polimento entram depois.

- [ ] Gerar referências visuais com os prompts de design e escolher a direção final
- [ ] Etapa 1 do código: base, torno e modelagem; testar a sensação da argila no desktop e no celular
- [ ] Etapa 2: pintura
- [ ] Etapa 3: forno, resultado e salvar imagem (fim do MVP)
- [ ] Modelar ou encomendar os modelos 3D finais do ateliê (GLB, low-poly)
- [ ] Escolher músicas lo-fi e sons ASMR com licença livre para uso
- [ ] Etapa 4: polimento, áudio e cenário final
- [ ] Testar em pelo menos 3 celulares (Android médio, iPhone, tablet) e publicar

**Ideias para depois (fora do escopo atual)**

- Galeria local das peças já feitas.
- Mais carimbos e paletas sazonais.
- Link de compartilhamento da peça em 3D.
