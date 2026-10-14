import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameStore } from '../store/useGameStore'
import { playEffect } from '../audio/sounds'
import { PALETTE, colorIndex } from '../paint/palette'
import type { StampId } from '../paint/stamps'
import { CATALOG_ITEMS, CATEGORIES, WELCOME_COINS, itemById, type ShopItem } from '../shop/catalog'
import { Button } from './Button'
import {
  CheckIcon,
  ClayIcon,
  CloseIcon,
  CoinIcon,
  FluteIcon,
  HandleDoubleIcon,
  HandleEarIcon,
  HandleTallIcon,
  HoleIcon,
  LampIcon,
  MusicIcon,
  ShopIcon,
  SparkleIcon,
  VaseIcon,
} from './Icons'
import { StampPreview } from './PaintTools'
import { AnimalAvatar } from './VillageHUD'
import { useIsTouch } from './useIsTouch'

// Lojinha do ateliê: todos os itens desde o começo, os bloqueados em silhueta.
// Só moedinhas ganhas com os bichinhos (nada de dinheiro de verdade).

/** Desenho do item (a silhueta dos bloqueados vem do CSS) */
function ItemIcon({ item, size = 40 }: { item: ShopItem; size?: number }) {
  let icon: ReactNode
  switch (item.category) {
    case 'colors': {
      const hex = PALETTE[colorIndex(item.ref ?? '')]?.hex ?? '#ccc'
      icon = (
        <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
          <circle cx="20" cy="20" r="16" fill={hex} stroke="rgba(107,79,63,0.25)" strokeWidth="2" />
          <circle cx="14" cy="14" r="4" fill="rgba(255,255,255,0.45)" />
        </svg>
      )
      break
    }
    case 'stamps':
      icon = <StampPreview id={item.ref as StampId} color="#C98B6E" size={size} />
      break
    case 'tools':
      icon = item.ref ? <HoleIcon shape={item.ref as 'star'} size={size} /> : <FluteIcon size={size} />
      break
    case 'handles':
      icon = item.ref === 'ear' ? <HandleEarIcon size={size} /> : item.ref === 'double' ? <HandleDoubleIcon size={size} /> : <HandleTallIcon size={size} />
      break
    case 'prepared':
    case 'clays':
      icon = <ClayIcon size={size} />
      break
    case 'shapes':
      icon = <VaseIcon size={size} />
      break
    case 'decor':
      icon = <LampIcon size={size} />
      break
    case 'music':
      icon = <MusicIcon size={size} />
      break
    default:
      icon = <SparkleIcon size={size} />
  }
  return <span className="shop-item__icon">{icon}</span>
}

function Price({ value }: { value: number }) {
  return (
    <span className="shop-price">
      <CoinIcon size={16} />
      {value}
    </span>
  )
}

function ItemCard({ item, onSelect, selected }: { item: ShopItem; onSelect: () => void; selected: boolean }) {
  const { t } = useTranslation()
  const owned = useGameStore((s) => s.purchases.includes(item.id))
  const done = useGameStore((s) => (s.village.challengesDone ?? []).includes(item.id))
  const state = owned ? 'is-owned' : item.soon ? 'is-soon is-locked' : 'is-locked'
  return (
    <button type="button" className={`shop-item ${state}${selected ? ' is-selected' : ''}`} aria-pressed={selected} onClick={onSelect}>
      {item.challenge && (
        <span className="shop-item__animal" title={t(`village.animals.${item.challenge}.name`)}>
          <AnimalAvatar id={item.challenge} size={28} />
          {done && (
            <span className="shop-item__done">
              <CheckIcon size={12} />
            </span>
          )}
        </span>
      )}
      <ItemIcon item={item} />
      <span className="shop-item__name">{t(`shop.items.${item.id}`)}</span>
      <span className="shop-item__foot">
        {owned ? t('shop.ownedShort') : item.soon ? t('shop.soon') : <Price value={item.price} />}
      </span>
    </button>
  )
}

/** Detalhe do item escolhido, com o botão de comprar */
function ItemDetail({ item }: { item: ShopItem }) {
  const { t } = useTranslation()
  const coins = useGameStore((s) => s.coins)
  const owned = useGameStore((s) => s.purchases.includes(item.id))
  const done = useGameStore((s) => (s.village.challengesDone ?? []).includes(item.id))
  const buyItem = useGameStore((s) => s.buyItem)
  const showToast = useGameStore((s) => s.showToast)

  const buy = () => {
    if (!buyItem(item.id, item.price)) return
    playEffect('ding', { rate: 1.4, volume: 0.6 })
    for (let k = 0; k < 3; k++) window.setTimeout(() => playEffect('pop', { rate: 1.5 + k * 0.15, volume: 0.35 }), 200 + k * 110)
    showToast(item.challenge ? 'shop.boughtChallenge' : 'shop.bought')
  }

  let action: ReactNode
  if (owned) action = <Button disabled icon={<CheckIcon />}>{t('shop.owned')}</Button>
  else if (item.soon) action = <Button disabled>{t('shop.soon')}</Button>
  else if (coins < item.price) action = <Button disabled>{t('shop.missing', { n: item.price - coins })}</Button>
  else
    action = (
      <Button variant="primary" icon={<CoinIcon />} onClick={buy}>
        {t('shop.buy', { price: item.price })}
      </Button>
    )

  const animalName = item.challenge ? t(`village.animals.${item.challenge}.name`) : ''
  return (
    <div className={`shop-detail ${owned ? 'is-owned' : 'is-locked'}`}>
      <ItemIcon item={item} size={56} />
      <div className="shop-detail__text">
        <strong>{t(`shop.items.${item.id}`)}</strong>
        <span>{t(`shop.desc.${item.category}`)}</span>
        {item.challenge && (
          <span className="shop-detail__challenge">
            <AnimalAvatar id={item.challenge} size={24} />
            {done ? t('shop.challengeDone', { name: animalName }) : t('shop.challenge', { name: animalName })}
          </span>
        )}
      </div>
      <div className="shop-detail__action">{action}</div>
    </div>
  )
}

export function ShopScreen() {
  const { t } = useTranslation()
  const touch = useIsTouch()
  const open = useGameStore((s) => s.shopOpen)
  const coins = useGameStore((s) => s.coins)
  const setOpen = useGameStore((s) => s.setShopOpen)
  const [selected, setSelected] = useState<string | null>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    // primeira visita: presente para conhecer a lojinha comprando um item
    const s = useGameStore.getState()
    if (!s.village.welcomeGift) {
      s.addCoins(WELCOME_COINS)
      s.setVillage({ welcomeGift: true })
      s.showToast('shop.welcome')
      playEffect('ding', { rate: 1.3, volume: 0.6 })
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, setOpen])

  if (!open) return null
  const item = selected ? itemById(selected) : undefined

  return (
    <div className="dialog-backdrop shop-backdrop" onPointerDown={(e) => e.target === e.currentTarget && setOpen(false)}>
      <div className={`shop card ${touch ? 'shop--sheet' : ''}`} role="dialog" aria-modal="true" aria-labelledby="shop-title">
        <div className="shop__head">
          <span className="options__badge shop__badge">
            <ShopIcon />
          </span>
          <h2 id="shop-title">{t('shop.title')}</h2>
          <span className="shop-coins" aria-label={t('shop.coinsLabel', { n: coins })}>
            <CoinIcon size={22} />
            {coins}
          </span>
          <Button ref={closeRef} variant="icon" aria-label={t('shop.close')} icon={<CloseIcon />} onClick={() => setOpen(false)} />
        </div>
        <p className="shop__intro">{t('shop.intro')}</p>

        <div className="shop__list">
          {CATEGORIES.map((c) => (
            <section key={c} className="shop__section">
              <p className="caption">{t(`shop.categories.${c}`)}</p>
              <div className="shop-grid">
                {CATALOG_ITEMS.filter((i) => i.category === c).map((i) => (
                  <ItemCard key={i.id} item={i} selected={selected === i.id} onSelect={() => setSelected(i.id)} />
                ))}
              </div>
            </section>
          ))}
        </div>

        {item && <ItemDetail item={item} />}
      </div>
    </div>
  )
}
