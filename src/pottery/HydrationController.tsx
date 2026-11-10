import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Raycaster, Vector3, type Mesh, type PerspectiveCamera } from 'three'
import { useGameStore } from '../store/useGameStore'
import { glazeUniforms } from '../paint/glazeMaterial'
import { haptic } from '../app/haptics'
import { playEffect } from '../audio/sounds'
import { setRayFromClient } from './pick'
import { potteryRuntime } from './potteryRuntime'
import { relaxVolume } from './sculpt'
import { INNER_POINT_COUNT, OUTER_POINT_COUNT } from './profile'
import { hydrationRuntime, isDrying, recordCrackle, sampleAt, stepDrying, wetAt } from './hydration'
import { MAX_DROPS, dipSponge, spongeRuntime as sp, toggleSponge } from './sponge'

// Hidratação no torno e no acabamento: a argila seca aos poucos e a esponja molha.
// Desktop: tecla E ou clique no balde, depois segurar o clique sobre a peça.
// Celular: botão da esponja, depois segurar o dedo sobre a peça.
// Também escreve a umidade e as fissuras nos vértices da peça (a aparência mostra o estado)
// e grava as fissuras na receita quando a peça sai do torno.

const SQUEEZE_RATE = 0.5 // esponja cheia esvazia em ~2 s apertando
const DROP_EVERY = 0.07 // s entre gotinhas
const MIN_SPIN = 0.05

/** Escreve aDry/aCrack em todos os vértices a partir da altura de cada ponto do contorno */
function writeAttributes(mesh: Mesh | null, pointCount: number, dryAt: (y: number) => number, crackAt: (y: number) => number) {
  if (!mesh) return
  const geo = mesh.geometry
  const pos = geo.attributes.position.array as Float32Array
  const dryAttr = geo.attributes.aDry
  const crackAttr = geo.attributes.aCrack
  if (!dryAttr || !crackAttr) return
  const dry = dryAttr.array as Float32Array
  const crack = crackAttr.array as Float32Array
  const columns = geo.attributes.position.count / pointCount
  for (let j = 0; j < pointCount; j++) {
    const y = pos[j * 3 + 1]
    const d = dryAt(y)
    const c = crackAt(y)
    for (let i = 0; i < columns; i++) {
      dry[i * pointCount + j] = d
      crack[i * pointCount + j] = c
    }
  }
  dryAttr.needsUpdate = true
  crackAttr.needsUpdate = true
}

export function HydrationController() {
  const gl = useThree((s) => s.gl)
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const raycaster = useMemo(() => new Raycaster(), [])
  const tmp = useMemo(() => ({ v: new Vector3() }), [])
  const timers = useRef({ drop: 0, flags: 0, frame: 0 })

  // ---------- ponteiro e teclado ----------
  useEffect(() => {
    const el = gl.domElement
    const p = sp.pointer
    const modeling = () => {
      const s = useGameStore.getState()
      return (s.phase === 'modeling' || s.phase === 'finishing') && !s.optionsOpen
    }

    const onDown = (e: PointerEvent) => {
      if (!modeling()) return
      if (e.pointerType === 'mouse' && e.button !== 0) return
      p.x = e.clientX
      p.y = e.clientY
      p.touch = e.pointerType === 'touch'
      // clique no balde: molha a esponja
      if (sp.bucket) {
        setRayFromClient(raycaster, camera, el, e.clientX, e.clientY)
        if (raycaster.intersectObject(sp.bucket, true).length) {
          dipSponge()
          return
        }
      }
      if (useGameStore.getState().sponge !== 'off') {
        p.pressed = true
        p.inside = true
      }
    }
    const onMove = (e: PointerEvent) => {
      p.x = e.clientX
      p.y = e.clientY
      p.inside = true
    }
    const onUp = () => {
      p.pressed = false
    }
    const onLeave = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') p.inside = false
    }
    const onKey = (e: KeyboardEvent) => {
      if (!modeling() || e.ctrlKey || e.metaKey || e.altKey || e.repeat) return
      if (e.key === 'e' || e.key === 'E') toggleSponge()
      else if (e.key === 'Escape' && useGameStore.getState().sponge !== 'off') useGameStore.getState().setSponge('off')
    }

    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', onUp)
    el.addEventListener('pointerleave', onLeave)
    window.addEventListener('keydown', onKey)
    return () => {
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onUp)
      el.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('keydown', onKey)
    }
  }, [gl, camera, raycaster])

  // ---------- fissuras viram receita ao sair do torno ----------
  useEffect(
    () =>
      useGameStore.subscribe((s, prev) => {
        if (s.phase === prev.phase) return
        const wasWorking = prev.phase === 'modeling' || prev.phase === 'finishing'
        // indo para a pintura (do torno ou do acabamento): as fissuras ficam registradas
        if (wasWorking && s.phase === 'painting') {
          // alça colada com a peça seca: a junção também vira craquelado (e pode ganhar kintsugi)
          const joints = s.handles.some((h) => (h.joint ?? 0) > 0)
          s.setCrackle(recordCrackle(joints))
        }
        // de volta ao torno: dá para hidratar e fechar as fissuras de novo
        if (prev.phase === 'painting' && s.phase === 'modeling') s.setCrackle(null)
        if (wasWorking && s.sponge !== 'off') s.setSponge('off')
      }),
    [],
  )

  // ---------- cada quadro ----------
  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 20)
    const s = useGameStore.getState()
    const t = timers.current
    const profile = s.profile
    const { outer, inner } = potteryRuntime
    glazeUniforms.crackleSeed.value = s.crackle?.seed ?? 0

    if (s.phase !== 'modeling' && s.phase !== 'finishing') {
      sp.drops.length = 0
      sp.pointer.pressed = false
      // fora do torno a peça mostra as fissuras gravadas na receita (craquelado no forno)
      if (++t.frame % 10 === 0) {
        const amount = s.crackle?.amount
        const crackAt = amount ? (y: number) => sampleAt(amount, profile, y) : () => 0
        writeAttributes(outer, OUTER_POINT_COUNT, () => 0, crackAt)
        writeAttributes(inner, INNER_POINT_COUNT, () => 0, () => 0)
      }
      return
    }

    // secagem (pausa com o menu de opções aberto)
    if (!s.optionsOpen) {
      const sagged = stepDrying(profile, dt, s.wheelSpeed)
      // com o torno parado a conservação de volume do SculptController não roda
      if (sagged && s.wheelSpeed <= MIN_SPIN) relaxVolume(profile, dt)
    }

    // esponja
    sp.dipT += dt
    sp.hit = false
    const pressing = s.sponge !== 'off' && sp.pointer.pressed
    if (s.sponge !== 'off' && sp.pointer.inside && outer && inner && potteryRuntime.group) {
      setRayFromClient(raycaster, camera, gl.domElement, sp.pointer.x, sp.pointer.y)
      const hits = raycaster.intersectObjects([outer, inner], false)
      if (hits.length) {
        const h = hits[0]
        sp.hit = true
        sp.point.copy(h.point)
        if (h.face) sp.normal.copy(h.face.normal).transformDirection(h.object.matrixWorld)
        const local = potteryRuntime.group.worldToLocal(tmp.v.copy(h.point))
        sp.localY = local.y
        sp.angle = Math.atan2(local.x, local.z)
      }
    }
    const wetting = pressing && sp.hit && sp.load > 0
    sp.squeeze += ((wetting ? 1 : pressing ? 0.4 : 0) - sp.squeeze) * Math.min(1, dt * 14)
    if (wetting) {
      wetAt(profile, sp.localY, dt * Math.min(1, sp.load * 3))
      sp.load = Math.max(0, sp.load - SQUEEZE_RATE * dt)
      // som de argila úmida e vibração leve no dedo
      potteryRuntime.deforming = Math.max(potteryRuntime.deforming, 0.55)
      if (sp.pointer.touch) haptic('sculpt')
      t.drop += dt
      while (t.drop > DROP_EVERY) {
        t.drop -= DROP_EVERY
        if (sp.drops.length < MAX_DROPS) {
          sp.drops.push({ angle: sp.angle + (Math.random() - 0.5) * 0.35, y: sp.localY, speed: 0.12 + Math.random() * 0.1, life: 0 })
        }
      }
      if (sp.load <= 0) {
        s.setSponge('empty')
        playEffect('squish', { rate: 1.3, volume: 0.6 })
      }
    }

    // gotinhas escorrem pela parede
    for (let i = sp.drops.length - 1; i >= 0; i--) {
      const d = sp.drops[i]
      d.life += dt
      d.speed += 0.35 * dt
      d.y -= d.speed * dt
      if (d.y < 0.04 || d.life > 3) sp.drops.splice(i, 1)
    }

    // dica da esponja (sem número, sem barra: só "está secando")
    t.flags += dt
    if (t.flags > 0.5) {
      t.flags = 0
      const drying = isDrying()
      if (drying !== s.clayDrying) s.setClayDrying(drying)
    }

    const { moisture, cracks } = hydrationRuntime
    writeAttributes(
      outer,
      OUTER_POINT_COUNT,
      (y) => 1 - sampleAt(moisture, profile, y),
      (y) => sampleAt(cracks, profile, y),
    )
    writeAttributes(inner, INNER_POINT_COUNT, (y) => 1 - sampleAt(moisture, profile, y), () => 0)
  })

  return null
}

