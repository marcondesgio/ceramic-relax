import { useRef, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameStore, wheelLevel, type FinishTool, type FluteCount } from '../store/useGameStore'
import { HANDLE_ITEM, HANDLE_SHAPES, type HandleShape } from '../finishing/handles'
import { KNOB_COLORS } from '../finishing/PieceHandles'
import { toggleSponge } from '../pottery/sponge'
import { HOLE_SHAPES, fluteUnlocked, holeUnlocked, type HoleShape } from '../shop/unlocks'
import { Button } from './Button'
import {
  BackIcon,
  BrushIcon,
  FluteIcon,
  HandleDoubleIcon,
  HandleEarIcon,
  HandleIcon,
  HandleRingIcon,
  HandleTallIcon,
  HoleIcon,
  LockIcon,
  RibIcon,
  SpongeIcon,
  TrashIcon,
  UndoIcon,
} from './Icons'
import { Pedal } from './Pedal'
import { TopControls } from './TopControls'
import { WheelIndicator } from './WheelIndicator'
import { useIsTouch } from './useIsTouch'

const SHAPE_ICONS: Record<HandleShape, ReactNode> = {
  ring: <HandleRingIcon />,
  ear: <HandleEarIcon />,
  double: <HandleDoubleIcon />,
  tall: <HandleTallIcon />,
}

const FLUTES: FluteCount[] = [18, 12, 8]
const FLUTE_NAMES: Record<FluteCount, string> = { 18: 'fine', 12: 'medium', 8: 'wide' }

/** Grupo de ferramentas: ripador (horizontal/vertical), furos ou alças */
type Group = 'rib' | 'hole' | 'handle'
const groupOf = (tool: FinishTool | null): Group | null =>
  tool === null ? null : tool === 'rib' || tool === 'flute' ? 'rib' : tool === 'hole' ? 'hole' : 'handle'

interface PickerOption {
  id: string
  icon: ReactNode
  label: string
  active: boolean
  locked: boolean
  onPick: () => void
}

/** Opções da ferramenta escolhida; as da lojinha aparecem com cadeado até a compra */
function Picker({ label, options }: { label: string; options: PickerOption[] }) {
  const { t } = useTranslation()
  const showToast = useGameStore((s) => s.showToast)
  return (
    <div className="finish-picker card" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          className={`tool${o.active ? ' is-active' : ''}${o.locked ? ' is-locked' : ''}`}
          aria-pressed={o.active}
          aria-disabled={o.locked}
          aria-label={o.label}
          onClick={() => (o.locked ? showToast('finishing.toast.locked') : o.onPick())}
        >
          {o.icon}
          <span>{o.label}</span>
          {o.locked && (
            <span className="tool__lock" aria-label={t('finishing.lockedLabel')}>
              <LockIcon size={14} />
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

/** Dica do topo, conforme a ferramenta (esponja tem prioridade, como na modelagem) */
function FinishingHint({ touch }: { touch: boolean }) {
  const { t } = useTranslation()
  const tool = useGameStore((s) => s.finishTool)
  const selected = useGameStore((s) => s.selectedHandle !== null)
  const sponge = useGameStore((s) => s.sponge)
  const drying = useGameStore((s) => s.clayDrying)
  const spinning = useGameStore((s) => wheelLevel(s.wheelSpeed) > 0)
  const device = touch ? 'Touch' : 'Desktop'
  let key: string
  if (sponge === 'wet') key = `modeling.hint.sponge${device}`
  else if (sponge === 'empty') key = `modeling.hint.spongeEmpty${device}`
  else if (selected) key = `finishing.hint.adjust${device}`
  else if (tool === 'rib') key = spinning ? `finishing.hint.rib${device}` : `finishing.hint.ribStopped${device}`
  else if (tool === 'flute') key = `finishing.hint.flute${device}`
  else if (tool === 'hole') key = `finishing.hint.hole${device}`
  else if (tool) key = `finishing.hint.place${device}`
  else if (drying) key = `modeling.hint.drying${device}`
  else key = `finishing.hint.pick${device}`
  return (
    <div className="hint" key={key} role="status">
      {t(key)}
    </div>
  )
}

/** Alça selecionada: legenda dos 3 pontos de controle e "Remover" */
function HandleAdjust() {
  const { t } = useTranslation()
  const selected = useGameStore((s) => s.selectedHandle)
  const pushFinishUndo = useGameStore((s) => s.pushFinishUndo)
  const removeHandle = useGameStore((s) => s.removeHandle)
  if (selected === null) return null
  return (
    <div className="handle-adjust">
      <div className="hint handle-legend">
        {(['height', 'opening', 'thickness'] as const).map((k, i) => (
          <span key={k}>
            <i style={{ background: KNOB_COLORS[i] }} />
            {t(`finishing.knobs.${k}`)}
          </span>
        ))}
      </div>
      <Button
        icon={<TrashIcon size={20} />}
        onClick={() => {
          pushFinishUndo()
          removeHandle(selected)
        }}
      >
        {t('finishing.remove')}
      </Button>
    </div>
  )
}

/** Fase 1.5 — Acabamento (opcional): ripadores, furos e alças, ainda no torno */
export function FinishingHUD() {
  const { t } = useTranslation()
  const touch = useIsTouch()
  const tool = useGameStore((s) => s.finishTool)
  const fluteCount = useGameStore((s) => s.fluteCount)
  const holeShape = useGameStore((s) => s.holeShape)
  const purchases = useGameStore((s) => s.purchases)
  const sponge = useGameStore((s) => s.sponge)
  const canUndo = useGameStore((s) => s.finishUndo.length > 0)
  const selected = useGameStore((s) => s.selectedHandle !== null)
  const changed = useGameStore((s) => s.finishUndo.length > 0 || s.handles.length > 0 || s.holes.length > 0)
  const setFinishTool = useGameStore((s) => s.setFinishTool)
  const setFinishParams = useGameStore((s) => s.setFinishParams)
  const selectHandle = useGameStore((s) => s.selectHandle)
  const undoFinish = useGameStore((s) => s.undoFinish)
  const setPhase = useGameStore((s) => s.setPhase)
  const setSponge = useGameStore((s) => s.setSponge)
  // última opção usada em cada grupo (o botão do grupo volta para ela)
  const lastRib = useRef<'rib' | 'flute'>('rib')
  const lastShape = useRef<HandleShape>('ring')
  const group = sponge === 'off' ? groupOf(tool) : null
  if (tool === 'rib' || tool === 'flute') lastRib.current = tool
  if (group === 'handle' && tool) lastShape.current = tool as HandleShape

  // escolher uma ferramenta guarda a esponja e solta a alça selecionada
  const pick = (next: FinishTool) => {
    if (sponge !== 'off') setSponge('off')
    selectHandle(null)
    setFinishTool(next)
  }
  const toPainting = () => {
    selectHandle(null)
    setPhase('painting')
  }

  const ribOptions: PickerOption[] = [
    { id: 'rib', icon: <RibIcon />, label: t('finishing.ribs.horizontal'), active: tool === 'rib', locked: false, onPick: () => pick('rib') },
    ...FLUTES.map((n) => ({
      id: `flute-${n}`,
      icon: <FluteIcon />,
      label: t(`finishing.ribs.${FLUTE_NAMES[n]}`),
      active: tool === 'flute' && fluteCount === n,
      locked: !fluteUnlocked(purchases),
      onPick: () => {
        setFinishParams({ fluteCount: n })
        pick('flute')
      },
    })),
  ]
  const holeOptions: PickerOption[] = HOLE_SHAPES.map((shape: HoleShape) => ({
    id: shape,
    icon: <HoleIcon shape={shape} />,
    label: t(`finishing.holes.${shape}`),
    active: tool === 'hole' && holeShape === shape,
    locked: !holeUnlocked(shape, purchases),
    onPick: () => {
      setFinishParams({ holeShape: shape })
      pick('hole')
    },
  }))
  const handleOptions: PickerOption[] = HANDLE_SHAPES.map((shape) => {
    const item = HANDLE_ITEM[shape]
    return {
      id: shape,
      icon: SHAPE_ICONS[shape],
      label: t(`finishing.handles.${shape}`),
      active: tool === shape,
      locked: item !== null && !purchases.includes(item),
      onPick: () => pick(shape),
    }
  })

  const undoButton = (
    <Button variant="icon" aria-label={t('common.undo')} icon={<UndoIcon />} disabled={!canUndo} onClick={undoFinish} />
  )
  const groupButton = (id: Group, icon: ReactNode, label: string, onClick: () => void) => (
    <button type="button" className={`tool${group === id ? ' is-active' : ''}`} aria-pressed={group === id} aria-label={label} onClick={onClick}>
      {icon}
      <span>{label}</span>
    </button>
  )

  return (
    <div className={`ui-layer hud finish-hud ${touch ? 'hud--touch' : 'hud--desktop'}`}>
      <div className="hud__top">
        {touch ? (
          <Button variant="icon" aria-label={t('finishing.back')} icon={<BackIcon />} onClick={() => setPhase('modeling')} />
        ) : (
          <Button icon={<BackIcon />} onClick={() => setPhase('modeling')}>
            {t('finishing.back')}
          </Button>
        )}
        <span className="hud__spacer" />
        {/* no celular o desfazer sobe para o topo: os 4 botões cabem ao lado do pedal */}
        <TopControls before={touch ? undoButton : undefined} sound={!touch} />
      </div>
      <div className="hud__hint">
        <FinishingHint touch={touch} />
      </div>
      <HandleAdjust />

      <div className="hud__tools card">
        {groupButton('rib', <RibIcon />, t('finishing.rib'), () => pick(lastRib.current))}
        {groupButton('hole', <HoleIcon shape="round" />, t('finishing.hole'), () => pick('hole'))}
        {groupButton('handle', <HandleIcon />, t('finishing.handle'), () => pick(lastShape.current))}
        <button type="button" className={`tool${sponge !== 'off' ? ' is-active' : ''}`} aria-pressed={sponge !== 'off'} aria-label={t('modeling.sponge')} onClick={toggleSponge}>
          <SpongeIcon />
          <span>{t('modeling.sponge')}</span>
        </button>
        {!touch && (
          <button type="button" className="tool" disabled={!canUndo} aria-label={t('common.undo')} onClick={undoFinish}>
            <UndoIcon />
            <span>{t('common.undo')}</span>
          </button>
        )}
      </div>
      {!selected && group === 'rib' && <Picker label={t('finishing.ribsLabel')} options={ribOptions} />}
      {!selected && group === 'hole' && <Picker label={t('finishing.holesLabel')} options={holeOptions} />}
      {!selected && group === 'handle' && <Picker label={t('finishing.handlesLabel')} options={handleOptions} />}

      {!touch && (
        <div className="hud__wheel">
          <WheelIndicator />
        </div>
      )}
      {touch && (
        <div className="hud__pedal">
          <Pedal />
        </div>
      )}

      {/* a etapa é opcional: sem mudanças o botão pula direto para a pintura */}
      <div className="hud__ready">
        <Button variant="primary" icon={<BrushIcon />} onClick={toPainting}>
          {changed ? t('finishing.toPainting') : t('finishing.skip')}
        </Button>
      </div>
    </div>
  )
}
