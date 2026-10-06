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
