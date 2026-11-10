// Modelos finais do cenário (GLB). Enquanto um caminho estiver vazio, o jogo usa o ateliê
// provisório feito com formas simples (PlaceholderAtelier).
//
// Como entregar o ateliê:
// - Arquivo em public/models/ e o caminho aqui, relativo à pasta public (ex.: 'models/atelier.glb').
// - Y para cima, 1 unidade = 10 cm, chão em y = 0, parede do fundo por volta de z = -4,6.
// - Deixe livres as áreas usadas pela jogabilidade (feitas em código):
//     torno ............ círculo de raio 2 em volta da origem
//     forno ............ em torno de (3,6; 0; -1,7)
//     prateleira ....... em torno de (-2,9; 1,35; 0,6), 2,4 × 1,1
//     porta ............ parede do fundo em x ≈ 0,9 (vão de 2,4 × 5,1, até o topo da janela), feita em código
//     bichinhos ........ ~2,4 de altura; caminho da porta até (-2,2; 0; -2,0) e até (-3,9; 0; -1,0)
// - Sombras pré-calculadas (baked) nas texturas: por padrão as malhas só RECEBEM sombra.
//   Para uma malha também projetar sombra em tempo real, termine o nome com "_cast".
// - Para o celular: low-poly, poucas texturas (até 1024 px, de preferência KTX2/WebP),
//   compressão Draco ou Meshopt (o carregador já entende os dois).

export const MODEL_FILES: { atelier: string | null } = {
  atelier: null,
}

/**
 * Bichinhos da vila (GLB otimizado a partir dos OBJ de docs/characters).
 * Convenção: pés em y = 0, altura 1, olhando para +z, uma malha só (sem esqueleto).
 * Quem não tem arquivo usa o bichinho provisório feito em código (village/AnimalModel).
 */
export const CHARACTER_FILES: Record<string, string | null> = {
  capi: 'models/characters/capi.glb',
  tata: 'models/characters/tata.glb',
  tuco: 'models/characters/tuco.glb',
  rosinha: 'models/characters/rosinha.glb',
  guara: 'models/characters/guara.glb',
  soneca: 'models/characters/soneca.glb',
  mica: null, // fora do elenco por enquanto (ver ANIMALS em village/animals.ts)
}

export function modelUrl(path: string) {
  return import.meta.env.BASE_URL + path
}

/** Decodificador Draco servido pelo próprio site (cópia de three/examples/jsm/libs/draco/gltf) */
export const DRACO_PATH = import.meta.env.BASE_URL + 'draco/'
