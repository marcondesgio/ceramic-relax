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

O jogo tem seis etapas em sequência dentro de uma única cena 3D; a câmera se move suavemente entre elas, sem telas de carregamento.

1. **Tela inicial:** o ateliê ao fundo com o torno vazio, logo, botão "Começar", seletor PT/EN e controle de som.
2. **Preparo da argila:** o jogador escolhe a quantidade, arremessa a argila na bancada, passa o rolo e faz dobras. Quem comprou a argila preparada pode pular.
3. **Modelagem:** a bola de argila vai ao torno com um "ploft" fofo. O jogador gira, molda e hidrata com a esponja. Botão "Pronto!".
4. **Acabamento (opcional):** ripado, furos e alças na bancada. Botão "Vamos pintar!" ou "Pular acabamento".
5. **Pintura:** a argila fica com cor de biscoito e aparece a barra de ferramentas. Botão "Levar ao forno".
6. **Forno:** o jogador escolhe brilhante ou fosco, a peça entra no forno e há uma animação de 6 a 8 segundos.
7. **Resultado:** a peça sai sobre uma prateleira, girando devagar. Se estiver craquelada, aparece a opção de kintsugi. Botões "Salvar imagem", "Entregar" (se houver pedido) e "Fazer outra peça".

**Regras de navegação**

- Entre modelagem e pintura existe "Voltar a modelar", que apaga a pintura após confirmação.
- Desfazer (até 20 passos) existe na modelagem e na pintura.
- "Fazer outra peça" volta para o passo 2, sem passar pela tela inicial.
- Nada é salvo no servidor; a peça vive só na sessão até o jogador baixar a imagem.

## Fase 0 — Preparo da argila

Antes do torno, o jogador prepara a argila na bancada: escolhe a quantidade, arremessa para tirar as bolhas, passa o rolo e faz dobras até a massa ficar lisa. É uma etapa curta, de 15 a 25 segundos, pensada para ser muito satisfatória de som e toque.

**1. Escolher a quantidade**

- Um bloco de argila aparece na bancada e o jogador corta a porção com um fio, deslizando para escolher o tamanho.
- Três referências visuais ajudam: P (xícara, potinho), M (caneca, tigela) e G (vaso alto).
- Existe um mínimo, para a peça ter parede suficiente, e um máximo, para caber no torno e manter o desempenho.
- A quantidade escolhida define o volume total da peça no torno; não dá para adicionar argila depois.

**2. Arremessar na bancada (tirar as bolhas)**

- O jogador "joga" a argila contra a bancada várias vezes; cada arremesso faz um "ploft" e libera bolhinhas que estouram na superfície.
- Um sinal visual mostra o progresso: as bolhinhas vão diminuindo até sumir.
- Cerca de 5 a 8 arremessos bastam.

**3. Rolo e dobras (alisar)**

- O jogador passa o rolo para frente e para trás, achatando a massa.
- Depois dobra a massa ao meio e repete, de 2 a 3 vezes, até a argila ficar lisa e uniforme.
- Ao terminar, a massa vira uma bola lisinha e brilhante, que o jogador leva ao torno.

**Consequências suaves**

- Bolhas que restarem viram pequenas marquinhas na superfície da peça, um detalhe artesanal, nunca uma explosão no forno.
- Não existe forma errada de preparar: a etapa só termina mais rápido ou mais devagar.

**Argila preparada (lojinha)**

- Item permanente da lojinha que libera o botão "Usar argila preparada": o jogador escolhe a quantidade e pula direto para o torno.
- O preparo manual continua disponível para quem gosta da etapa.

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
- A quantidade de argila é definida na fase de preparo; no torno não é possível adicionar mais.

**Hidratação da argila**

A argila vai secando enquanto o jogador modela, e precisa ser hidratada com uma esponja. A umidade nunca aparece como número ou barra: o jogador lê o estado da argila pela aparência dela.

- **Esponja:** o jogador pega a esponja, mergulha no balde de água ao lado do torno e aperta sobre a peça; as gotas escorrem e a argila volta a brilhar.
- **Argila úmida:** cor escura, brilho suave, modela com facilidade.
- **Argila secando:** fica mais clara e opaca, e a modelagem fica um pouco mais "dura".
- **Argila seca:** surgem fissuras finas na superfície, que somem se o jogador hidratar a tempo.
- **Água demais:** a argila fica mole e a parede cede levemente, então o jogador aprende a dosar. Nada desaba por completo.
- A argila seca mais rápido com o torno girando em alta velocidade e em peças com parede fina.
- Se a peça for para o acabamento com fissuras, elas ficam registradas e aparecem como craquelado depois do forno.

**Formas iniciais (opcional)**

- Além da bola livre, o jogador pode começar de uma base pronta: tigela, caneca, vaso alto ou prato. Ajuda quem quer resultado rápido.

## Fase 1.5 — Acabamento

Depois do torno, a peça vai para a bancada e o jogador pode personalizá-la com ferramentas de acabamento antes da pintura. A etapa é opcional: o botão "Pular acabamento" leva direto à pintura.

| Ferramenta | O que faz | Como usar |
| --- | --- | --- |
| Ripador horizontal | Cria sulcos em anéis ao redor da peça | Com o torno girando, encostar a ferramenta na altura desejada |
| Ripador vertical | Cria canelado de cima a baixo, como gomos | Escolher o espaçamento e passar a ferramenta na lateral |
| Espátula de furos | Abre furos (redondo, estrela, coração, gota) | Tocar onde quer o furo; o formato vem da ponta escolhida |
| Alças | Adiciona alças para criar xícara, caneca, ânfora ou jarra | Escolher o formato, arrastar até a peça e ajustar curvatura e espessura |

**Alças**

- Formatos pré-moldados no lançamento: argola (xícara), orelha (caneca), dupla (ânfora) e alça alta (jarra).
- O jogador posiciona a alça na lateral da peça e ajusta por 3 pontos de controle: altura, abertura e espessura.
- A alça também precisa de hidratação: se a peça estiver seca demais na hora de colar, a junção aparece com uma fissura que vira craquelado.
- A alça é pintada junto com a peça na fase de pintura.

**Notas técnicas**

- O ripado horizontal é feito ondulando o próprio perfil da peça, sem custo extra.
- O ripado vertical e os furos quebram a simetria do torno: são feitos com mapas de relevo e recortes na textura, com cuidado com o desempenho no celular.
- As alças são malhas separadas, presas à superfície no ponto escolhido.
- Para salvar a peça, guarda-se só a receita: tipo e posição de cada furo, espaçamento do ripado e parâmetros de cada alça.

**Lançamento em partes**

1. Ripador horizontal e alças pré-moldadas.
2. Ripador vertical e espátula de furos.

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

**Peças craqueladas e kintsugi**

Uma peça que passou da fase de modelagem ou acabamento com fissuras nunca quebra: ela sai do forno craquelada, com linhas finas e irregulares nos pontos que secaram. O efeito é bonito por si só, não um erro.

- Na tela de resultado, aparece a opção "Restaurar com kintsugi": a técnica japonesa de consertar cerâmica com ouro.
- Uma animação curta preenche as linhas do craquelado com ouro brilhante, e a peça ganha o selo de peça rara na prateleira.
- O jogador escolhe: manter craquelada, restaurar com kintsugi ou deixar como está e decidir depois na prateleira.
- O kintsugi é gratuito e sempre disponível, para que a peça "com defeito" vire uma conquista, não uma frustração.
- Os bichinhos reagem com encanto a peças com kintsugi, como qualquer outra peça.

**Tela de resultado e salvar imagem**

- A peça fica em uma prateleira, girando devagar, com fundo do ateliê desfocado.
- O jogador pode girar a peça com o mouse ou dedo para escolher o melhor ângulo.
- "Salvar imagem" gera um PNG 1080 x 1350 (formato bom para redes sociais) com moldura suave e o logo "Ceramic Relax" pequeno no canto.
- No celular, usa o compartilhamento nativo (Web Share API) quando disponível; senão, baixa o arquivo.

## Vila dos bichinhos

O jogador é a ceramista de uma vilinha de animais brasileiros, que batem à porta do ateliê com pedidos de peças. Toda a ação continua dentro do ateliê; a vila existe pelos personagens, não por um mapa.

**Decisões fechadas**

| Tema | Decisão |
| --- | --- |
| Onde a vila aparece | Só no ateliê; os bichinhos visitam a porta |
| Elenco no lançamento | 7 bichinhos |
| Tipos de pedido | Mistura de pedidos abertos e especiais detalhados |
| Peça fora do pedido | Sempre aceita; só a reação muda |
| Ritmo | Fila livre: termina um pedido, chega o próximo |
| Recompensa | Moedinhas para a lojinha |

**Como é uma visita**

1. Ouve-se um toc-toc e a porta do ateliê se abre: o bichinho entra e para ao lado do torno.
2. Um balão de fala mostra o pedido com texto curto e um desenho simples (ex.: uma caneca azul).
3. O jogador aceita e faz a peça normalmente: modelagem, pintura e forno.
4. Na tela de resultado, aparece o botão "Entregar para \[nome\]". O bichinho reage à peça, agradece e entrega as moedinhas.
5. Depois de alguns segundos, o próximo bichinho bate à porta.

**Regras de convivência com o modo livre**

- O jogador pode recusar com "Agora não": o bichinho se despede com carinho e outro chega mais tarde, sem penalidade.
- O modo livre continua disponível a qualquer momento; peças livres vão para a prateleira e não dão moedinhas.
- Toda peça entregue também fica registrada na prateleira, com o nome de quem recebeu.

### Elenco de lançamento

Sete bichinhos da fauna brasileira, cada um com personalidade e gostos próprios, para que os pedidos tenham variedade e os jogadores tenham favoritos. Os nomes são curtos e iguais em português e inglês.

| Bichinho | Personalidade | Gosta de | Pedido aberto (exemplo) | Pedido especial (exemplo) |
| --- | --- | --- | --- | --- |
| **Capi** (capivara) | Calma, acolhedora, a "avó" da vila | Canecas, chá, tons terrosos | "Algo para o meu chá da tarde" | Caneca baixa, verde sálvia, com folhinhas |
| **Soneca** (preguiça) | Sonolenta, fala devagar, muito doce | Vasos para plantas, tons suaves | "Um cantinho para minha plantinha" | Vaso largo, azul lavanda, com estrelas |
| **Tuco** (tucano) | Festeiro, falante, exagerado | Cores fortes, listras | "Algo bem colorido para a festa!" | Vaso alto com 3 faixas: amarelo, coral e preto |
| **Mica** (mico-leão-dourado) | Curiosa, agitada, colecionadora | Peças pequenas, dourado e laranja | "Algo pequenininho para minha coleção" | Potinho baixo, laranja, com bolinhas |
| **Tatá** (tatu-bola) | Tímido, fala baixinho, fofo | Tigelas e formas redondas | "Uma coisa redondinha, se não for incômodo..." | Tigela redonda, pêssego, com corações por dentro |
| **Rosinha** (boto-cor-de-rosa) | Sonhadora, romântica | Rosa, azul céu, formas fluidas | "Algo que lembre o rio" | Vaso alto e fino, azul céu, com gotas |
| **Guará** (lobo-guará) | Elegante, reservado, gentil | Peças altas e finas, tons sóbrios | "Algo elegante para minha mesa" | Vaso alto, grafite fosco, sem estampa |

**Diretrizes de personagem**

- Todos têm corpo arredondado, olhos grandes e expressões simples, no mesmo estilo pastel do ateliê.
- Cada um tem 4 animações: chegar, esperar (com um tique próprio, como Soneca bocejando), reagir e ir embora.
- Falas curtas, de até 2 linhas, sempre gentis; cada bichinho tem um jeito de falar reconhecível.
- Novos bichinhos podem entrar depois em atualizações (ex.: arara, onça-pintada, tamanduá).

### Pedidos e reações

A peça entregue é sempre aceita: o jogo lê alguns traços da peça e escolhe uma reação mais ou menos empolgada, mas a recompensa não muda por "acertar".

**Tipos de pedido**

- **Aberto** (cerca de 3 em cada 4): pede no máximo 1 traço, como cor ou tipo de peça. Recompensa: 10 moedinhas.
- **Especial** (cerca de 1 em cada 4): pede de 2 a 3 traços (forma, cor e estampa), com um ícone de estrelinha no balão. Recompensa: 25 moedinhas, porque dá mais trabalho, não porque precisa ser exato.

**Como o jogo lê a peça**

O jogo calcula automaticamente quatro traços da peça finalizada, sem o jogador ver números:

| Traço | Como é calculado |
| --- | --- |
| Tipo de peça | Proporção entre altura e largura + abertura da boca → prato, tigela, caneca, potinho, vaso, vaso alto |
| Cor principal | A cor que cobre mais área da pintura |
| Estampa | Se há carimbos (e de qual tipo) ou faixas |
| Acabamento | Brilhante ou fosco |

**Níveis de reação**

| Traços que batem | Reação |
| --- | --- |
| Nenhum | "Que peça diferente! Adorei a surpresa." Sorriso e agradecimento |
| Alguns | "Olha só, ficou linda!" Pulinho de alegria |
| Todos | "É exatamente o que eu imaginei!" Corações e uma animação especial do personagem |

Nunca existe reação negativa, decepção ou pedido para refazer.

**Regras da fila**

- Só um bichinho por vez na porta.
- O próximo chega de 5 a 10 segundos depois da entrega, ou quando o jogador volta para a modelagem.
- O mesmo bichinho não aparece duas vezes seguidas.
- Na primeira sessão, os pedidos vêm em ordem fixa para apresentar os personagens: Capi, Tatá e Tuco.

### Moedinhas e lojinha

As moedinhas só servem para a lojinha do ateliê, que libera itens novos. A meta de ritmo é o jogador conseguir comprar um item novo a cada sessão de 10 a 15 minutos no começo, e um a cada duas ou três sessões depois.

**Catálogo inicial (cerca de 40 itens)**

| Categoria | Itens | Preço (moedinhas) |
| --- | --- | --- |
| Cores extras | 6 cores, ex.: dourado, verde-água, vinho | 30 a 60 |
| Carimbos | 10 carimbos, ex.: folha de costela-de-adão, pegadinha, lua, peixinho | 40 a 80 |
| Formas iniciais | 4 bases prontas, ex.: bule, jarra, prato fundo | 60 a 100 |
| Argilas | Terracota, porcelana, argila preta | 120 a 150 |
| Decoração do ateliê | 12 itens, ex.: luminária, tapete, rede, cortina, quadro | 50 a 150 |
| Músicas | 3 faixas lo-fi extras | 80 |
| Ferramentas de acabamento | Ripador vertical e espátula de furos com pontas de estrela, coração e gota (o ripador horizontal e o furo redondo são gratuitos) | 80 a 150 |
| Alças | Orelha, dupla e alça alta (a argola é gratuita) | 60 a 120 |
| Adornos | Borda ondulada, pezinhos, tampa com pegador, bico de jarra | 80 a 150 |
| Argila preparada | Item permanente que permite pular a fase de preparo | 200 |

**Regras**

- A lojinha mostra todos os itens desde o início, com os bloqueados em silhueta, para dar vontade de conquistar.
- Sem moeda paga e sem compra de moedinhas com dinheiro real.
- Na primeira sessão, o jogador recebe moedinhas suficientes para comprar 1 item, para conhecer a lojinha logo.

**Desafios desbloqueados pela lojinha**

Cada item comprado abre novos pedidos especiais dos bichinhos que só podem ser feitos com ele. Assim, toda compra traz uma história nova, não só uma ferramenta.

| Item comprado | Desafio que aparece (exemplo) |
| --- | --- |
| Alça orelha | Capi pede "uma caneca grande com alça, para segurar quentinha" |
| Ripador vertical | Guará pede "um vaso alto canelado, bem elegante" |
| Espátula de estrela | Soneca pede "uma luminária com furinhos de estrela, para dormir olhando o céu" |
| Cor dourada | Mica pede "um potinho dourado para a coleção" |
| Alça dupla | Rosinha pede "uma ânfora para guardar água do rio" |
| Bico de jarra | Tuco pede "uma jarra listrada para o suco da festa" |

- Os desafios entram na fila como pedidos especiais (25 moedinhas) e seguem a mesma regra: qualquer peça é aceita, só a reação muda.
- A lojinha mostra, em cada item, um ícone do bichinho cujo desafio ele libera, para despertar curiosidade.
- Os desafios concluídos ficam marcados no álbum do bichinho.

**Ponto em aberto: motivo para voltar no dia seguinte**

A fila livre é ótima para sessões longas, mas sozinha não dá motivo para voltar amanhã. Sugestões para decidir:

- **Visita especial do dia:** um pedido especial diferente por dia, com recompensa maior.
- **Plantinha que cresce em tempo real** dentro de um vaso do jogador.
- **Item da semana na lojinha**, que muda toda segunda-feira.

Nenhuma delas pune quem falta: são só convites para voltar.

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
| Escolher a quantidade de argila | Arrastar o fio de corte no bloco | Deslizar o dedo no bloco |
| Arremessar na bancada | Clicar, puxar para cima e soltar | Deslizar rápido para baixo |
| Passar o rolo / dobrar | Arrastar para frente e para trás / clique duplo | Arrastar para frente e para trás / toque duplo |
| Hidratar com a esponja | Tecla E ou clique no balde, depois segurar sobre a peça | Botão da esponja, depois segurar o dedo sobre a peça |
| Usar ferramenta de acabamento | Escolher na barra e clicar ou arrastar na peça | Escolher na barra e tocar ou arrastar na peça |
| Ajustar alça | Arrastar os 3 pontos de controle | Arrastar os 3 pontos de controle |

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
