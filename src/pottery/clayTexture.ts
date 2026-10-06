import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three'

/**
 * Textura procedural da argila: cor terracota com linhas de torneamento bem leves
 * e manchinhas suaves, que deixam a rotação visível sem poluir o visual.
 */
export function createClayTexture(base = '#E3A587') {
  const w = 512
  const h = 256
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = base
  ctx.fillRect(0, 0, w, h)

  // manchas suaves (marcas de mão), mais claras e mais escuras
  const blobs = [
    { x: 0.12, y: 0.55, r: 0.16, c: 'rgba(255,236,220,0.22)' },
    { x: 0.47, y: 0.3, r: 0.12, c: 'rgba(170,96,70,0.12)' },
    { x: 0.71, y: 0.7, r: 0.18, c: 'rgba(255,236,220,0.18)' },
    { x: 0.9, y: 0.4, r: 0.1, c: 'rgba(170,96,70,0.1)' },
  ]
  for (const b of blobs) {
    // repete nas bordas para a textura emendar sem costura
    for (const dx of [-1, 0, 1]) {
      const cx = (b.x + dx) * w
      const g = ctx.createRadialGradient(cx, b.y * h, 0, cx, b.y * h, b.r * w)
      g.addColorStop(0, b.c)
      g.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w, h)
    }
  }

  // linhas de torneamento (horizontais = anéis na peça)
  for (let i = 0; i < 9; i++) {
    const y = ((i + 0.5) / 9) * h + Math.sin(i * 7.3) * 4
    ctx.strokeStyle = i % 2 ? 'rgba(150,84,60,0.10)' : 'rgba(255,240,228,0.16)'
    ctx.lineWidth = 2 + (i % 3)
    ctx.beginPath()
    ctx.moveTo(0, y)
    for (let x = 0; x <= w; x += 32) ctx.lineTo(x, y + Math.sin((x / w) * Math.PI * 2 + i) * 1.5)
    ctx.stroke()
  }

  const tex = new CanvasTexture(canvas)
  tex.colorSpace = SRGBColorSpace
  tex.wrapS = RepeatWrapping
  tex.anisotropy = 4
  return tex
}
