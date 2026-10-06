import { useGameStore } from '../store/useGameStore'

/** Luz quente de fim de tarde: ambiente alta + sol suave com sombras macias */
export function Lights() {
  const quality = useGameStore((s) => s.quality)
  const mapSize = quality === 'high' ? 1024 : 512

  return (
    <>
      <hemisphereLight args={['#FFF6EA', '#E8CDB0', 1.6]} />
      <directionalLight
        position={[-3.5, 7, 5]}
        intensity={1.9}
        color="#FFE6CC"
        // modo econômico (fps caiu): sem sombra em tempo real
        castShadow={quality === 'high'}
        shadow-mapSize={[mapSize, mapSize]}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-3}
        shadow-camera-near={1}
        shadow-camera-far={22}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
      />
      {/* preenchimento lavanda do lado oposto, para as sombras não ficarem pesadas */}
      <directionalLight position={[5, 3, 3]} intensity={0.45} color="#E6DEFF" />
    </>
  )
}
