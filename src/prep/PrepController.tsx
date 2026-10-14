import { useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { MathUtils, Plane, Raycaster, Vector2, Vector3 } from 'three'
import { useGameStore } from '../store/useGameStore'
import { SHELF_TOP } from '../kiln/kilnLayout'
import { playEffect } from '../audio/sounds'
import { haptic } from '../app/haptics'
import { AMOUNT_MAX, FOLDS_NEEDED, bubblesReleased, clampAmount } from './prep'
import {
  BLOCK_H,
  BLOCK_LEN,
  BLOCK_X0,
  CUT_TIME,
  FOLD_TIME,
  LIFT_MAX,
  MORPH_TIME,
  PIN_R,
  amountScale,
  enterStep,
  prepRuntime as rt,
  slabSize,
  wireXFor,
} from './prepRuntime'

// Preparo da argila: gestos (mouse e toque) e a física simples de cada etapa.
// Desktop: arrastar o fio · clicar, puxar para cima e soltar · arrastar o rolo · clique duplo dobra.
// Celular: deslizar no bloco · deslizar rápido para baixo · arrastar o rolo · toque duplo dobra.

const LIFT_PX = 0.22 // fração da altura da tela que puxa a massa até o alto
const THROW_MIN_LIFT = 0.3
const SWIPE_PX = 0.06 // deslize para baixo mínimo (fração da altura) …
const SWIPE_MS = 420 // … feito rápido
const ROLL_PER_SCREEN = 3.2 // unidades de mundo por altura de tela arrastada
const ROLL_PASSES = 2.4 // idas e voltas (em comprimentos da placa) para achatar
const DOUBLE_TAP_MS = 320
const DOUBLE_TAP_PX = 40
const GRAVITY = 14
const AMOUNT_KEY_STEP = 0.05

/** Duração com "reduzir animações": bem curtinha, sem sumir */
function dur(base: number) {
  return useGameStore.getState().settings.reduceMotion ? base * 0.3 : base
}

/** Arremesso: a massa cai do alto (puxada) ou é batida na mesa (deslize para baixo) */
function throwLump(strength: number, slam: boolean) {
  if (rt.falling) return
  rt.falling = true
  rt.throwStrength = strength
  if (slam) {
    rt.lumpY = Math.max(rt.lumpY, 0.45)
    rt.lumpVy = -6
  } else {
    rt.lumpVy = 0
  }
}

/** A massa bateu na bancada: "ploft", achatadinha e bolhas estourando */
function impact(strength: number) {
  const s = useGameStore.getState()
  rt.squash = 0.62 - 0.12 * strength
  rt.squashV = 0
  playEffect('squish', { rate: 0.72 + Math.random() * 0.1, volume: 0.8 + strength * 0.4 })
  haptic('tap')
  const remaining = s.prep.bubbles
  const n = bubblesReleased(remaining, strength)
  if (!n) return
  for (let i = remaining - n; i < remaining; i++) rt.pops.set(i, 0)
  s.updatePrep({ bubbles: remaining - n })
  // as bolhinhas estouram uma depois da outra
  for (let k = 0; k < Math.min(n, 4); k++) {
    window.setTimeout(() => playEffect('pop', { rate: 1.5 + Math.random() * 0.5, volume: 0.35 }), 60 + k * 70)
  }
}

/** Dobra a massa ao meio (só depois de achatada) */
function startFold() {
  const s = useGameStore.getState()
  if (s.prep.step !== 'roll' || !s.prep.flat || rt.foldT >= 0) return
  rt.foldT = 0
  playEffect('squish', { rate: 1.1, volume: 0.7 })
  haptic('tap')
}

function startCut() {
  if (rt.cutT >= 0) return
  rt.cutT = 0
  playEffect('brush', { rate: 1.5, volume: 0.9 })
}

export function PrepController() {
  const gl = useThree((s) => s.gl)
  const camera = useThree((s) => s.camera)
  const tools = useMemo(
    () => ({
      raycaster: new Raycaster(),
      ndc: new Vector2(),
      hit: new Vector3(),
      // plano do topo do bloco, no mundo
      plane: new Plane(new Vector3(0, 1, 0), -(SHELF_TOP.y + BLOCK_H)),
    }),
    [],
  )

  // ---------- gestos ----------
  useEffect(() => {
    const el = gl.domElement
    const st = { id: null as number | null, x0: 0, y0: 0, t0: 0, lastY: 0, lastTap: { t: -1e9, x: 0, y: 0 } }
    const inPrep = () => useGameStore.getState().phase === 'prep'

    /** Fio de corte segue o dedo/mouse ao longo do bloco */
    const moveWire = (clientX: number, clientY: number) => {
      const rect = el.getBoundingClientRect()
      tools.ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1)
      tools.raycaster.setFromCamera(tools.ndc, camera)
      if (!tools.raycaster.ray.intersectPlane(tools.plane, tools.hit)) return
      const x = tools.hit.x - SHELF_TOP.x
      const amount = clampAmount(((x - BLOCK_X0) / BLOCK_LEN) * AMOUNT_MAX)
      const s = useGameStore.getState()
      if (Math.abs(amount - s.prep.amount) > 0.004) s.updatePrep({ amount })
    }

    const onDown = (e: PointerEvent) => {
      if (!inPrep() || st.id !== null) return
      if (e.pointerType === 'mouse' && e.button !== 0) return
      try {
        el.setPointerCapture(e.pointerId)
      } catch {
        /* sem captura também funciona */
      }
      const now = performance.now()
      const step = useGameStore.getState().prep.step
      // toque/clique duplo: dobra a massa
      const tap = st.lastTap
      if (step === 'roll' && now - tap.t < DOUBLE_TAP_MS && Math.hypot(e.clientX - tap.x, e.clientY - tap.y) < DOUBLE_TAP_PX) {
        startFold()
        st.lastTap.t = -1e9
      }
      st.id = e.pointerId
      st.x0 = e.clientX
      st.y0 = e.clientY
      st.t0 = now
      st.lastY = e.clientY
      if (step === 'cut' && rt.cutT < 0) moveWire(e.clientX, e.clientY)
      if (step === 'throw' && !rt.falling) rt.dragging = true
    }

    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== st.id) return
      const s = useGameStore.getState()
      const h = el.clientHeight || 1
      if (s.prep.step === 'cut' && rt.cutT < 0) moveWire(e.clientX, e.clientY)
      if (s.prep.step === 'throw' && rt.dragging && !rt.falling) {
        rt.lift = MathUtils.clamp((st.y0 - e.clientY) / (h * LIFT_PX), 0, 1)
      }
      if (s.prep.step === 'roll' && rt.foldT < 0) {
        // arrastar para baixo traz o rolo para frente (na direção da câmera)
        const k = amountScale(s.prep.amount)
        const { l } = slabSize(rt.roll, s.prep.folds)
        const dz = ((e.clientY - st.lastY) / h) * (ROLL_PER_SCREEN / k)
        const z = MathUtils.clamp(rt.pinZ + dz, -l / 2, l / 2)
        const moved = Math.abs(z - rt.pinZ)
        // o rolo gira sem deslizar: ângulo = distância / raio
        rt.pinAngle += (z - rt.pinZ) / PIN_R
        rt.pinZ = z
        if (moved > 0) {
          rt.rubbing = Math.min(1, rt.rubbing + moved * 12)
          haptic('sculpt')
          if (!s.prep.flat) {
            rt.roll = Math.min(1, rt.roll + moved / (l * ROLL_PASSES))
            if (rt.roll >= 1) {
              s.updatePrep({ flat: true })
              playEffect('pop', { rate: 1.2, volume: 0.4 })
            }
          }
        }
      }
      st.lastY = e.clientY
    }

    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== st.id) return
      st.id = null
      const s = useGameStore.getState()
      const h = el.clientHeight || 1
      const dt = performance.now() - st.t0
      if (s.prep.step === 'throw' && rt.dragging && e.type !== 'pointercancel') {
        if (rt.lift >= THROW_MIN_LIFT) throwLump(rt.lift, false)
        else if (e.clientY - st.y0 > h * SWIPE_PX && dt < SWIPE_MS) throwLump(0.8, true)
      }
      rt.dragging = false
      rt.lift = 0
      // guarda o toque para reconhecer o toque duplo
      if (Math.hypot(e.clientX - st.x0, e.clientY - st.y0) < DOUBLE_TAP_PX / 2) {
        st.lastTap = { t: performance.now(), x: e.clientX, y: e.clientY }
      }
    }

    // teclado no corte: setas mudam a quantidade
    const onKey = (e: KeyboardEvent) => {
      const s = useGameStore.getState()
      if (s.phase !== 'prep' || s.prep.step !== 'cut' || rt.cutT >= 0) return
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        const d = e.key === 'ArrowRight' ? AMOUNT_KEY_STEP : -AMOUNT_KEY_STEP
        s.updatePrep({ amount: clampAmount(s.prep.amount + d) })
        e.preventDefault()
      }
    }

    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', onUp)
    window.addEventListener('keydown', onKey)
    return () => {
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onUp)
      window.removeEventListener('keydown', onKey)
    }
  }, [gl, camera, tools])

  // ---------- cada quadro ----------
  useFrame((_, delta) => {
    const s = useGameStore.getState()
    if (s.phase !== 'prep') {
      rt.step = null
      rt.rubbing = 0
      return
    }
    const dt = Math.min(delta, 0.05)
    const prep = s.prep
    if (prep.step !== rt.step) enterStep(prep.step, prep.amount, prep.folds)
    rt.morph = Math.min(1, rt.morph + dt / dur(MORPH_TIME))
    rt.rubbing *= Math.exp(-dt * 6)

    // pedidos dos botões da interface
    if (rt.request === 'cut' && prep.step === 'cut') startCut()
    if (rt.request === 'fold') startFold()
    rt.request = null

    if (prep.step === 'cut') {
      rt.wireX = MathUtils.damp(rt.wireX, wireXFor(prep.amount), 18, dt)
      if (rt.cutT >= 0) {
        rt.cutT += dt / dur(1)
        if (rt.cutT >= CUT_TIME) {
          rt.cutT = -1
          playEffect('squish', { rate: 1.05, volume: 0.6 })
          s.updatePrep({ step: 'throw' })
        }
      }
      return
    }

    if (prep.step === 'throw') {
      if (rt.falling) {
        rt.lumpVy -= GRAVITY * dt
        rt.lumpY += rt.lumpVy * dt
        if (rt.lumpY <= 0) {
          rt.lumpY = 0
          rt.falling = false
          impact(rt.throwStrength)
        }
      } else if (rt.dragging) {
        rt.lumpY = MathUtils.damp(rt.lumpY, rt.lift * LIFT_MAX, 20, dt)
      } else {
        // soltou sem arremessar: a massa volta devagar para a mesa
        rt.lumpY = MathUtils.damp(rt.lumpY, 0, 10, dt)
      }
      // mola da achatadinha
      rt.squashV += ((1 - rt.squash) * 260 - rt.squashV * 14) * dt
      rt.squash += rt.squashV * dt
      for (const [i, t] of rt.pops) {
        if (t > 0.35) rt.pops.delete(i)
        else rt.pops.set(i, t + dt)
      }
      // sem bolhas: passa sozinho para o rolo
      if (prep.bubbles === 0 && !rt.falling && rt.lumpY < 0.01) {
        rt.doneT += dt
        if (rt.doneT > dur(1.1)) s.updatePrep({ step: 'roll' })
      }
      return
    }

    if (prep.step === 'roll') {
      rt.slabShift = MathUtils.damp(rt.slabShift, 0, 6, dt)
      if (rt.foldT >= 0) {
        rt.foldT += dt / dur(1)
        if (rt.foldT >= FOLD_TIME) {
          // a metade de trás ficou por cima da da frente: nova placa, mais grossa e mais curta
          const { l } = slabSize(1, prep.folds)
          rt.foldT = -1
          rt.roll = 0
          rt.slabShift = l / 4
          const folds = prep.folds + 1
          rt.pinZ = slabSize(0, folds).l / 2
          playEffect('squish', { rate: 0.95, volume: 0.6 })
          if (folds >= FOLDS_NEEDED) s.updatePrep({ folds, flat: false, step: 'ready' })
          else s.updatePrep({ folds, flat: false })
        }
      }
      return
    }

    if (prep.step === 'ready') rt.readyT += dt
  })

  return null
}
