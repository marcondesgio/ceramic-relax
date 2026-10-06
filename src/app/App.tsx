import { useGameStore } from '../store/useGameStore'
import { GameCanvas } from '../scene/GameCanvas'
import { FiringOverlay } from '../ui/FiringOverlay'
import { HomeScreen } from '../ui/HomeScreen'
import { KilnScreen } from '../ui/KilnScreen'
import { ModelingHUD } from '../ui/ModelingHUD'
import { OptionsMenu } from '../ui/OptionsMenu'
import { PaintingHUD } from '../ui/PaintingHUD'
import { ResultHUD } from '../ui/ResultHUD'
import { Toast } from '../ui/Toast'
import { useAudioUnlock } from '../audio/useAudioUnlock'
import { useWheelInput } from '../wheel/useWheelInput'
import { useShortcuts } from './useShortcuts'

/** Uma única cena 3D; a interface por cima troca conforme a fase */
export function App() {
  const phase = useGameStore((s) => s.phase)
  useWheelInput()
  useShortcuts()
  useAudioUnlock()

  return (
    <>
      <GameCanvas />
      {phase === 'home' && <HomeScreen />}
      {phase === 'modeling' && <ModelingHUD />}
      {phase === 'painting' && <PaintingHUD />}
      {phase === 'kiln' && <KilnScreen />}
      {phase === 'firing' && <FiringOverlay />}
      {phase === 'result' && <ResultHUD />}
      <Toast />
      <OptionsMenu />
    </>
  )
}
