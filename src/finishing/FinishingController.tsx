import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Raycaster, Vector2, Vector3, type PerspectiveCamera } from 'three'
import { useGameStore } from '../store/useGameStore'
import type { HandleRecipe } from '../store/persistence'
import { haptic } from '../app/haptics'
import { playEffect } from '../audio/sounds'
import { setRayFromClient } from '../pottery/pick'
import { potteryRuntime } from '../pottery/potteryRuntime'
import { MOIST_DRYING, clayGive, hydrationRuntime, sampleAt } from '../pottery/hydration'
import { outerRadiusAt, type Profile } from '../pottery/profile'
import { MAX_HOLES } from '../pottery/holes'
import { MAX_HANDLES, clampHandle, handlesRuntime, knobPoints, newHandle } from './handles'
import { ribRings } from './rib'

// Acabamento na peça (ainda no torno, que o ripador precisa girando):
// - pontos de controle da alça selecionada: arrastar muda altura, abertura e espessura;
// - tocar numa alça seleciona; com uma alça escolhida na barra, tocar na lateral cola a alça;
// - ripador: com o torno girando, segurar na lateral cava sulcos em anel.

const MIN_SPIN = 0.05
const RIB_RATE = 0.07 // profundidade por segundo com o torno no máximo
const KNOB_HIT_PX = 32 // raio de toque dos pontos de controle (dedo)
const CURSOR_RADIUS = 0.0875
/** Raio de um furo numa peça de altura padrão */
const HOLE_SIZE = 0.075

/** Fissura da junção: a peça estava seca onde a alça foi colada */
function jointCrack(p: Profile, h: HandleRecipe) {
  const half = (h.height / 2) * p.height
  const top = h.v * p.height + half
  const bot = h.v * p.height - half
  const m = Math.min(sampleAt(hydrationRuntime.moisture, p, top), sampleAt(hydrationRuntime.moisture, p, bot))
  if (m >= MOIST_DRYING) return 0
  return Math.min(1, Math.max(0.25, (MOIST_DRYING - m) / (MOIST_DRYING - 0.1)))
}

export function FinishingController() {
  const gl = useThree((s) => s.gl)
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const raycaster = useMemo(() => new Raycaster(), [])
  const tmp = useMemo(() => ({ v: new Vector3(), w: new Vector3(), s: new Vector2() }), [])

  const input = useRef({
    pointerId: null as number | null,
    x: 0,
    y: 0,
    hover: false,
    pressed: false,
    type: 'mouse',
    /** ponto de controle sendo arrastado: 0 altura, 1 abertura, 2 espessura */
    drag: null as null | { knob: number; x0: number; y0: number; start: HandleRecipe },
    ribStroke: false,
    spinWarned: false,
  })

  /** Posição de tela (px do cliente) de um ponto do mundo */
  const toScreen = (world: Vector3, out: Vector2) => {
    const rect = gl.domElement.getBoundingClientRect()
    const p = tmp.w.copy(world).project(camera)
    return out.set(rect.left + ((p.x + 1) / 2) * rect.width, rect.top + ((1 - p.y) / 2) * rect.height)
  }

  /** Ponto de controle mais perto do toque (pela distância na tela, bom para o dedo) */
  const knobAt = (cx: number, cy: number) => {
    let best: number | null = null
    let bestD = KNOB_HIT_PX
    handlesRuntime.knobs.forEach((k, i) => {
      if (!k.visible) return
      const sp = toScreen(k.getWorldPosition(tmp.v), tmp.s)
      const d = Math.hypot(sp.x - cx, sp.y - cy)
      if (d < bestD) {
        bestD = d
        best = i
      }
    })
    return best as number | null
  }

  /** Lateral da peça sob o ponteiro: altura e ângulo no espaço da peça */
  const pickPiece = (cx: number, cy: number) => {
    const { outer, group } = potteryRuntime
    if (!outer || !group) return null
    setRayFromClient(raycaster, camera, gl.domElement, cx, cy)
    const h = raycaster.intersectObject(outer, false)[0]
    if (!h) return null
    const p = useGameStore.getState().profile
    const local = group.worldToLocal(tmp.v.copy(h.point))
    if (local.y < p.height * 0.05 || local.y > p.height * 0.97) return null
    const normal = h.face ? h.face.normal.clone().transformDirection(outer.matrixWorld) : new Vector3(0, 0, 1)
    return { y: local.y, angle: Math.atan2(local.x, local.z), point: h.point.clone(), normal }
  }

  const pickHandle = (cx: number, cy: number): number | null => {
    const meshes = handlesRuntime.meshes.filter((m) => m.visible)
    if (!meshes.length) return null
    setRayFromClient(raycaster, camera, gl.domElement, cx, cy)
    const h = raycaster.intersectObjects(meshes, false)[0]
    return h ? (h.object.userData.handleIndex as number) : null
  }

  /** Arrasto de um ponto de controle: converte pixels em medidas da alça */
  const applyDrag = (cx: number, cy: number) => {
    const st = input.current
    const s = useGameStore.getState()
    const d = st.drag
    const group = potteryRuntime.group
    if (!d || s.selectedHandle === null || !group) return
    const p = s.profile
    const h0 = d.start
    const dist = camera.position.distanceTo(group.getWorldPosition(tmp.v))
    const worldPerPx = (2 * dist * Math.tan((camera.fov * Math.PI) / 360)) / gl.domElement.clientHeight
    const dx = cx - d.x0
    const dy = cy - d.y0
    let next = h0
    if (d.knob === 0) {
      // altura: sobe e desce a alça inteira
      next = { ...h0, v: h0.v - (dy * worldPerPx) / p.height }
    } else if (d.knob === 1) {
      // abertura: o quanto o arrasto anda na direção "para fora da parede" vista na tela
      const k = knobPoints(h0, p)
      const a = toScreen(group.localToWorld(k.opening.clone()), new Vector2())
      const b = toScreen(group.localToWorld(k.opening.clone().addScaledVector(k.out, 0.1)), new Vector2())
      const sx = b.x - a.x
      const sy = b.y - a.y
      const len2 = sx * sx + sy * sy
      if (len2 > 4) next = { ...h0, opening: h0.opening + ((dx * sx + dy * sy) / len2) * 0.1 }
      // de frente para a câmera a direção some na tela: usa o arrasto horizontal
      else next = { ...h0, opening: h0.opening + Math.abs(dx) * worldPerPx * Math.sign(dx) }
    } else {
      // espessura: arrastar para cima engrossa
      next = { ...h0, thickness: h0.thickness - dy * worldPerPx * 0.25 }
    }
    s.updateHandle(s.selectedHandle, clampHandle(next))
  }

  // ---------- ponteiro ----------
  useEffect(() => {
    const el = gl.domElement
    const st = input.current
    const active = () => {
      const s = useGameStore.getState()
      return s.phase === 'finishing' && !s.optionsOpen && s.sponge === 'off'
    }

    const onDown = (e: PointerEvent) => {
      if (!active() || st.pointerId !== null) return
      if (e.pointerType === 'mouse' && e.button !== 0) return
      try {
        el.setPointerCapture(e.pointerId)
      } catch {
        /* sem captura também funciona */
      }
      st.pointerId = e.pointerId
      st.type = e.pointerType
      st.x = e.clientX
      st.y = e.clientY
      st.ribStroke = false
      st.spinWarned = false
      const s = useGameStore.getState()

      // 1. pontos de controle da alça selecionada
      const knob = knobAt(e.clientX, e.clientY)
      if (knob !== null && s.selectedHandle !== null) {
        s.pushFinishUndo()
        st.drag = { knob, x0: e.clientX, y0: e.clientY, start: s.handles[s.selectedHandle] }
        if (e.pointerType === 'touch') haptic('tap')
        return
      }
      // 2. tocar numa alça seleciona
      const hi = pickHandle(e.clientX, e.clientY)
      if (hi !== null) {
        // ajustar uma alça larga a ferramenta (não cola outra sem querer)
        s.setFinishTool(null)
        s.selectHandle(hi)
        playEffect('pop', { rate: 1.3, volume: 0.4 })
        return
      }
      // 3. ferramenta escolhida
      const tool = s.finishTool
      if (tool === 'rib') {
        st.pressed = true
        return
      }
      const hit = tool ? pickPiece(e.clientX, e.clientY) : null
      // ripador vertical: aplica o canelado na peça toda; tocar de novo com os mesmos gomos tira
      if (tool === 'flute' && hit) {
        s.pushFinishUndo()
        const same = s.fluting?.spacing === s.fluteCount
        s.setFluting(same ? null : { spacing: s.fluteCount })
        playEffect('brush', { rate: 0.8, volume: 0.9 })
        if (e.pointerType === 'touch') haptic('tap')
        return
      }
      // espátula: abre um furo com a ponta escolhida (sem encostar em outro furo)
      if (tool === 'hole' && hit) {
        const size = HOLE_SIZE * Math.min(1.4, Math.max(0.7, s.profile.height / 1.25))
        const u = (((hit.angle / (Math.PI * 2)) % 1) + 1) % 1
        const v = hit.y / s.profile.height
        const r = outerRadiusAt(s.profile, hit.y)
        const near = s.holes.some((h) => {
          let du = Math.abs(h.u - u)
          du = Math.min(du, 1 - du)
          return Math.hypot(du * Math.PI * 2 * r, (h.v - v) * s.profile.height) < (h.size + size) * 1.05
        })
        if (near) return
        if (s.holes.length >= MAX_HOLES) {
          s.showToast('finishing.toast.maxHoles')
          return
        }
        s.pushFinishUndo()
        s.addHole({ shape: s.holeShape, u, v, size })
        playEffect('pop', { rate: 0.8, volume: 0.7 })
        if (e.pointerType === 'touch') haptic('tap')
        return
      }
      if (tool && tool !== 'flute' && tool !== 'hole' && hit) {
        if (s.handles.length >= MAX_HANDLES) {
          s.showToast('finishing.toast.maxHandles')
          return
        }
        const draft = newHandle(tool, s.profile, hit.angle, hit.y, 0)
        const joint = jointCrack(s.profile, draft)
        s.pushFinishUndo()
        s.addHandle({ ...draft, joint })
        playEffect('squish', { rate: 1.15, volume: 0.8 })
        if (e.pointerType === 'touch') haptic('tap')
        // a peça estava seca: a junção fica com uma fissurinha (vira craquelado no forno)
        if (joint > 0) s.showToast('finishing.toast.jointCrack')
        return
      }
      // tocou fora: tira a seleção
      s.selectHandle(null)
    }

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') st.hover = true
      if (st.pointerId !== null && e.pointerId !== st.pointerId) return
      st.x = e.clientX
      st.y = e.clientY
      if (st.drag) applyDrag(e.clientX, e.clientY)
    }
    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== st.pointerId) return
      st.pointerId = null
      st.pressed = false
      st.drag = null
      st.ribStroke = false
      if (e.pointerType !== 'mouse') st.hover = false
    }
    const onLeave = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') st.hover = false
    }

    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', onUp)
    el.addEventListener('pointerleave', onLeave)
    return () => {
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onUp)
      el.removeEventListener('pointerleave', onLeave)
    }
    // os auxiliares usam só refs e objetos estáveis
  }, [gl, camera])

  // ---------- cada quadro: ripador e cursor ----------
  useFrame((_, delta) => {
    const s = useGameStore.getState()
    const st = input.current
    if (s.phase !== 'finishing') {
      st.pointerId = null
      st.pressed = false
      st.drag = null
      return
    }
    const cursor = potteryRuntime.cursor
    cursor.visible = false
    cursor.active = false
    cursor.fill = false
    cursor.color = '#FFFBF5'
    cursor.radius = CURSOR_RADIUS
    if (s.optionsOpen || s.sponge !== 'off' || st.drag || !s.finishTool) return

    const hit = st.pressed || st.hover ? pickPiece(st.x, st.y) : null
    if (!hit) return
    cursor.visible = true
    cursor.point.copy(hit.point)
    cursor.normal.copy(hit.normal)

    if (s.finishTool !== 'rib' || !st.pressed) return
    // o ripador só risca com o torno girando, como na modelagem
    if (s.wheelSpeed <= MIN_SPIN) {
      if (!st.spinWarned) s.showToast('finishing.toast.ribNeedsSpin')
      st.spinWarned = true
      return
    }
    if (!st.ribStroke) {
      s.pushFinishUndo()
      st.ribStroke = true
    }
    const dt = Math.min(delta, 1 / 20)
    // argila seca resiste mais ao ripador
    const atLimit = ribRings(s.profile, hit.y, RIB_RATE * s.wheelSpeed * dt * clayGive(s.profile, hit.y))
    cursor.active = true
    potteryRuntime.deforming = 1
    if (atLimit) potteryRuntime.jitter = Math.max(potteryRuntime.jitter, 0.4)
    if (st.type === 'touch') haptic('sculpt')
  })

  return null
}
