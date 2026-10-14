# Ceramic Relax

Jogo web 3D relaxante de modelagem de cerâmica (React + React Three Fiber). Design em `docs/`.

Jogue agora: https://ceramic-relax.vercel.app/

## Rodar

```bash
npm install
npm run dev        # http://localhost:5173 (e o IP da rede local, para testar no celular)
npm run build      # gera dist/, publicável em qualquer hospedagem estática
npm run preview    # serve o build localmente
```

## Estrutura

```
src/
  app/      App.tsx (troca de interface por fase), atalhos
  scene/    GameCanvas, Atelier (provisório), Lights, CameraRig, Effects
  prep/     preparo da argila: prep.ts (regras), prepRuntime (medidas + estado por quadro),
            PrepController (gestos e física), PrepBench (bloco, fio, bolhas, rolo na bancada)
  pottery/  profile.ts (perfil + pontos da revolução), sculpt.ts (deformações),
            PotteryMesh, SculptController (raycast + gestos), PotteryCursor,
            clayMarks (relevo: marquinhas das bolhas e ripado vertical), holes (furos da espátula), hydration (umidade, secagem, fissuras),
            crackShader (aparência da umidade e linhas de fissura), sponge + HydrationController
            (esponja e balde), SpongeStation (balde, esponja e gotinhas)
  finishing/ acabamento: rib.ts (ripador horizontal no perfil), handles.ts (formas, tubos, pontos
            de controle), PieceHandles (alças na peça), FinishingController (gestos)
  village/  vila dos bichinhos: animals.ts (elenco, pedidos, visual), traits.ts (leitura da peça),
            village.ts (fila, aceitar, recusar, entregar), VillageController (etapas da visita),
            VillageScene + AnimalModel (porta e bichinhos provisórios)
  shop/     catalog.ts (50 itens, preços, desafios, "em breve"), unlocks.ts (o que cada compra libera),
            items.ts (ids usados pelo jogo)
  wheel/    física do torno, SPACE, malha do torno
  ui/       telas, botões, pedal, indicador do torno, CSS do design system
  i18n/     pt.json, en.json
  store/    useGameStore (zustand), persistence (salvar/carregar: IndexedDB, trocável),
            saveGame (abertura com o jogo salvo + salvamento automático)
  paint/    paintSurface (canvas + textura), brushes, stamps, paintHistory (desfazer),
            glazeMaterial (biscoito + esmalte cru), PaintController (raycast + UV)
  kiln/     Kiln (forninho), Shelf, firing.ts (linha do tempo da queima), FiringController,
            FiringEffects (calor, vapor, estrelinhas), PreviewRenderer (prévias dos cartões),
            saveImage (PNG 1080×1350 + Web Share), ResultController (girar a peça),
            KintsugiController (ouro nas linhas do craquelado)
  audio/    synth.ts + music.ts (sons e lo-fi por síntese), sounds.ts (howler: efeitos, loops,
            música, volumes), AudioDriver (torno/argila/forno), assets.ts (arquivos opcionais)
```

## Status

- [x] Etapa 1 — base, torno e modelagem
- [x] Etapa 2 — pintura
- [x] Etapa 3 — forno e resultado
- [x] Etapa 4 — polimento e áudio (cenário final aguarda os GLB)
- [x] Etapa A — salvamento local (prateleira, moedinhas, itens, configurações e peça em andamento)
- [x] Etapa B — preparo da argila (quantidade, arremessos e bolhas, rolo e dobras)
- [x] Etapa C — hidratação no torno, craquelado no forno e kintsugi no resultado
- [x] Etapa D — acabamento parte 1 (ripador horizontal e alças pré-moldadas)
- [x] Etapa E — vila dos bichinhos (7 personagens provisórios, pedidos, reações e moedinhas)
- [x] Etapa F — lojinha e desafios (cores, carimbos, ripado vertical, furos, alças, argila preparada)

## Trocar sons e cenário por arquivos

- **Sons e música:** tudo é sintetizado por padrão (sem arquivos, sem licença). Para usar gravações,
  coloque os arquivos em `public/audio/` e preencha `src/audio/assets.ts`.
- **Ateliê em GLB:** coloque o arquivo em `public/models/` e preencha `src/scene/models.ts`
  (lá estão as convenções: escala, áreas livres, sombras `_cast`). Se o arquivo faltar ou falhar,
  o jogo volta sozinho para o ateliê provisório.
