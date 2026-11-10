import { Suspense, forwardRef, useImperativeHandle, useMemo, useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import type { Group, Mesh } from 'three'
import { CHARACTER_FILES, DRACO_PATH, modelUrl } from '../scene/models'
import { ModelBoundary } from '../scene/Atelier'
import { AnimalModel, type AnimalParts } from './AnimalModel'
import { LOOKS, ANIMALS, type AnimalId } from './animals'

// Bichinho da vila: usa o modelo final (GLB) quando existe; senão, ou se o arquivo falhar,
// volta para o provisório feito de formas simples. O modelo final é uma malha só (sem esqueleto),
// então só o corpo inteiro é animável: cabeça, orelhas e rabo ficam nulos e a cena
// traduz esses tiques em balanços do corpo.

type Props = { id: AnimalId }

export const CharacterModel = forwardRef<AnimalParts, Props>(function CharacterModel({ id }, ref) {
  const file = CHARACTER_FILES[id]
  if (!file) return <AnimalModel ref={ref} id={id} />
  return (
    <ModelBoundary fallback={<AnimalModel ref={ref} id={id} />}>
      <Suspense fallback={null}>
        <GlbCharacter ref={ref} id={id} url={modelUrl(file)} />
      </Suspense>
    </ModelBoundary>
  )
})

const GlbCharacter = forwardRef<AnimalParts, Props & { url: string }>(function GlbCharacter({ id, url }, ref) {
  const { scene } = useGLTF(url, DRACO_PATH)
  const body = useRef<Group>(null)
  // cópia própria: o mesmo bichinho pode voltar outro dia sem disputar a malha do cache
  const model = useMemo(() => {
    const c = scene.clone(true)
    c.traverse((o) => {
      const m = o as Mesh
      if (m.isMesh) {
        m.castShadow = true
        m.receiveShadow = true
      }
    })
    return c
  }, [scene])

  useImperativeHandle(ref, () => ({
    get body() {
      return body.current
    },
    head: null,
    ears: null,
    tail: null,
    eyes: [],
  }))

  return (
    <group ref={body}>
      {/* o GLB tem altura 1: a altura de cada espécie vem do visual (LOOKS) */}
      <primitive object={model} scale={LOOKS[id].height} />
    </group>
  )
})

/** Baixa os modelos finais em segundo plano, para a primeira visita já entrar pronta */
export function preloadCharacters() {
  for (const id of ANIMALS) {
    const file = CHARACTER_FILES[id]
    if (file) useGLTF.preload(modelUrl(file), DRACO_PATH)
  }
}
