import { Component, Suspense, useEffect, useMemo, type ReactNode } from 'react'
import { useGLTF } from '@react-three/drei'
import type { Mesh, Object3D } from 'three'
import { useGameStore } from '../store/useGameStore'
import { MODEL_FILES, modelUrl } from './models'
import { PlaceholderAtelier } from './PlaceholderAtelier'

/** Se o GLB falhar (arquivo faltando, corrompido), mostra o ateliê provisório */
class ModelBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error: unknown) {
    console.warn('[Ceramic Relax] não foi possível carregar o modelo do ateliê:', error)
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

/** Ateliê final em GLB, preparado para desempenho (estático, sombras baked) */
function GlbAtelier({ url }: { url: string }) {
  const { scene } = useGLTF(url)
  const quality = useGameStore((s) => s.quality)

  const prepared = useMemo(() => {
    scene.traverse((o: Object3D) => {
      const m = o as Mesh
      if (!m.isMesh) return
      m.receiveShadow = true
      m.castShadow = m.name.endsWith('_cast')
    })
    // cenário parado: calcula as matrizes uma vez e desliga a atualização por quadro
    scene.updateMatrixWorld(true)
    scene.traverse((o) => {
      o.matrixAutoUpdate = false
    })
    return scene
  }, [scene])

  // no modo econômico nada do cenário projeta sombra em tempo real
  useEffect(() => {
    prepared.traverse((o) => {
      const m = o as Mesh
      if (m.isMesh) m.castShadow = quality === 'high' && m.name.endsWith('_cast')
    })
  }, [prepared, quality])

  return <primitive object={prepared} />
}

/** Cenário do ateliê: GLB quando configurado (scene/models.ts), senão as formas provisórias */
export function Atelier() {
  const file = MODEL_FILES.atelier
  if (!file) return <PlaceholderAtelier />
  return (
    <ModelBoundary fallback={<PlaceholderAtelier />}>
      <Suspense fallback={<PlaceholderAtelier />}>
        <GlbAtelier url={modelUrl(file)} />
      </Suspense>
    </ModelBoundary>
  )
}

// começa a baixar o modelo junto com o app
if (MODEL_FILES.atelier) useGLTF.preload(modelUrl(MODEL_FILES.atelier))
