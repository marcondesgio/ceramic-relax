import { useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameStore } from '../store/useGameStore'
import { PALETTE } from '../paint/palette'
import { BISCUIT } from '../paint/glazeMaterial'
import { LOOKS, type AnimalId, type Order, type PatternWant, type PieceType } from '../village/animals'
import { acceptOrder, declineOrder } from '../village/village'
import { Button } from './Button'
import { CloseIcon, CoinIcon, StarIcon } from './Icons'
import { useIsTouch } from './useIsTouch'

// Vila na interface: cartão do pedido (aceitar / agora não), balões de despedida e de reação,
// e o botão do pedido no topo da tela. Nada aqui mostra número de traço: só o desenho e a fala.

/** Texto do pedido: os desafios da lojinha têm o próprio texto */
export function orderTextKey(order: Order) {
  return order.challenge ? `village.challenges.${order.challenge}` : `village.animals.${order.animal}.orders.${order.key}`
}

/** Rosto do bichinho em SVG (mesmas cores do modelo provisório) */
export function AnimalAvatar({ id, size = 56 }: { id: AnimalId; size?: number }) {
  const l = LOOKS[id]
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      {l.extra === 'mane' && <circle cx="32" cy="35" r="28" fill={l.accent} />}
      {l.ears === 'round' && [16, 48].map((x) => <circle key={x} cx={x} cy="15" r="7" fill={l.accent} />)}
      {l.ears === 'pointy' && (
        <path d="M14 22 L18 6 L26 16 Z M50 22 L46 6 L38 16 Z" fill={l.accent} strokeLinejoin="round" />
      )}
      {l.ears === 'tall' && <path d="M14 22 L16 0 L28 14 Z M50 22 L48 0 L36 14 Z" fill={l.body} />}
      <circle cx="32" cy="35" r="22" fill={l.body} />
      {l.extra === 'mask' && (
        <>
          <ellipse cx="23" cy="33" rx="7" ry="5" fill={l.accent} />
          <ellipse cx="41" cy="33" rx="7" ry="5" fill={l.accent} />
        </>
      )}
      {l.extra === 'shell' && <path d="M14 26 Q32 10 50 26" stroke={l.accent} strokeWidth="4" fill="none" strokeLinecap="round" />}
      {[24, 40].map((x) => (
        <g key={x}>
          <circle cx={x} cy="33" r="3.6" fill="#3B2B26" />
          <circle cx={x + 1.2} cy="31.6" r="1.1" fill="#fff" />
        </g>
      ))}
      <ellipse cx="17" cy="42" rx="4" ry="2.4" fill="#F4A08E" opacity=".6" />
      <ellipse cx="47" cy="42" rx="4" ry="2.4" fill="#F4A08E" opacity=".6" />
      {l.snout === 'blunt' && <ellipse cx="32" cy="44" rx="10" ry="7" fill={l.belly} />}
      {l.snout === 'small' && <ellipse cx="32" cy="43" rx="5" ry="3.6" fill={l.belly} />}
      {l.snout === 'beak' && <path d="M26 38 Q44 36 56 50 Q40 50 28 46 Z" fill={l.accent} />}
      {l.snout === 'long' && <rect x="27" y="38" width="10" height="16" rx="5" fill={l.extra === 'fin' ? l.accent : l.belly} />}
      <path d="M29 47.5 q3 2 6 0" stroke="#3B2B26" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </svg>
  )
}

const SHAPES: Record<PieceType | 'any', string> = {
  plate: 'M8 40 Q32 52 56 40 Q56 35 52 34 Q32 40 12 34 Q8 35 8 40 Z',
  bowl: 'M10 26 H54 Q53 50 32 50 Q11 50 10 26 Z',
  mug: 'M14 18 H42 V44 Q42 50 36 50 H20 Q14 50 14 44 Z',
  pot: 'M20 22 H44 Q50 34 46 46 Q32 54 18 46 Q14 34 20 22 Z',
  vase: 'M26 10 H38 V16 Q50 24 48 38 Q46 52 32 52 Q18 52 16 38 Q14 24 26 16 Z',
  tallVase: 'M27 6 H37 V12 Q44 20 42 34 Q42 48 38 56 H26 Q22 48 22 34 Q20 20 27 12 Z',
  any: 'M22 14 H42 V18 Q50 26 48 38 Q46 50 32 50 Q18 50 16 38 Q14 26 22 18 Z',
}

/** Estampinha pequena (mesmas formas dos carimbos) */
function Glyph({ id, x, y, fill = 'rgba(255,255,255,0.85)' }: { id: PatternWant | 'round'; x: number; y: number; fill?: string }) {
  switch (id) {
    case 'star':
      return <path transform={`translate(${x} ${y}) scale(4)`} d="M0-1 .29-.4.95-.31.48.15.59.81 0 .5-.59.81-.48.15-.95-.31-.29-.4Z" fill={fill} />
    case 'heart':
      return <path transform={`translate(${x} ${y}) scale(3.6)`} d="M0 .9C-.4.6-1 .2-1-.3-1-.7-.4-1 0-.5.4-1 1-.7 1-.3 1 .2.4.6 0 .9Z" fill={fill} />
    case 'drop':
      return <path transform={`translate(${x} ${y}) scale(3.6)`} d="M0-1C.3-.5.7-.1.7.3A.7.7 0 0 1-.7.3C-.7-.1-.3-.5 0-1Z" fill={fill} />
    case 'leaf':
      return <path transform={`translate(${x} ${y}) scale(3.8) rotate(30)`} d="M0-1C.8-.5.8.5 0 1-.8.5-.8-.5 0-1Z" fill={fill} />
    case 'flower':
      return (
        <g transform={`translate(${x} ${y})`} fill={fill}>
          {[0, 72, 144, 216, 288].map((a) => (
            <circle key={a} cx={Math.cos((a * Math.PI) / 180) * 2.4} cy={Math.sin((a * Math.PI) / 180) * 2.4} r="2" />
          ))}
        </g>
      )
    case 'moon':
      return <path transform={`translate(${x} ${y}) scale(3.6)`} d="M.25-.92C-.8-.8-.8.8.25.92-.3.55-.3-.55.25-.92Z" fill={fill} />
    case 'sun':
      return (
        <g transform={`translate(${x} ${y})`} fill={fill}>
          <circle r="2" />
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <circle key={a} cx={Math.cos((a * Math.PI) / 180) * 3.6} cy={Math.sin((a * Math.PI) / 180) * 3.6} r="0.8" />
          ))}
        </g>
      )
    case 'fish':
      return <path transform={`translate(${x} ${y}) scale(3.6)`} d="M-.8 0A.6.42 0 1 0 .4 0 .6.42 0 1 0-.8 0ZM.36 0 .95-.45Q.8 0 .95.45Z" fill={fill} />
    case 'paw':
      return (
        <g transform={`translate(${x} ${y}) scale(3.4)`} fill={fill}>
          <ellipse cy=".32" rx=".5" ry=".42" />
          <circle cx="-.62" cy="-.22" r=".22" />
          <circle cx="-.22" cy="-.62" r=".22" />
          <circle cx=".22" cy="-.62" r=".22" />
          <circle cx=".62" cy="-.22" r=".22" />
        </g>
      )
    case 'cloud':
      return (
        <g transform={`translate(${x} ${y}) scale(3.4)`} fill={fill}>
          <circle cx="-.48" cy=".12" r=".38" />
          <circle cy="-.18" r=".52" />
          <circle cx=".48" cy=".12" r=".38" />
          <rect x="-.86" y=".05" width="1.72" height=".45" rx=".22" />
        </g>
      )
    default:
      return <circle cx={x} cy={y} r="2.8" fill={fill} />
  }
}

/** Desenho simples do pedido: forma, cor e estampa */
export function OrderDrawing({ order, size = 88 }: { order: Order; size?: number }) {
  const { types, colors, pattern } = order.wants
  const shape = SHAPES[types?.[0] ?? 'any']
  const fill = colors ? PALETTE[colors[0]].hex : BISCUIT
  const clip = `clip-${order.id}`
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="order-drawing">
      <defs>
        <clipPath id={clip}>
          <path d={shape} />
        </clipPath>
      </defs>
      <ellipse cx="32" cy="57" rx="18" ry="3" fill="rgba(107,79,63,0.12)" />
      <path d={shape} fill={fill} stroke="#6B4F3F" strokeWidth="1.6" strokeLinejoin="round" />
      {(types?.[0] === 'mug' || order.wants.handle === 'ring' || order.wants.handle === 'ear') && (
        <path d="M42 24 Q54 24 54 33 Q54 42 42 42" stroke="#6B4F3F" strokeWidth="5" fill="none" strokeLinecap="round" />
      )}
      {order.wants.handle === 'double' && (
        <path d="M18 22 Q8 22 8 30 Q8 36 17 36 M46 22 Q56 22 56 30 Q56 36 47 36" stroke="#6B4F3F" strokeWidth="4" fill="none" strokeLinecap="round" />
      )}
      {order.wants.handle === 'tall' && (
        <path d="M40 16 Q50 2 58 12 Q60 26 44 38" stroke="#6B4F3F" strokeWidth="4" fill="none" strokeLinecap="round" />
      )}
      <g clipPath={`url(#${clip})`}>
        {pattern === 'bands' &&
          (colors && colors.length > 1 ? colors : [0, 0, 0]).slice(0, 3).map((c, i) => (
            <rect key={i} x="0" y={24 + i * 9} width="64" height="4.5" fill={colors && colors.length > 1 ? PALETTE[c].hex : 'rgba(255,255,255,0.7)'} />
          ))}
        {order.wants.fluting &&
          [20, 26, 32, 38, 44].map((x) => <path key={x} d={`M${x} 8 V58`} stroke="rgba(107,79,63,0.35)" strokeWidth="1.6" />)}
        {order.wants.holes && (
          <>
            <Glyph id={order.wants.holes === 'round' ? 'round' : order.wants.holes} x={26} y={34} fill="#6B4F3F" />
            <Glyph id={order.wants.holes === 'round' ? 'round' : order.wants.holes} x={38} y={34} fill="#6B4F3F" />
            <Glyph id={order.wants.holes === 'round' ? 'round' : order.wants.holes} x={32} y={44} fill="#6B4F3F" />
          </>
        )}
        {pattern && pattern !== 'bands' && pattern !== 'none' && (
          <>
            <Glyph id={pattern} x={25} y={32} />
            <Glyph id={pattern} x={39} y={36} />
            <Glyph id={pattern} x={30} y={44} />
          </>
        )}
      </g>
      {order.wants.finish === 'matte' && <path d="M24 20 h16" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />}
    </svg>
  )
}

function Coins({ value }: { value: number }) {
  return (
    <span className="coins">
      <CoinIcon size={18} />
      {value}
    </span>
  )
}

/** Cartão com o pedido: na chegada (aceitar / agora não) ou aberto pelo botão do topo */
function OrderCard({ order, actions, onClose }: { order: Order; actions?: ReactNode; onClose?: () => void }) {
  const { t } = useTranslation()
  const name = t(`village.animals.${order.animal}.name`)
  return (
    <div className="visit-card card" role="dialog" aria-label={t('village.orderLabel', { name })}>
      {onClose && <Button variant="icon" className="visit-card__close" aria-label={t('village.close')} icon={<CloseIcon size={20} />} onClick={onClose} />}
      <div className="visit-card__head">
        <AnimalAvatar id={order.animal} />
        <div>
          <strong>{name}</strong>
          {order.kind === 'special' && (
            <span className="visit-card__special">
              <StarIcon size={14} />
              {t(order.challenge ? 'village.challenge' : 'village.special')}
            </span>
          )}
        </div>
      </div>
      <div className="visit-card__body">
        <p className="speech">{t(orderTextKey(order))}</p>
        <OrderDrawing order={order} />
      </div>
      <p className="visit-card__note">
        <Coins value={order.reward} /> {t('village.anyPiece', { name })}
      </p>
      {actions && <div className="visit-card__actions">{actions}</div>}
    </div>
  )
}

/** Balão curto (despedida ou reação) que some sozinho */
function SpeechBubble({ animal, text, extra }: { animal: AnimalId; text: string; extra?: ReactNode }) {
  return (
    <div className="visit-bubble card" role="status">
      <AnimalAvatar id={animal} size={48} />
      <div>
        <p className="speech">{text}</p>
        {extra}
      </div>
    </div>
  )
}

/** Botão do pedido no topo (dentro do TopControls): mostra quem pediu e abre o cartão */
export function OrderChip() {
  const { t } = useTranslation()
  const order = useGameStore((s) => s.village.order)
  const phase = useGameStore((s) => s.phase)
  const open = useGameStore((s) => s.orderOpen)
  const setOrderOpen = useGameStore((s) => s.setOrderOpen)
  if (!order || phase === 'home') return null
  return (
    <button
      type="button"
      className="btn btn--icon order-chip"
      aria-label={t('village.orderLabel', { name: t(`village.animals.${order.animal}.name`) })}
      aria-expanded={open}
      onClick={() => setOrderOpen(!open)}
    >
      <AnimalAvatar id={order.animal} size={40} />
      {order.kind === 'special' && (
        <span className="order-chip__star">
          <StarIcon size={12} />
        </span>
      )}
    </button>
  )
}

export function VillageHUD() {
  const { t } = useTranslation()
  const touch = useIsTouch()
  const phase = useGameStore((s) => s.phase)
  const visit = useGameStore((s) => s.visit)
  const order = useGameStore((s) => s.village.order)
  const open = useGameStore((s) => s.orderOpen)
  const coins = useGameStore((s) => s.coins)
  const setOrderOpen = useGameStore((s) => s.setOrderOpen)
  // a despedida fica uns segundos na tela
  const [goodbye, setGoodbye] = useState<AnimalId | null>(null)

  useEffect(() => {
    if (visit?.stage === 'leaving' && visit.declined) setGoodbye(visit.animal)
  }, [visit?.stage, visit?.declined, visit?.animal])
  // some sozinha, mesmo que o bichinho já tenha saído pela porta
  useEffect(() => {
    if (!goodbye) return
    const id = window.setTimeout(() => setGoodbye(null), 2800)
    return () => window.clearTimeout(id)
  }, [goodbye])

  if (phase === 'firing' || phase === 'home') return null
  const cls = `ui-layer village-hud ${touch ? 'hud--touch' : 'hud--desktop'}`

  if (visit?.stage === 'asking') {
    return (
      <div className={cls}>
        <OrderCard
          order={visit.order}
          actions={
            <>
              <Button onClick={declineOrder}>{t('village.decline')}</Button>
              <Button variant="primary" onClick={acceptOrder}>
                {t('village.accept')}
              </Button>
            </>
          }
        />
      </div>
    )
  }
  if (visit?.stage === 'reacting' && visit.level) {
    return (
      <div className={cls}>
        <SpeechBubble
          animal={visit.animal}
          text={t(`village.animals.${visit.animal}.react.${visit.level}`)}
          extra={
            <p className="visit-bubble__coins">
              <CoinIcon size={18} /> {t('village.earned', { coins: visit.order.reward, total: coins })}
            </p>
          }
        />
      </div>
    )
  }
  if (goodbye) {
    return (
      <div className={cls}>
        <SpeechBubble animal={goodbye} text={t(`village.animals.${goodbye}.goodbye`)} />
      </div>
    )
  }
  if (open && order) {
    return (
      <div className={cls}>
        <OrderCard order={order} onClose={() => setOrderOpen(false)} />
      </div>
    )
  }
  return null
}
