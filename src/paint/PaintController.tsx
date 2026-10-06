import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Raycaster, Vector3 } from 'three'
import { useGameStore } from '../store/useGameStore'
import { haptic } from '../app/haptics'
import { playEffect } from '../audio/sounds'
import { setRayFromClient } from '../pottery/pick'
import { potteryRuntime } from '../pottery/potteryRuntime'
import { MAX_ANGULAR_SPEED } from '../wheel/wheelRuntime'
import { fillBucket, paintBand, paintSegment, paintStamp, stampRepeatCount, type SurfacePoint } from './brushes'
import { beginStroke, endStroke, isStrokeActive } from './paintHistory'
import { flushSurfaces, type Side } from './paintSurface'
import { BAND_HALF, BRUSH_RADIUS, PALETTE, STAMP_RADIUS } from './palette'

const MIN_SPIN = 0.05
const BUCKET_SECONDS = 0.8 // tempo da cor "escorrendo" com o torno girando

interface Hit extends SurfacePoint {
  point: Vector3
  normal: Vector3
}

/**
 * Pintura direto na peça: raycast no lado escolhido (Fora/Dentro) e UV do ponto → canvas.
 * Os traços acontecem nos próprios eventos do ponteiro (não se perdem com fps baixo);
 * a cada quadro só repetimos o ponto atual quando o torno gira com o dedo parado.
 */
export function PaintController() {
  const gl = useThree((s) => s.gl)
  const camera = useThree((s) => s.camera)
  const raycaster = useMemo(() => new Raycaster(), [])
  const tmp = useMemo(() => ({ local: new Vector3() }), [])

  const input = useRef({
    pointerId: null as number | null,
    x: 0,
    y: 0,
    hover: false,
    /** último ponto pintado no gesto atual (liga os traços) */
    last: null as SurfacePoint | null,
    /** carimbo/balde: uma aplicação por toque */
    applied: false,
    bandsWarned: false,
    lastSwish: 0,
    pointerType: 'mouse',
  })
  const bucket = useRef<{ side: Side; color: string; progress: number } | null>(null)

  /** Raycast no lado ativo da peça */
  const pick = (cx: number, cy: number): Hit | null => {
    const side = useGameStore.getState().paint.side
    const mesh = side === 'outer' ? potteryRuntime.outer : potteryRuntime.inner
    const group = potteryRuntime.group
    if (!mesh || !group) return null
    setRayFromClient(raycaster, camera, gl.domElement, cx, cy)
    const h = raycaster.intersectObject(mesh, false)[0]
    if (!h?.uv) return null
    group.worldToLocal(tmp.local.copy(h.point))
    const normal = h.face ? h.face.normal.clone().transformDirection(mesh.matrixWorld) : new Vector3(0, 0, 1)
    return { u: h.uv.x, v: h.uv.y, r: Math.hypot(tmp.local.x, tmp.local.z), point: h.point, normal }
  }

  /** Aplica a ferramenta atual num ponto tocado; `spinDu` = quanto a peça girou desde o último ponto */
  const applyAt = (hit: Hit, spinDu?: number) => {
    const s = useGameStore.getState()
    const st = input.current
    const { tool, size, color, stamp, side } = s.paint
    const hex = PALETTE[color].hex
    const length = side === 'outer' ? potteryRuntime.outerLength : potteryRuntime.innerLength
    const spinning = s.wheelSpeed > MIN_SPIN
    let painted = false
    // houve traço contínuo (pincel, borracha, faixas) neste ponto
    let stroked = false

    switch (tool) {
      case 'brush':
      case 'eraser': {
        if (!isStrokeActive()) beginStroke(side)
        const from = st.last ?? hit
        paintSegment(side, length, from, hit, BRUSH_RADIUS[size], tool === 'brush' ? hex : null, st.last ? spinDu : undefined)
        st.last = { u: hit.u, v: hit.v, r: hit.r }
        painted = tool === 'brush'
        stroked = true
        break
      }
      case 'bands': {
        // faixas só existem com o torno girando
        if (!spinning) {
          if (!st.bandsWarned) s.showToast('painting.toast.bandsNeedSpin')
          st.bandsWarned = true
          st.last = null
          break
        }
        if (!isStrokeActive()) beginStroke(side)
        paintBand(side, length, (st.last ?? hit).v, hit.v, BAND_HALF[size], hex)
        st.last = { u: hit.u, v: hit.v, r: hit.r }
        painted = true
        stroked = true
        break
      }
      case 'stamp': {
        if (st.applied) break
        beginStroke(side)
        const count = spinning ? stampRepeatCount(hit.r, STAMP_RADIUS[size]) : 1
        paintStamp(side, length, hit, stamp, STAMP_RADIUS[size], hex, count)
        endStroke()
        // um pop (ou uma cascatinha de pops quando o carimbo se repete ao redor)
        for (let k = 0; k < Math.min(count, 4); k++) {
          window.setTimeout(() => playEffect('pop', { rate: 0.95 + k * 0.08 + Math.random() * 0.05 }), k * 70)
        }
        if (st.pointerType === 'touch') haptic('tap')
        st.applied = true
        painted = true
        break
      }
      case 'bucket': {
        if (st.applied) break
        beginStroke(side)
        playEffect('pour', { rate: spinning ? 0.9 : 1.1 })
        if (spinning) bucket.current = { side, color: hex, progress: 0 }
        else {
          fillBucket(side, hex, 0, 1)
          endStroke()
        }
        st.applied = true
        painted = true
        break
      }
    }
    if (painted && !s.paint.hasPaint) s.updatePaint({ hasPaint: true })
    // pincel, faixas e borracha: "swish" de cerdas de tempos em tempos enquanto o traço anda
    if (stroked) {
      const now = performance.now()
      if (now - st.lastSwish > 280) {
        st.lastSwish = now
        playEffect('brush', { rate: 0.85 + Math.random() * 0.3, volume: tool === 'eraser' ? 0.6 : 1 })
      }
    }
  }

  // ---------- eventos de ponteiro ----------
  useEffect(() => {
    const el = gl.domElement
    const st = input.current
    const painting = () => useGameStore.getState().phase === 'painting'

    const onDown = (e: PointerEvent) => {
      if (!painting() || st.pointerId !== null) return // só o primeiro dedo pinta
      if (e.pointerType === 'mouse' && e.button !== 0) return
      try {
        el.setPointerCapture(e.pointerId)
      } catch {
        /* sem captura também funciona */
      }
      st.pointerId = e.pointerId
      st.pointerType = e.pointerType
      st.x = e.clientX
      st.y = e.clientY
      st.last = null
      st.applied = false
      st.bandsWarned = false
      const hit = pick(e.clientX, e.clientY)
      if (hit) applyAt(hit)
    }
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') st.hover = true
      if (st.pointerId !== null && e.pointerId !== st.pointerId) return
      st.x = e.clientX
      st.y = e.clientY
      if (st.pointerId === null || !painting()) return
      const hit = pick(e.clientX, e.clientY)
      if (hit) applyAt(hit)
      // dedo saiu da peça: o próximo ponto começa um traço novo, sem linha atravessando
      else st.last = null
    }
    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== st.pointerId) return
      st.pointerId = null
      st.last = null
      // o balde animado fecha o passo de desfazer sozinho quando termina
      if (!bucket.current) endStroke()
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
    // pick/applyAt usam só refs e objetos estáveis
  }, [gl, camera])

  useFrame((_, delta) => {
    const s = useGameStore.getState()
    const st = input.current

    if (s.phase !== 'painting' || s.optionsOpen) {
      st.hover = false
      if (s.phase === 'painting') potteryRuntime.cursor.visible = false
      if (isStrokeActive() && !bucket.current) endStroke()
      st.pointerId = null
      bucket.current = null
      flushSurfaces()
      return
    }

    // balde animado: a cor desce do topo para a base
    const b = bucket.current
    if (b) {
      const from = b.progress
      b.progress = Math.min(1, b.progress + delta / BUCKET_SECONDS)
      fillBucket(b.side, b.color, from, b.progress)
      if (b.progress >= 1) {
        bucket.current = null
        if (st.pointerId === null) endStroke()
      }
    }

    const pressed = st.pointerId !== null
    const hit = pressed || st.hover ? pick(st.x, st.y) : null

    // torno girando com o dedo parado: a superfície passa por baixo e o traço vira anel.
    // A peça gira +θ, então o ponto da tela anda −θ/2π em U.
    if (pressed && hit && s.wheelSpeed > MIN_SPIN && s.paint.tool !== 'stamp' && s.paint.tool !== 'bucket') {
      const turned = (s.wheelSpeed * MAX_ANGULAR_SPEED * Math.min(delta, 0.1)) / (Math.PI * 2)
      applyAt(hit, -turned)
    }

    // cursor: disco com a cor e o tamanho da ferramenta
    const { tool, size, color } = s.paint
    const cursor = potteryRuntime.cursor
    cursor.visible = !!hit
    cursor.active = pressed && !!hit
    if (hit) {
      cursor.point.copy(hit.point)
      cursor.normal.copy(hit.normal)
    }
    cursor.fill = tool !== 'eraser'
    cursor.color = PALETTE[color].hex
    cursor.radius =
      tool === 'stamp'
        ? STAMP_RADIUS[size]
        : tool === 'bands'
          ? BAND_HALF[size]
          : tool === 'bucket'
            ? 0.06
            : BRUSH_RADIUS[size]

    flushSurfaces()
  })

  return null
}
