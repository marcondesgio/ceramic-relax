# Ceramic Relax

Jogo web 3D relaxante de modelagem de cerâmica (React + React Three Fiber). Design em `docs/`.

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
  pottery/  profile.ts (perfil + pontos da revolução), sculpt.ts (deformações),
            PotteryMesh, SculptController (raycast + gestos), PotteryCursor
  wheel/    física do torno, SPACE, malha do torno
  ui/       telas, botões, pedal, indicador do torno, CSS do design system
  i18n/     pt.json, en.json
  store/    useGameStore (zustand)
  paint/    paintSurface (canvas + textura), brushes, stamps, paintHistory (desfazer),
            glazeMaterial (biscoito + esmalte cru), PaintController (raycast + UV)
  kiln/     Kiln (forninho), Shelf, firing.ts (linha do tempo da queima), FiringController,
            FiringEffects (calor, vapor, estrelinhas), PreviewRenderer (prévias dos cartões),
            saveImage (PNG 1080×1350 + Web Share), ResultController (girar a peça)
  audio/    synth.ts + music.ts (sons e lo-fi por síntese), sounds.ts (howler: efeitos, loops,
            música, volumes), AudioDriver (torno/argila/forno), assets.ts (arquivos opcionais)
```

## Status

- [x] Etapa 1 — base, torno e modelagem
- [x] Etapa 2 — pintura
- [x] Etapa 3 — forno e resultado
- [x] Etapa 4 — polimento e áudio (cenário final aguarda os GLB)

## Trocar sons e cenário por arquivos

- **Sons e música:** tudo é sintetizado por padrão (sem arquivos, sem licença). Para usar gravações,
  coloque os arquivos em `public/audio/` e preencha `src/audio/assets.ts`.
- **Ateliê em GLB:** coloque o arquivo em `public/models/` e preencha `src/scene/models.ts`
  (lá estão as convenções: escala, áreas livres, sombras `_cast`). Se o arquivo faltar ou falhar,
  o jogo volta sozinho para o ateliê provisório.
