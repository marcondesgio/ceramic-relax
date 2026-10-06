import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameStore } from '../store/useGameStore'

const DURATION = 2600

/** Aviso curto no centro da tela, que some sozinho */
export function Toast() {
  const { t } = useTranslation()
  const toast = useGameStore((s) => s.toast)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!toast) return
    setVisible(true)
    const id = window.setTimeout(() => setVisible(false), DURATION)
    return () => window.clearTimeout(id)
  }, [toast])

  if (!toast || !visible) return null
  return (
    <div className="toast" role="status">
      <div className="hint" key={toast.id}>
        {t(toast.key)}
      </div>
    </div>
  )
}
