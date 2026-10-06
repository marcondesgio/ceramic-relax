import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Plane, Raycaster, Vector3, type PerspectiveCamera } from 'three'
import { useGameStore } from '../store/useGameStore'
import { haptic } from '../app/haptics'
import { playEffect } from '../audio/sounds'
import { setRayFromClient } from './pick'
import { outerRadiusAt } from './profile'
import { potteryRuntime } from './potteryRuntime'
import { deepenMouth, deformRadius, relaxVolume, smoothProfile, stretch } from './sculpt'

// Velocidades de deformação (unidades por segundo com o torno no máximo)
const THIN_RATE = 0.55
const WIDEN_RATE = 0.45
const MIN_SPIN = 0.05 // abaixo disso o torno conta como parado
const MOUTH_STEP = 0.32 // quanto cada clique/toque no topo aprofunda
const MOUTH_RATE = 0.9 // velocidade de abertura da boca
const TAP_MAX_MOVE = 8 // px
const TAP_MAX_MS = 400
const STROKE_IDLE_MS = 350 // pausa que encerra um "traço" de hover (para o desfazer)

const CURSOR_RADIUS = 0.0875
const CURSOR_COLOR = '#FFFBF5'

type Mode = 'none' | 'thin' | 'widen' | 'top'

interface PointerInfo {
  x: number
  y: number
  type: string
}

interface Hit {
  region: 'side' | 'top'
  y: number
  point: Vector3
  normal: Vector3
}

/**
 * Lê mouse e toques no canvas e deforma a argila por raycast.
 * Nada se deforma com o torno parado: o cursor só "toca" a peça.
 */
export function SculptController() {
  const gl = useThree((s) => s.gl)
  const camera = useThree((s) => s.camera) as PerspectiveCamera

  const raycaster = useMemo(() => new Raycaster(), [])
  const tmp = useMemo(
    () => ({ v: new Vector3(), n: new Vector3(), plane: new Plane(), axis: new Vector3() }),
    [],
  )

  const input = useRef({
    pointers: new Map<number, PointerInfo>(),
    mouse: { x: 0, y: 0, inside: false, pressed: false },
    mode: 'none' as Mode,
    start: { x: 0, y: 0, t: 0 },
    moved: false,
    lastY: 0,
    stroke: false,
    lastDeform: 0,
    /** tipo do último ponteiro pressionado (mouse, touch, pen) */
    lastType: 'mouse',
  })

  /** Raycast nas duas malhas da peça a partir de uma posição de tela */
  const hitTest = (cx: number, cy: number): Hit | null => {
    const { outer, inner, group } = potteryRuntime
    if (!outer || !inner || !group) return null
    setRayFromClient(raycaster, camera, gl.domElement, cx, cy)
    const hits = raycaster.intersectObjects([outer, inner], false)
    if (!hits.length) return null
    const h = hits[0]
    const profile = useGameStore.getState().profile
    const local = group.worldToLocal(tmp.v.copy(h.point))
    const normal = h.face ? tmp.n.copy(h.face.normal).transformDirection(h.object.matrixWorld) : tmp.n.set(0, 1, 0)
    // topo = parede interna (ou o domo da bola fechada) + a faixa da borda
    const rHit = Math.hypot(local.x, local.z)
    const rTop = profile.radii[profile.radii.length - 1]
    const isTop = h.object === inner || (rHit < rTop + 0.05 && local.y > profile.height - 0.2)
    return { region: isTop ? 'top' : 'side', y: local.y, point: h.point.clone(), normal: normal.clone() }
  }

  /**
   * Quando o dedo/cursor escorrega para fora da silhueta durante um gesto,
   * usamos um plano vertical pelo eixo do torno para saber a altura.
   */
  const planeTest = (cx: number, cy: number) => {
    const { group } = potteryRuntime
    if (!group) return null
    setRayFromClient(raycaster, camera, gl.domElement, cx, cy)
    group.getWorldPosition(tmp.axis)
    const n = tmp.n.set(camera.position.x - tmp.axis.x, 0, camera.position.z - tmp.axis.z).normalize()
    tmp.plane.setFromNormalAndCoplanarPoint(n, tmp.axis)
    const p = raycaster.ray.intersectPlane(tmp.plane, tmp.v)
    if (!p) return null
    const dist = Math.hypot(p.x - tmp.axis.x, p.z - tmp.axis.z)
    return { y: p.y - tmp.axis.y, dist, point: p.clone() }
  }

  // ---------- eventos de ponteiro ----------
  useEffect(() => {
    const el = gl.domElement
    const st = input.current
    if (import.meta.env.DEV) (window as unknown as { __sculpt: typeof st }).__sculpt = st
    const modeling = () => useGameStore.getState().phase === 'modeling'

    const centroid = () => {
      let x = 0
      let y = 0
      st.pointers.forEach((p) => {
        x += p.x
        y += p.y
      })
      const n = Math.max(1, st.pointers.size)
      return { x: x / n, y: y / n }
    }

    const endGesture = (canceled: boolean) => {
      const s = useGameStore.getState()
      const elapsed = performance.now() - st.start.t
      // toque/clique rápido no topo com o torno girando: abre a boca
      if (!canceled && st.mode === 'top' && !st.moved && elapsed < TAP_MAX_MS && s.wheelSpeed > MIN_SPIN) {
        s.pushUndo()
        potteryRuntime.mouthPending += MOUTH_STEP
        playEffect('squish', { rate: 0.9 + Math.random() * 0.2 })
        if (st.lastType === 'touch') haptic('tap')
      }
      st.mode = 'none'
      st.stroke = false
    }

    const onDown = (e: PointerEvent) => {
      if (!modeling()) return
      if (e.pointerType === 'mouse' && e.button !== 0) return // botão direito fica para a câmera
      try {
        el.setPointerCapture(e.pointerId)
      } catch {
        /* alguns navegadores recusam a captura; o gesto funciona mesmo assim */
      }
      st.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, type: e.pointerType })
      st.lastType = e.pointerType

      if (st.pointers.size === 1) {
        const hit = hitTest(e.clientX, e.clientY)
        st.start = { x: e.clientX, y: e.clientY, t: performance.now() }
        st.lastY = e.clientY
        st.moved = false
        if (hit?.region === 'top') st.mode = 'top'
        else st.mode = e.pointerType === 'mouse' ? 'widen' : 'thin'
      } else if (st.mode !== 'top') {
        // segundo dedo: alargar
        st.mode = 'widen'
      }
      if (e.pointerType === 'mouse') st.mouse.pressed = true
    }

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') {
        st.mouse.x = e.clientX
        st.mouse.y = e.clientY
        st.mouse.inside = true
      }
      const p = st.pointers.get(e.pointerId)
      if (!p) return
      p.x = e.clientX
      p.y = e.clientY
      if (Math.hypot(e.clientX - st.start.x, e.clientY - st.start.y) > TAP_MAX_MOVE) st.moved = true
    }

    const onUp = (e: PointerEvent) => {
      if (!st.pointers.has(e.pointerId)) return
      st.pointers.delete(e.pointerId)
      if (e.pointerType === 'mouse') st.mouse.pressed = false
      if (st.pointers.size === 0) endGesture(e.type === 'pointercancel')
      else if (st.mode === 'widen' && st.pointers.size === 1 && e.pointerType === 'touch') st.mode = 'thin'
      // o centro dos dedos muda quando um sai; evita um "pulo" no esticar
      st.lastY = centroid().y
    }

    const onLeave = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') st.mouse.inside = false
    }
    const noMenu = (e: Event) => e.preventDefault()

    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', onUp)
    el.addEventListener('pointerleave', onLeave)
    el.addEventListener('contextmenu', noMenu)
    return () => {
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onUp)
      el.removeEventListener('pointerleave', onLeave)
      el.removeEventListener('contextmenu', noMenu)
    }
    // hitTest usa só refs e objetos estáveis
  }, [gl, camera])

  // ---------- deformação a cada quadro ----------
  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 20)
    const st = input.current
    const s = useGameStore.getState()
    // fora da modelagem, ou com o menu de opções aberto, a argila não é tocada
    if (s.phase !== 'modeling' || s.optionsOpen) {
      st.mode = 'none'
      st.pointers.clear()
      st.mouse.inside = false
      potteryRuntime.cursor.visible = false
      return
    }

    const cursor = potteryRuntime.cursor
    cursor.visible = false
    cursor.active = false
    cursor.radius = CURSOR_RADIUS
    cursor.color = CURSOR_COLOR
    cursor.fill = false
    const profile = s.profile
    const speed = s.wheelSpeed
    const spinning = speed > MIN_SPIN
    const now = performance.now()

    // abre um "traço" de desfazer na primeira deformação de cada gesto
    const beginStroke = () => {
      if (!st.stroke) {
        s.pushUndo()
        st.stroke = true
      }
      st.lastDeform = now
    }

    // som de argila úmida e vibração leve (só com o dedo, no celular)
    const feedback = (atLimit: boolean) => {
      potteryRuntime.deforming = 1
      if (st.pointers.size && st.lastType === 'touch') haptic(atLimit ? 'limit' : 'sculpt')
    }

    // posição do gesto: centro dos dedos ou o mouse
    let px = 0
    let py = 0
    let op: Mode = st.mode
    if (st.pointers.size) {
      st.pointers.forEach((p) => {
        px += p.x
        py += p.y
      })
      px /= st.pointers.size
      py /= st.pointers.size
    } else if (st.mouse.inside) {
      px = st.mouse.x
      py = st.mouse.y
      op = 'thin' // hover afina
      // hover parado por um tempo encerra o traço atual
      if (st.stroke && now - st.lastDeform > STROKE_IDLE_MS) st.stroke = false
    } else {
      op = 'none'
    }

    if (op === 'top') {
      const dy = py - st.lastY
      st.lastY = py
      const hit = hitTest(px, py)
      if (hit) {
        cursor.visible = true
        cursor.point.copy(hit.point)
        cursor.normal.copy(hit.normal)
      }
      if (spinning && st.moved && dy !== 0) {
        // converte pixels em unidades de mundo na distância da peça
        const dist = camera.position.distanceTo(potteryRuntime.group!.getWorldPosition(tmp.v))
        const worldPerPx = (2 * dist * Math.tan((camera.fov * Math.PI) / 360)) / gl.domElement.clientHeight
        beginStroke()
        stretch(profile, -dy * worldPerPx * 0.9)
        feedback(false)
        cursor.active = true
      }
    } else if (op === 'thin' || op === 'widen') {
      const pressed = st.pointers.size > 0
      const hit = hitTest(px, py)
      let y: number | null = null
      if (hit && hit.region === 'side') {
        y = hit.y
        cursor.visible = true
        cursor.point.copy(hit.point)
        cursor.normal.copy(hit.normal)
      } else if (hit && hit.region === 'top') {
        cursor.visible = true
        cursor.point.copy(hit.point)
        cursor.normal.copy(hit.normal)
      } else if (pressed) {
        // dedo/cursor escorregou um pouco para fora durante o gesto
        const pl = planeTest(px, py)
        const tolerance = op === 'widen' ? 0.4 : 0.15
        if (pl && pl.y > 0.02 && pl.y < profile.height && pl.dist < outerRadiusAt(profile, pl.y) + tolerance) {
          y = pl.y
        }
      }

      if (y !== null && spinning) {
        beginStroke()
        const rate = op === 'thin' ? -THIN_RATE : WIDEN_RATE
        const atLimit = deformRadius(profile, y, rate * speed * dt)
        if (atLimit) potteryRuntime.jitter = 1
        feedback(atLimit)
        // torno rápido alisa mais
        smoothProfile(profile, speed * dt * 0.8)
        cursor.active = true
      }
    }

    // a boca abre aos poucos, só com o torno girando
    if (spinning && potteryRuntime.mouthPending > 0) {
      const inc = Math.min(potteryRuntime.mouthPending, MOUTH_RATE * speed * dt)
      deepenMouth(profile, inc)
      potteryRuntime.mouthPending -= inc
      if (potteryRuntime.mouthPending < 1e-4) potteryRuntime.mouthPending = 0
    }

    // conservação aproximada de volume (a argila sobe ou baixa)
    if (spinning) relaxVolume(profile, dt)
  })

  return null
}
