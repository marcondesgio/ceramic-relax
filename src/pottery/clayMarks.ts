import { CanvasTexture, RepeatWrapping } from 'three'
import type { ClayMarks } from '../prep/prep'

// Marquinhas das bolhas que sobraram no preparo: covinhas rasas na parede externa.
// É um mapa de relevo (bumpMap) no mesmo UV do torno (U = ângulo, V = altura), usado pela
// argila crua e pelo esmalte. Sem marquinhas ele fica liso e não muda nada no visual.

const W = 512
const H = 256

const canvas = document.createElement('canvas')
canvas.width = W
canvas.height = H
const ctx = canvas.getContext('2d')!

const texture = new CanvasTexture(canvas)
texture.wrapS = RepeatWrapping
texture.anisotropy = 4

/** Intensidade do relevo nos materiais */
export const MARKS_BUMP_SCALE = 5

export function getMarksTexture() {
  return texture
}

/** Sorteio repetível: a mesma semente desenha as mesmas marquinhas ao recarregar */
function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Covinha: mais funda no centro, com uma bordinha levemente alta em volta */
function dimple(x: number, y: number, rx: number, ry: number) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(1, ry / rx)
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx)
  g.addColorStop(0, 'rgb(150,150,150)')
  g.addColorStop(0.65, 'rgb(225,225,225)')
  g.addColorStop(0.85, 'rgb(255,255,255)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(0, 0, rx, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

/**
 * Ripado vertical (canelado): gomos de cima a baixo, um sulco suave entre cada dois.
 * Fica no mesmo mapa de relevo das marquinhas, sem custo de geometria.
 */
function drawFluting(count: number) {
  const step = W / count
  for (let k = 0; k < count; k++) {
    const x0 = k * step
    const g = ctx.createLinearGradient(x0, 0, x0 + step, 0)
    g.addColorStop(0, 'rgb(130,130,130)')
    g.addColorStop(0.2, 'rgb(215,215,215)')
    g.addColorStop(0.5, 'rgb(255,255,255)')
    g.addColorStop(0.8, 'rgb(215,215,215)')
    g.addColorStop(1, 'rgb(130,130,130)')
    ctx.fillStyle = g
    // some de leve perto do pé e da borda
    ctx.fillRect(x0, H * 0.06, step, H * 0.86)
  }
}

let current: { marks: ClayMarks | null; fluting: number | null } = { marks: null, fluting: null }

/** Redesenha o relevo da peça: marquinhas das bolhas e ripado vertical */
function redraw() {
  const { marks, fluting } = current
  // o cinza claro é a superfície; mais escuro = mais fundo
  ctx.fillStyle = 'rgb(240,240,240)'
  ctx.fillRect(0, 0, W, H)
  if (fluting) drawFluting(fluting)
  if (marks) {
    const rand = rng(marks.seed)
    for (let i = 0; i < marks.count; i++) {
      const u = rand()
      // só na parede: longe do pé e da borda
      const v = 0.15 + rand() * 0.72
      const rx = 5 + rand() * 4
      const ry = rx * (1.3 + rand() * 0.6)
      const x = u * W
      const y = (1 - v) * H
      // repete na emenda do U para a covinha não ser cortada
      for (const dx of [-W, 0, W]) dimple(x + dx, y, rx, ry)
    }
  }
  texture.needsUpdate = true
}

/** Marquinhas das bolhas da peça atual (null = argila lisinha) */
export function setClayMarks(marks: ClayMarks | null) {
  current = { ...current, marks }
  redraw()
}

/** Ripado vertical: quantidade de gomos (null = sem ripado) */
export function setFluting(count: number | null) {
  if (current.fluting === count) return
  current = { ...current, fluting: count }
  redraw()
}

redraw()
