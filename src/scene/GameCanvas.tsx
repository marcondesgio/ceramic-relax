import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import { NeutralToneMapping } from 'three'
import { useGameStore } from '../store/useGameStore'
import { PotteryCursor } from '../pottery/PotteryCursor'
import { PotteryMesh } from '../pottery/PotteryMesh'
import { potteryRuntime } from '../pottery/potteryRuntime'
import { SculptController } from '../pottery/SculptController'
import { PaintController } from '../paint/PaintController'
import { Wheel } from '../wheel/Wheel'
import { WheelController } from '../wheel/WheelController'
import { AudioDriver } from '../audio/AudioDriver'
import { Kiln } from '../kiln/Kiln'
import { Shelf } from '../kiln/Shelf'
import { FiringController } from '../kiln/FiringController'
import { FiringEffects } from '../kiln/FiringEffects'
import { PreviewRenderer } from '../kiln/PreviewRenderer'
import { ResultController } from '../kiln/ResultController'
import { StudioEnv } from '../kiln/StudioEnv'
import { Atelier } from './Atelier'
import { sceneRuntime } from './sceneRuntime'
import { CameraRig } from './CameraRig'
import { Effects } from './Effects'
import { Lights } from './Lights'

const MAX_DPR = Math.min(2, window.devicePixelRatio || 1)
// celulares começam um pouco abaixo do máximo; o PerformanceMonitor sobe se sobrar fôlego
const START_DPR = window.matchMedia('(pointer: coarse)').matches ? Math.min(1.5, MAX_DPR) : MAX_DPR

/** Cena 3D única do jogo: todas as fases acontecem aqui dentro */
export function GameCanvas() {
  const [dpr, setDpr] = useState(START_DPR)
  const setQuality = useGameStore((s) => s.setQuality)

  return (
    <Canvas
      className="game-canvas"
      shadows
      dpr={dpr}
      camera={{ fov: 40, near: 0.1, far: 60, position: [0, 2.9, 8.4] }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onCreated={(state) => {
        state.gl.toneMapping = NeutralToneMapping
        // inspeção pelo console durante o desenvolvimento
        sceneRuntime.gl = state.gl
        sceneRuntime.scene = state.scene
        if (import.meta.env.DEV) Object.assign(window, { __r3f: state, __pottery: potteryRuntime })
      }}
    >
      {/* fps caiu: baixa a resolução e desliga o pós-processamento */}
      <PerformanceMonitor
        flipflops={3}
        onDecline={() => {
          setDpr(1)
          setQuality('low')
        }}
        onIncline={() => {
          setDpr(MAX_DPR)
          setQuality('high')
        }}
        onFallback={() => {
          setDpr(1)
          setQuality('low')
        }}
      />
      <color attach="background" args={['#FFF4E6']} />
      <fog attach="fog" args={['#FFF4E6', 14, 32]} />

      <Lights />
      <Atelier />
      <Wheel />
      <PotteryMesh />
      <PotteryCursor />
      <Kiln />
      <Shelf />
      <FiringEffects />
      <StudioEnv />

      <WheelController />
      <SculptController />
      <PaintController />
      <FiringController />
      <ResultController />
      <PreviewRenderer />
      <AudioDriver />
      <CameraRig />
      <Effects />
    </Canvas>
  )
}
