import type { ReactNode, SVGProps } from 'react'

// Ícones de traço grosso e arredondado (2,4 px na grade de 24)

function Icon({ children, size = 26, ...rest }: SVGProps<SVGSVGElement> & { size?: number; children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  )
}

type P = SVGProps<SVGSVGElement> & { size?: number }

export const HomeIcon = (p: P) => (
  <Icon {...p}>
    <path d="M4 11.2 12 4.5l8 6.7" />
    <path d="M6.3 9.6V19h11.4V9.6" />
    <path d="M10.2 19v-4.4h3.6V19" />
  </Icon>
)

export const UndoIcon = (p: P) => (
  <Icon {...p}>
    <path d="M8.5 5 4.5 9l4 4" />
    <path d="M5 9h8.5a5.5 5.5 0 0 1 0 11H10" />
  </Icon>
)

export const SparkleIcon = (p: P) => (
  <Icon {...p}>
    <path d="M10 3.5c.6 3.6 2.4 5.4 6 6-3.6.6-5.4 2.4-6 6-.6-3.6-2.4-5.4-6-6 3.6-.6 5.4-2.4 6-6Z" />
    <path d="M18 14.5v5M15.5 17h5" />
  </Icon>
)

export const BrushIcon = (p: P) => (
  <Icon {...p}>
    <path d="m14.5 5.5 4 4L9 19H5v-4l9.5-9.5Z" />
    <path d="m12.5 7.5 4 4" />
  </Icon>
)

export const WheelIcon = (p: P) => (
  <Icon {...p}>
    <path d="M5 7.5h14" />
    <path d="M7 7.5c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5" />
    <path d="M12 10v6" />
    <path d="M7.5 19h9" />
    <path d="M9.5 16h5l1 3h-7l1-3Z" />
  </Icon>
)

export const PedalIcon = (p: P) => (
  <Icon {...p}>
    <rect x="8" y="3.5" width="8" height="17" rx="4" />
    <path d="M12 8v3" />
  </Icon>
)

export const BackIcon = (p: P) => (
  <Icon {...p}>
    <path d="M14.5 5.5 8 12l6.5 6.5" />
  </Icon>
)

export const BandsIcon = (p: P) => (
  <Icon {...p}>
    <path d="M9 4h6v2.2c2.6 1.4 4 3.8 4 6.8 0 4.4-3.1 7-7 7s-7-2.6-7-7c0-3 1.4-5.4 4-6.8Z" />
    <path d="M5.6 11h12.8M5.4 15h13.2" />
  </Icon>
)

export const StarIcon = (p: P) => (
  <Icon {...p}>
    <path d="m12 3.8 2.5 5.1 5.6.8-4 3.9 1 5.6-5.1-2.7-5.1 2.7 1-5.6-4-3.9 5.6-.8Z" />
  </Icon>
)

export const BucketIcon = (p: P) => (
  <Icon {...p}>
    <path d="M5 8h11l-1.2 11a1.6 1.6 0 0 1-1.6 1.4H7.8A1.6 1.6 0 0 1 6.2 19Z" />
    <path d="M7.5 8a3 3 0 0 1 6 0" />
    <path d="M18.5 12.5c.9 1.2 1.5 2.1 1.5 2.9a1.5 1.5 0 0 1-3 0c0-.8.6-1.7 1.5-2.9Z" />
  </Icon>
)

export const EraserIcon = (p: P) => (
  <Icon {...p}>
    <path d="m13.5 4.5 6 6-8.5 8.5H7l-3-3a1.5 1.5 0 0 1 0-2.1Z" />
    <path d="m8.5 9.5 6 6M11 19h9" />
  </Icon>
)

export const KilnIcon = (p: P) => (
  <Icon {...p}>
    <path d="M5 20V11a7 7 0 0 1 14 0v9Z" />
    <path d="M4 20h16" />
    <path d="M10 12.5h.01M14 12.5h.01" />
    <path d="M10 15.5c1.2 1 2.8 1 4 0" />
  </Icon>
)

export const CheckIcon = (p: P) => (
  <Icon {...p}>
    <path d="m5.5 12.5 4 4 9-9" />
  </Icon>
)

export const DownloadIcon = (p: P) => (
  <Icon {...p}>
    <path d="M12 4.5v10M7.5 10.5 12 15l4.5-4.5" />
    <path d="M5.5 19.5h13" />
  </Icon>
)

export const AgainIcon = (p: P) => (
  <Icon {...p}>
    <path d="M19 12a7 7 0 1 1-2.1-5" />
    <path d="M19.5 4.5V9H15" />
  </Icon>
)

export const RotateIcon = (p: P) => (
  <Icon {...p}>
    <path d="M18.5 8.5A7 7 0 0 0 5.6 9" />
    <path d="M18.8 4.8v3.9h-3.9" />
    <path d="M5.5 15.5a7 7 0 0 0 12.9-.5" />
    <path d="M5.2 19.2v-3.9h3.9" />
  </Icon>
)

export const SoundIcon = (p: P) => (
  <Icon {...p}>
    <path d="M4.5 9.5h3l4-3.5v12l-4-3.5h-3Z" />
    <path d="M15.5 9.2a4 4 0 0 1 0 5.6M18 7a7 7 0 0 1 0 10" />
  </Icon>
)

export const SoundOffIcon = (p: P) => (
  <Icon {...p}>
    <path d="M4.5 9.5h3l4-3.5v12l-4-3.5h-3Z" />
    <path d="m16 9.5 5 5M21 9.5l-5 5" />
  </Icon>
)

export const OptionsIcon = (p: P) => (
  <Icon {...p}>
    <path d="M4.5 8h15M4.5 16h15" />
    <circle cx="9" cy="8" r="2.2" fill="var(--surface, #FFFBF5)" />
    <circle cx="15" cy="16" r="2.2" fill="var(--surface, #FFFBF5)" />
  </Icon>
)

export const CloseIcon = (p: P) => (
  <Icon {...p}>
    <path d="m6.5 6.5 11 11M17.5 6.5l-11 11" />
  </Icon>
)

export const MusicIcon = (p: P) => (
  <Icon {...p}>
    <path d="M9 17.5V6l10-2v11.5" />
    <circle cx="6.8" cy="17.5" r="2.2" />
    <circle cx="16.8" cy="15.5" r="2.2" />
  </Icon>
)

export const GlobeIcon = (p: P) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8" />
    <path d="M4 12h16M12 4c2.2 2.3 3.2 5 3.2 8s-1 5.7-3.2 8c-2.2-2.3-3.2-5-3.2-8s1-5.7 3.2-8Z" />
  </Icon>
)

export const LoopIcon = (p: P) => (
  <Icon {...p}>
    <path d="M17 4.5 19.5 7 17 9.5" />
    <path d="M4.5 12V10a3 3 0 0 1 3-3h12" />
    <path d="M7 19.5 4.5 17 7 14.5" />
    <path d="M19.5 12v2a3 3 0 0 1-3 3h-12" />
  </Icon>
)

export const PulseIcon = (p: P) => (
  <Icon {...p}>
    <path d="M3.5 12h4l2-4.5 4 9 2-4.5h5" />
  </Icon>
)

export const VibrateIcon = (p: P) => (
  <Icon {...p}>
    <rect x="8" y="4" width="8" height="16" rx="2.2" />
    <path d="M4.5 9v6M19.5 9v6" />
  </Icon>
)

/** Fio de corte da argila: um fio entre dois cabinhos */
export const CutIcon = (p: P) => (
  <Icon {...p}>
    <path d="M5 4.5v5M19 4.5v5" />
    <path d="M5 7c3.5 4 10.5 4 14 0" />
    <rect x="4" y="13" width="16" height="6.5" rx="2.5" />
  </Icon>
)

/** Rolo de abrir massa */
export const RollIcon = (p: P) => (
  <Icon {...p}>
    <rect x="6" y="8.5" width="12" height="6" rx="3" />
    <path d="M2.5 11.5H6M18 11.5h3.5" />
    <path d="M5 19h14" />
  </Icon>
)

/** Massa dobrada ao meio */
export const FoldIcon = (p: P) => (
  <Icon {...p}>
    <path d="M4 18h16" />
    <path d="M4 14.5h9" />
    <path d="M13 14.5c4 0 6-2 6-4.5s-2-4.5-6-4.5H9" />
    <path d="m11 3-2 2.5 2 2.5" />
  </Icon>
)

/** Esponja com gotinha */
export const SpongeIcon = (p: P) => (
  <Icon {...p}>
    <rect x="3.5" y="9" width="13" height="10" rx="3" />
    <path d="M7 13h.01M10.5 15.5h.01M12.5 12h.01" />
    <path d="M19.5 4.5c1.2 1.6 1.8 2.7 1.8 3.5a1.8 1.8 0 0 1-3.6 0c0-.8.6-1.9 1.8-3.5Z" />
  </Icon>
)

/** Ripador horizontal: pente com dentes sobre sulcos */
export const RibIcon = (p: P) => (
  <Icon {...p}>
    <path d="M5 4.5h14v4H5z" />
    <path d="M7 8.5v3M10.3 8.5v3M13.7 8.5v3M17 8.5v3" />
    <path d="M4 15.5h16M4 19h16" />
  </Icon>
)

/** Vasinho com alça (genérico: ferramenta de alças) */
export const HandleIcon = (p: P) => (
  <Icon {...p}>
    <path d="M6 6h9v10a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3Z" />
    <path d="M15 8.5h1.5a2.5 2.5 0 0 1 0 5H15" />
  </Icon>
)

/** Argola de xícara */
export const HandleRingIcon = (p: P) => (
  <Icon {...p}>
    <path d="M5 8h9v7a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3Z" />
    <circle cx="16.5" cy="12" r="2.6" />
  </Icon>
)

/** Alça orelha de caneca */
export const HandleEarIcon = (p: P) => (
  <Icon {...p}>
    <path d="M4.5 5h10v12a2.5 2.5 0 0 1-2.5 2.5H7A2.5 2.5 0 0 1 4.5 17Z" />
    <path d="M14.5 7h3a2 2 0 0 1 2 2v4a3.5 3.5 0 0 1-3.5 3.5h-1.5" />
  </Icon>
)

/** Alça dupla de ânfora */
export const HandleDoubleIcon = (p: P) => (
  <Icon {...p}>
    <path d="M9.5 4h5M10 4v3c-2.5 1.5-3.5 4-3.5 7a5.5 5.5 0 0 0 11 0c0-3-1-5.5-3.5-7V4" />
    <path d="M7.2 9.5C4.5 9.5 4 12.5 6.6 13.5M16.8 9.5c2.7 0 3.2 3 .6 4" />
  </Icon>
)

/** Alça alta de jarra */
export const HandleTallIcon = (p: P) => (
  <Icon {...p}>
    <path d="M5 7.5h9.5v9.5a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3Z" />
    <path d="M14.5 8c2-4.5 5.5-3.5 5.5 0 0 3.5-2 6.5-5.5 8" />
  </Icon>
)

/** Cadeado (item da lojinha) */
export const LockIcon = (p: P) => (
  <Icon {...p}>
    <rect x="5" y="10.5" width="14" height="9.5" rx="2.5" />
    <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
  </Icon>
)

/** Lixeira (remover) */
export const TrashIcon = (p: P) => (
  <Icon {...p}>
    <path d="M4.5 7h15M9.5 7V4.8h5V7" />
    <path d="M6.5 7l.9 11.2A2 2 0 0 0 9.4 20h5.2a2 2 0 0 0 2-1.8L17.5 7" />
  </Icon>
)

/** Moedinha da lojinha */
export const CoinIcon = (p: P) => (
  <svg width={p.size ?? 26} height={p.size ?? 26} viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="9.5" fill="#F6D27E" stroke="#C9953B" strokeWidth="2" />
    <circle cx="12" cy="12" r="5.6" fill="none" stroke="#E6B453" strokeWidth="1.6" />
    <path d="M12 8.6 13 11l2.5.2-1.9 1.6.6 2.5L12 14l-2.2 1.3.6-2.5-1.9-1.6L11 11Z" fill="#C9953B" />
  </svg>
)

/** Presente (entregar a peça) */
export const GiftIcon = (p: P) => (
  <Icon {...p}>
    <rect x="4" y="9" width="16" height="11" rx="2.5" />
    <path d="M3.5 9h17M12 9v11" />
    <path d="M12 9c-2.5 0-4.5-1-4.5-2.6S9.8 4 12 9c2.2-5 4.5-4.2 4.5-2.6S14.5 9 12 9Z" />
  </Icon>
)

/** Ripador vertical: vaso com gomos */
export const FluteIcon = (p: P) => (
  <Icon {...p}>
    <path d="M7 4h10v3c2 2 3 4.5 3 7.5A7.5 6 0 0 1 4 14.5C4 11.5 5 9 7 7Z" />
    <path d="M9 9v10M12 8v12M15 9v10" />
  </Icon>
)

/** Ponta da espátula de furos: redonda, estrela, coração ou gota */
export const HoleIcon = ({ shape, ...p }: P & { shape: 'round' | 'star' | 'heart' | 'drop' }) => (
  <Icon {...p}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
    {shape === 'round' && <circle cx="12" cy="12" r="3.6" fill="currentColor" />}
    {shape === 'star' && <path d="m12 7.2 1.5 3.1 3.4.4-2.5 2.3.7 3.4-3.1-1.7-3 1.7.6-3.4-2.5-2.3 3.4-.4Z" fill="currentColor" strokeWidth={1.2} />}
    {shape === 'heart' && <path d="M12 16.5c-3-2-4.6-3.6-4.6-5.4a2.4 2.4 0 0 1 4.6-1 2.4 2.4 0 0 1 4.6 1c0 1.8-1.6 3.4-4.6 5.4Z" fill="currentColor" strokeWidth={1.2} />}
    {shape === 'drop' && <path d="M12 6.8c2 2.6 3.2 4.4 3.2 6a3.2 3.2 0 0 1-6.4 0c0-1.6 1.2-3.4 3.2-6Z" fill="currentColor" strokeWidth={1.2} />}
  </Icon>
)

/** Sacolinha da lojinha */
export const ShopIcon = (p: P) => (
  <Icon {...p}>
    <path d="M5 8.5h14l-1.2 10.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8Z" />
    <path d="M9 10V7.5a3 3 0 0 1 6 0V10" />
  </Icon>
)

/** Bola de argila (argilas e argila preparada) */
export const ClayIcon = (p: P) => (
  <Icon {...p}>
    <path d="M12 4.5c4.5 0 7.5 3.4 7.5 7.6 0 4.6-3.4 7.4-7.5 7.4S4.5 16.7 4.5 12.1C4.5 7.9 7.5 4.5 12 4.5Z" />
    <path d="M8.5 10.5c1.5-1.5 3.5-2 5.5-1.5" />
  </Icon>
)

/** Vaso (formas iniciais) */
export const VaseIcon = (p: P) => (
  <Icon {...p}>
    <path d="M9 3.5h6v3.2c2.6 1.6 4 4.2 4 7.3 0 3.9-3.1 6.5-7 6.5s-7-2.6-7-6.5c0-3.1 1.4-5.7 4-7.3Z" />
  </Icon>
)

/** Luminária (decoração do ateliê) */
export const LampIcon = (p: P) => (
  <Icon {...p}>
    <path d="M8 4h8l3 7H5Z" />
    <path d="M12 11v7M8.5 20h7" />
  </Icon>
)

/** Paleta de cores */
export const PaletteIcon = (p: P) => (
  <Icon {...p}>
    <path d="M12 4a8 8 0 1 0 0 16c1.4 0 2-1 1.5-2.1-.6-1.2.2-2.4 1.6-2.4H17a3 3 0 0 0 3-3c0-4.7-3.6-8.5-8-8.5Z" />
    <circle cx="8" cy="11" r="1.2" fill="currentColor" />
    <circle cx="11" cy="7.8" r="1.2" fill="currentColor" />
    <circle cx="15" cy="8.6" r="1.2" fill="currentColor" />
  </Icon>
)
