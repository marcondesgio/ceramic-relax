import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameStore } from '../store/useGameStore'
import { captureResultImage, shareOrDownload } from '../kiln/saveImage'
import { deliverOrder } from '../village/village'
import { Button } from './Button'
import { AgainIcon, DownloadIcon, GiftIcon, HomeIcon, RotateIcon, ShopIcon, SparkleIcon } from './Icons'
import { TopControls } from './TopControls'
import { useIsTouch } from './useIsTouch'

/** Resultado: a peça na prateleira, salvar a imagem ou fazer outra */
export function ResultHUD() {
  const { t } = useTranslation()
  const touch = useIsTouch()
  const finish = useGameStore((s) => s.finish)
  const newPiece = useGameStore((s) => s.newPiece)
  const setPhase = useGameStore((s) => s.setPhase)
  const showToast = useGameStore((s) => s.showToast)
  const crackle = useGameStore((s) => s.crackle)
  const restoreKintsugi = useGameStore((s) => s.restoreKintsugi)
  // pedido de um bichinho: qualquer peça pode ser entregue (só a reação muda)
  const order = useGameStore((s) => s.village.order)
  const delivered = useGameStore((s) => s.deliveredTo !== null)
  const setShopOpen = useGameStore((s) => s.setShopOpen)
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      const blob = await captureResultImage()
      const how = await shareOrDownload(blob, touch)
      if (how === 'downloaded') showToast('result.saved')
      else if (how === 'shared') showToast('result.shared')
    } catch {
      showToast('result.error')
    } finally {
      setSaving(false)
    }
  }

  // início: a peça pronta fica para trás, e "Começar" traz uma bola nova
  const goHome = () => {
    newPiece()
    setPhase('home')
  }

  return (
    <div className={`ui-layer result-hud ${touch ? 'hud--touch' : 'hud--desktop'}`}>
      <div className="hud__top">
        <Button variant="icon" aria-label={t('common.home')} icon={<HomeIcon />} onClick={goHome} />
        {/* lojinha: gastar as moedinhas que os bichinhos deram */}
        <Button variant="icon" aria-label={t('shop.open')} icon={<ShopIcon />} onClick={() => setShopOpen(true)} />
        <span className="hud__spacer" />
        <TopControls />
      </div>
      <div className="result-hud__head">
        <span className="badge">
          <SparkleIcon size={18} />
          {t('result.badge', { finish: t(`kiln.${finish}`) })}
        </span>
        <h1 className="screen-title">{t('result.title')}</h1>
        {crackle && !crackle.kintsugi && <span className="badge badge--crackle">{t('result.crackled')}</span>}
        {/* selo de peça rara (também fica na receita da prateleira) */}
        {crackle?.kintsugi && (
          <span className="badge badge--rare">
            <SparkleIcon size={18} />
            {t('result.rare')}
          </span>
        )}
      </div>
      <div className="result-hud__bottom">
        <div className="hint">
          <RotateIcon size={18} />
          {touch ? t('result.dragShort') : t('result.drag')}
        </div>
        {order && !delivered && (
          <div className="result-hud__deliver">
            <Button variant="primary" icon={<GiftIcon />} onClick={deliverOrder}>
              {t('village.deliver', { name: t(`village.animals.${order.animal}.name`) })}
            </Button>
          </div>
        )}
        {/* gratuito e sempre disponível: a peça "com defeito" vira conquista. Pode ficar para depois. */}
        {crackle && !crackle.kintsugi && (
          <div className="result-hud__kintsugi">
            <Button className="btn--gold" icon={<SparkleIcon />} onClick={restoreKintsugi}>
              {t('result.kintsugi')}
            </Button>
            <p className="kiln-screen__note">{t('result.kintsugiNote')}</p>
          </div>
        )}
        <div className="result-hud__actions">
          <Button variant="primary" icon={<DownloadIcon />} onClick={save} disabled={saving}>
            {saving ? t('result.saving') : t('result.save')}
          </Button>
          <Button icon={<AgainIcon />} onClick={newPiece}>
            {t('result.again')}
          </Button>
        </div>
        {!touch && <p className="kiln-screen__note">{t('result.note')}</p>}
      </div>
    </div>
  )
}
