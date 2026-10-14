# Ceramic Relax — guia para o Claude

Jogo web 3D relaxante de cerâmica (React + React Three Fiber). A fonte da verdade do design é
[docs/GDD.md](docs/GDD.md); o visual da interface está em `docs/Ceramic Relax — Interface.pdf`.
Leia a seção do GDD correspondente antes de mexer em qualquer fase.

## Comandos

```bash
npm run dev        # http://localhost:5173 (com --host, para testar no celular)
npm run typecheck  # tsc --noEmit
npm run build      # typecheck + build estático em dist/
```

Para ver no navegador use o preview `dev` de `.claude/launch.json`. Não há testes automatizados:
valide com `npm run typecheck` e no navegador (desktop e viewport de celular).

## Pilares (não negociáveis)

- **Relaxante:** sem tempo, sem pontuação, sem falha. Qualquer forma é válida e pode ser desfeita.
- **Nada pune o jogador:** argila seca vira craquelado bonito (nunca quebra), bolhas viram marquinhas
  artesanais (nunca explodem), água demais só amolece a parede (nada desaba). Toda peça entregue a um
  bichinho é aceita; só a intensidade da reação positiva muda. Nunca reação negativa, decepção,
  pedido para refazer ou penalidade por recusar ou faltar.
- **Estado lido pela aparência:** umidade, bolhas e progresso das etapas aparecem na própria argila
  (cor, brilho, fissuras, bolhinhas), nunca como número ou barra.
- **Fofo e tátil:** visual pastel arredondado (Animal Crossing), sem contornos pretos, som ASMR e
  vibração leve a cada ação.
- **Sem dinheiro real:** moedinhas só se ganham jogando; sem moeda paga.

## Regras de implementação

- **Uma única cena 3D.** Fases trocam a UI por cima (`src/app/App.tsx`) e a câmera se move suavemente
  (`src/scene/CameraRig.tsx`); sem telas de carregamento.
- **Estado global em zustand** (`src/store/useGameStore.ts`). Dados mutáveis por quadro (perfil,
  canvases de pintura, runtimes) ficam fora do React e são lidos no `useFrame`.
- **Geometria da peça:** perfil de 64 raios + altura + profundidade da boca (`src/pottery/profile.ts`).
  Só atualize o buffer de posições e recalcule normais; nunca recrie a geometria por quadro.
  Deformações sempre com queda gaussiana (sem pontas ou degraus).
- **Pintura:** dois canvas 1024×1024 (fora/dentro) como CanvasTexture, UV do torno (U = ângulo,
  V = altura).
- **Textos sempre via i18n** (`src/i18n/pt.json` e `en.json`), nunca strings fixas na UI. Toda chave
  nova entra nos dois arquivos. Nomes dos bichinhos são iguais em PT e EN.
- **Mobile first:** toda ação tem equivalente desktop e toque; áreas de toque ≥ 48 px; controles na
  metade de baixo no celular; `touch-action: none` no canvas; dpr máx. 2; `PerformanceMonitor`
  reduz efeitos quando o fps cai. Meta: 60 fps em celulares médios.
- **Acessibilidade:** respeitar "torno sempre ligado", "reduzir animações" e "vibração" das opções em
  toda mecânica nova (ex.: animações puláveis, alternativa a segurar tecla).
- **Desfazer:** até 20 passos na modelagem, no acabamento e na pintura.
- **Sem backend.** Site estático (Vercel). Persistência só no aparelho, em IndexedDB:
  - `src/store/persistence.ts` só lê e grava (interface `GameStorage` + adaptador IndexedDB), sem
    regra de jogo, para poder trocar por Supabase sem mexer no resto. Nada fora de `store/` acessa
    IndexedDB ou `localStorage` diretamente.
  - `src/store/saveGame.ts` liga o jogo à camada: hidrata antes da primeira tela e salva sozinho
    (jogador com debounce; peça em andamento a cada poucos segundos, ao trocar de fase e ao sair da aba;
    peça pronta vai para a prateleira ao entrar no resultado).
  - Peças são salvas como **receita** (`PieceRecipe`: perfil, PNG da pintura, acabamento, ripado, furos,
    alças, craquelado, destinatário), nunca como malha. Mecânica nova que muda a peça deve entrar na
    receita; mudança de formato sobe `RECIPE_VERSION`.
  - Toda falha de armazenamento é tolerada: o jogo segue só na sessão.
- **Conteúdo desbloqueável** (cores, carimbos, formas, argilas, ferramentas, alças, adornos, músicas,
  decoração) vem de um catálogo único; itens gratuitos do GDD continuam sempre disponíveis.

## Estilo

- Paleta base: creme `#FFF4E6`, pêssego `#FFD9C0`, sálvia `#C9DDC4`, lavanda `#D9D2F0`,
  argila crua `#E3A587`, biscoito `#EBD9C4`, texto `#6B4F3F`. Paleta de pintura em `src/paint/palette.ts`.
- UI: botões em pílula com "squish", ícones de traço grosso arredondado (`src/ui/Icons.tsx`),
  Baloo 2 (títulos) e Nunito (texto). Interface mínima: a peça é a protagonista.
- Código: TypeScript, componentes pequenos, **comentários em português**, no mesmo tom e densidade
  dos arquivos existentes.
- Áudio sintetizado por padrão (`src/audio/synth.ts`); arquivos opcionais em `src/audio/assets.ts`.

## Forma de trabalhar

- Avançar em etapas pequenas, uma por vez, testando no navegador entre elas. Não começar a próxima
  etapa sem aprovação.
- Ao mudar o design de uma mecânica, apontar a diferença em relação ao GDD em vez de decidir sozinho.
- Atualizar o README (estrutura e status) quando uma etapa terminar.
