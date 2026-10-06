// Arquivos de áudio opcionais. Sem arquivo, o jogo usa os sons sintetizados (synth.ts/music.ts).
// Para trocar por gravações de verdade: coloque o arquivo em public/audio/ e preencha o caminho
// (relativo à pasta public, sem "/" no começo). Formatos: mp3 ou ogg (de preferência os dois).
//
// Exemplo:
//   music: ['audio/lofi-1.mp3', 'audio/lofi-2.mp3'],
//   ding: 'audio/ding.mp3',

export type EffectId = 'squish' | 'brush' | 'pop' | 'ding' | 'pour'
export type LoopId = 'wheel' | 'clay' | 'kiln'

export const AUDIO_FILES: {
  music: string[]
  effects: Partial<Record<EffectId | LoopId, string>>
} = {
  music: [],
  effects: {},
}

/** Caminho final respeitando a base do site (publicação em subpasta) */
export function assetUrl(path: string) {
  return import.meta.env.BASE_URL + path
}
