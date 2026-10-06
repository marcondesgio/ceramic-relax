import { useEffect, useRef, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameStore, type PaintTool } from '../store/useGameStore'
import { PALETTE, type BrushSize } from '../paint/palette'
import { STAMPS, stampDetail, stampPath, type StampId } from '../paint/stamps'
import { BandsIcon, BrushIcon, BucketIcon, EraserIcon, StarIcon } from './Icons'

export const TOOLS: { id: PaintTool; icon: ReactNode; key: string }[] = [
  { id: 'brush', icon: <BrushIcon />, key: '1' },
  { id: 'bands', icon: <BandsIcon />, key: '2' },
  { id: 'stamp', icon: <StarIcon />, key: '3' },
  { id: 'bucket', icon: <BucketIcon />, key: '4' },
  { id: 'eraser', icon: <EraserIcon />, key: '5' },
]

/** Ferramentas que usam o tamanho P/M/G */
export const SIZED_TOOLS: PaintTool[] = ['brush', 'bands', 'stamp', 'eraser']

/** Seletor P / M / G */
export function SizeToggle({ small = false }: { small?: boolean }) {
  const { t } = useTranslation()
  const size = useGameStore((s) => s.paint.size)
  const updatePaint = useGameStore((s) => s.updatePaint)
  const sizes: BrushSize[] = ['S', 'M', 'L']

  return (
    <div className={`segmented ${small ? 'segmented--small' : ''}`} role="group" aria-label={t('painting.sizeLabel')}>
      {sizes.map((sz) => (
        <button
          key={sz}
          type="button"
          aria-pressed={size === sz}
          aria-label={t(`painting.sizeNames.${sz}`)}
          onClick={() => updatePaint({ size: sz })}
        >
          {t(`painting.sizes.${sz}`)}
        </button>
      ))}
    </div>
  )
}

/** Barra de ferramentas: coluna no desktop, linha no celular */
export function ToolBar({ layout }: { layout: 'column' | 'row' }) {
  const { t } = useTranslation()
  const tool = useGameStore((s) => s.paint.tool)
  const updatePaint = useGameStore((s) => s.updatePaint)

  return (
    <div className={`paint-tools paint-tools--${layout} card`} role="toolbar" aria-label={t('painting.toolsLabel')}>
      {TOOLS.map((tl) => (
        <div key={tl.id} className={`paint-tool-wrap ${tool === tl.id ? 'is-active' : ''}`}>
          <button
            type="button"
            className="tool paint-tool"
            aria-pressed={tool === tl.id}
            onClick={() => updatePaint({ tool: tl.id })}
          >
            {layout === 'column' && <span className="paint-tool__key">{tl.key}</span>}
            {tl.icon}
            <span>{t(`painting.tools.${tl.id}`)}</span>
          </button>
          {/* no desktop o P/M/G aparece embaixo da ferramenta ativa */}
          {layout === 'column' && tool === tl.id && SIZED_TOOLS.includes(tl.id) && <SizeToggle small />}
        </div>
      ))}
    </div>
  )
}

/** Miniatura do carimbo, desenhada com o mesmo vetor usado na peça */
function StampPreview({ id, color }: { id: StampId; color: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current
    if (!c) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const size = 32
    c.width = size * dpr
    c.height = size * dpr
    const ctx = c.getContext('2d')!
    ctx.clearRect(0, 0, c.width, c.height)
    ctx.save()
    ctx.translate(c.width / 2, c.height / 2)
    ctx.scale((size / 2.4) * dpr, (size / 2.4) * dpr)
    ctx.fillStyle = color
    ctx.fill(stampPath(id))
    stampDetail(ctx, id)
    ctx.restore()
  }, [id, color])
  return <canvas ref={ref} style={{ width: 32, height: 32 }} aria-hidden="true" />
}

/** Escolha do carimbo (aparece quando a ferramenta Carimbos está ativa) */
export function StampPicker() {
  const { t } = useTranslation()
  const stamp = useGameStore((s) => s.paint.stamp)
  const color = useGameStore((s) => PALETTE[s.paint.color].hex)
  const updatePaint = useGameStore((s) => s.updatePaint)

  return (
    <div className="stamp-picker card" role="group" aria-label={t('painting.stampLabel')}>
      {STAMPS.map((id) => (
        <button
          key={id}
          type="button"
          className="stamp-btn"
          aria-pressed={stamp === id}
          aria-label={t(`painting.stamps.${id}`)}
          title={t(`painting.stamps.${id}`)}
          onClick={() => updatePaint({ stamp: id })}
        >
          <StampPreview id={id} color={color} />
        </button>
      ))}
    </div>
  )
}
