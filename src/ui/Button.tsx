import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'icon'
  icon?: ReactNode
  ref?: Ref<HTMLButtonElement>
}

/** Botão em pílula com base sólida e animação "squish" ao toque */
export function Button({ variant = 'secondary', icon, children, className = '', ...rest }: ButtonProps) {
  const cls = ['btn', variant === 'primary' && 'btn--primary', variant === 'icon' && 'btn--icon', className]
    .filter(Boolean)
    .join(' ')
  return (
    <button type="button" className={cls} {...rest}>
      {icon}
      {children}
    </button>
  )
}
