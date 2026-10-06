import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameStore } from '../store/useGameStore'
import { captureResultImage, shareOrDownload } from '../kiln/saveImage'
import { Button } from './Button'
import { AgainIcon, DownloadIcon, HomeIcon, RotateIcon, SparkleIcon } from './Icons'
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
        <span className="hud__spacer" />
        <TopControls />
      </div>
      <div className="result-hud__head">
        <span className="badge">
          <SparkleIcon size={18} />
          {t('result.badge', { finish: t(`kiln.${finish}`) })}
        </span>
        <h1 className="screen-title">{t('result.title')}</h1>
      </div>
      <div className="result-hud__bottom">
        <div className="hint">
          <RotateIcon size={18} />
          {touch ? t('result.dragShort') : t('result.drag')}
        </div>
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
