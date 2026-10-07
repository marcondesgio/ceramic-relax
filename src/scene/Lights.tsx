import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { DirectionalLight, HemisphereLight, PointLight } from 'three'
import { useGameStore } from '../store/useGameStore'
import { timeRuntime } from './timeOfDay'

/**
 * Luz do ateliê acompanha o horário: rosada no amanhecer, dourada no entardecer
 * e luar azulado com um abajur quentinho à noite. Sombras macias do "sol".
 */
export function Lights() {
  const quality = useGameStore((s) => s.quality)
  const mapSize = quality === 'high' ? 1024 : 512
  const hemi = useRef<HemisphereLight>(null)
  const sun = useRef<DirectionalLight>(null)
  const fill = useRef<DirectionalLight>(null)
  const lamp = useRef<PointLight>(null)

  useFrame(() => {
    const p = timeRuntime.palette
    if (hemi.current) {
      hemi.current.color.copy(p.hemiSky)
      hemi.current.groundColor.copy(p.hemiGround)
      hemi.current.intensity = p.hemiIntensity
    }
    if (sun.current) {
      sun.current.color.copy(p.sunLight)
      sun.current.intensity = p.sunIntensity
      // o sol (ou a lua) muda de lado: as sombras andam pelo chão ao longo do dia
      sun.current.position.set(p.sunLightX, p.sunLightY + 2.5, 5)
    }
    if (fill.current) {
      fill.current.color.copy(p.fill)
      fill.current.intensity = p.fillIntensity
    }
    if (lamp.current) lamp.current.intensity = p.lamp * 12
  })

  return (
    <>
      <hemisphereLight ref={hemi} args={['#FFF6EA', '#E8CDB0', 1.6]} />
      <directionalLight
        ref={sun}
        position={[-3.5, 7, 5]}
        intensity={1.9}
        color="#FFE6CC"
        // modo econômico (fps caiu): sem sombra em tempo real
        castShadow={quality === 'high'}
        shadow-mapSize={[mapSize, mapSize]}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={7}
        shadow-camera-bottom={-3}
        shadow-camera-near={1}
        shadow-camera-far={24}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
      />
      {/* preenchimento do lado oposto, para as sombras não ficarem pesadas */}
      <directionalLight ref={fill} position={[5, 3, 3]} intensity={0.45} color="#E6DEFF" />
      {/* abajur quentinho que acende ao anoitecer (fonte acima da prateleira) */}
      <pointLight ref={lamp} position={[0.4, 4.6, -1.6]} color="#FFC98A" intensity={0} distance={14} decay={1.2} />
    </>
  )
}
