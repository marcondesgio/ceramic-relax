import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './i18n'
import './ui/ui.css'
import './ui/screens.css'
import './ui/prep.css'
import './ui/finishing.css'
import './ui/village.css'
import './ui/shop.css'
import './ui/paint.css'
import './ui/kiln.css'
import './ui/options.css'
import { Analytics } from '@vercel/analytics/react'
import { App } from './app/App'
import { hydrate, startAutosave } from './store/saveGame'

// carrega o jogo salvo no aparelho antes da primeira tela (sem piscar idioma ou volume)
void hydrate().then(() => {
  startAutosave()
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
      {/* visitantes e páginas no painel da Vercel (só conta no site publicado) */}
      <Analytics />
    </StrictMode>,
  )
})
