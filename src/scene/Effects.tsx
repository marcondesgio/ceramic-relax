import { Bloom, EffectComposer, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { useGameStore } from '../store/useGameStore'

/** Pós-processamento leve; some quando o PerformanceMonitor detecta queda de fps */
export function Effects() {
  const quality = useGameStore((s) => s.quality)
  if (quality !== 'high') return null

  return (
    <EffectComposer multisampling={4}>
      <Bloom mipmapBlur luminanceThreshold={0.9} intensity={0.25} />
      <Vignette offset={0.35} darkness={0.28} />
      <ToneMapping mode={ToneMappingMode.NEUTRAL} />
    </EffectComposer>
  )
}
