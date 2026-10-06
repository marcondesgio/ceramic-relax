import { useEffect, useRef, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameStore, type Settings } from '../store/useGameStore'
import type { Lang } from '../i18n'
import { Button } from './Button'
import { CheckIcon, CloseIcon, GlobeIcon, LoopIcon, MusicIcon, OptionsIcon, PulseIcon, SparkleIcon, VibrateIcon } from './Icons'
import { useIsTouch } from './useIsTouch'

/** Linha com ícone, rótulo (e descrição) e um controle à direita */
function Row({ icon, label, desc, children }: { icon: ReactNode; label: string; desc?: string; children: ReactNode }) {
  return (
    <div className="opt-row">
      <span className="opt-row__icon">{icon}</span>
      <span className="opt-row__text">
        <strong>{label}</strong>
        {desc && <span>{desc}</span>}
      </span>
      <span className="opt-row__control">{children}</span>
    </div>
  )
}

/** Volume em pílula: trilho sálvia preenchido + porcentagem */
function Volume({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  const pct = Math.round(value * 100)
  return (
    <span className="volume">
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={pct}
        aria-label={label}
        style={{ ['--fill' as string]: `${pct}%` }}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
      />
      <span className="volume__pct">{pct}%</span>
    </span>
  )
}

/** Interruptor (trilho 56 × 32, alça 32 px) */
function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} className="switch" onClick={() => onChange(!checked)}>
      <span className="switch__knob" />
    </button>
  )
}

/** Menu de opções: volumes, idioma e conforto. Janela no desktop, folha inferior no celular. */
export function OptionsMenu() {
  const { t } = useTranslation()
  const touch = useIsTouch()
  const open = useGameStore((s) => s.optionsOpen)
  const settings = useGameStore((s) => s.settings)
  const update = useGameStore((s) => s.updateSettings)
  const setLang = useGameStore((s) => s.setLang)
  const setOpen = useGameStore((s) => s.setOptionsOpen)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, setOpen])

  if (!open) return null
  const set = (patch: Partial<Settings>) => update(patch)
  const langs: Lang[] = ['pt', 'en']

  return (
    <div className="dialog-backdrop options-backdrop" onPointerDown={(e) => e.target === e.currentTarget && setOpen(false)}>
      <div className={`options card ${touch ? 'options--sheet' : ''}`} role="dialog" aria-modal="true" aria-labelledby="opt-title">
        {touch && <span className="options__grabber" aria-hidden="true" />}
        <div className="options__head">
          <span className="options__badge">
            <OptionsIcon />
          </span>
          <h2 id="opt-title">{t('options.title')}</h2>
          <Button ref={closeRef} variant="icon" aria-label={t('options.close')} icon={<CloseIcon />} onClick={() => setOpen(false)} />
        </div>

        <p className="caption">{t('options.sound')}</p>
        <Row icon={<MusicIcon />} label={t('options.music')}>
          <Volume label={t('options.music')} value={settings.musicVolume} onChange={(v) => set({ musicVolume: v })} />
        </Row>
        <Row icon={<SparkleIcon />} label={t('options.effects')}>
          <Volume label={t('options.effects')} value={settings.sfxVolume} onChange={(v) => set({ sfxVolume: v })} />
        </Row>

        <hr />
        <Row icon={<GlobeIcon />} label={t('options.language')}>
          <div className="segmented" role="group" aria-label={t('options.language')}>
            {langs.map((l) => (
              <button key={l} type="button" aria-pressed={settings.lang === l} onClick={() => setLang(l)}>
                {touch ? t(`lang.${l}`) : t(`options.langNames.${l}`)}
              </button>
            ))}
          </div>
        </Row>
        <hr />

        <p className="caption">{t('options.comfort')}</p>
        <Row icon={<LoopIcon />} label={t('options.wheelAlwaysOn')} desc={t('options.wheelAlwaysOnDesc')}>
          <Switch label={t('options.wheelAlwaysOn')} checked={settings.wheelAlwaysOn} onChange={(v) => set({ wheelAlwaysOn: v })} />
        </Row>
        <Row icon={<PulseIcon />} label={t('options.reduceMotion')} desc={t('options.reduceMotionDesc')}>
          <Switch label={t('options.reduceMotion')} checked={settings.reduceMotion} onChange={(v) => set({ reduceMotion: v })} />
        </Row>
        <Row
          icon={<VibrateIcon />}
          label={t('options.vibration')}
          desc={touch ? t('options.vibrationDescShort') : t('options.vibrationDesc')}
        >
          <Switch label={t('options.vibration')} checked={settings.vibration} onChange={(v) => set({ vibration: v })} />
        </Row>

        <div className="options__foot">
          <Button variant="primary" icon={<CheckIcon />} onClick={() => setOpen(false)}>
            {t('options.done')}
          </Button>
        </div>
      </div>
    </div>
  )
}
