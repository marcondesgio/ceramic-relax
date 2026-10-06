import { useEffect, useState } from 'react'

const QUERY = '(pointer: coarse)'

/** true em aparelhos de toque (celular/tablet): mostra o pedal e textos de toque */
export function useIsTouch() {
  const [touch, setTouch] = useState(() => window.matchMedia(QUERY).matches)
  useEffect(() => {
    const mq = window.matchMedia(QUERY)
    const onChange = () => setTouch(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return touch
}
