import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameStore } from '../store/useGameStore'
import { Button } from './Button'
import { OptionsIcon, SoundIcon, SoundOffIcon } from './Icons'

/**
 * Botões do canto superior direito presentes em todas as telas:
 * `before` (ex.: desfazer, PT/EN), som liga/desliga e opções.
 */
export function TopControls({ before, sound = true }: { before?: ReactNode; sound?: boolean }) {
  const { t } = useTranslation()
  const muted = useGameStore((s) => s.settings.muted)
  const update = useGameStore((s) => s.updateSettings)
  const setOptionsOpen = useGameStore((s) => s.setOptionsOpen)

  return (
    <div className="top-controls">
      {before}
      {sound && (
        <Button
          variant="icon"
          aria-label={muted ? t('options.soundOn') : t('options.soundOff')}
          aria-pressed={!muted}
          icon={muted ? <SoundOffIcon /> : <SoundIcon />}
          onClick={() => update({ muted: !muted })}
        />
      )}
      <Button variant="icon" aria-label={t('options.open')} icon={<OptionsIcon />} onClick={() => setOptionsOpen(true)} />
    </div>
  )
}
