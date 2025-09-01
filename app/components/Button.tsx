import Link from 'next/link'

type CommonProps = {
  children: React.ReactNode
  className?: string
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md'
}

function baseClasses(variant: NonNullable<CommonProps['variant']>, size: NonNullable<CommonProps['size']>) {
  const base = 'inline-flex items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'
  const sizing = size === 'sm' ? 'px-3 py-2 text-sm' : 'px-4 py-2'
  const palette = variant === 'primary'
    ? 'bg-[color:var(--link)] text-white hover:bg-[color:var(--link)]/90 focus-visible:ring-[color:var(--link)]'
    : variant === 'secondary'
    ? 'bg-white text-ink border border-[color:var(--line)] hover:bg-neutral-50 focus-visible:ring-[color:var(--link)]'
    : variant === 'danger'
    ? 'bg-white text-red-700 border border-red-200 hover:border-red-300 focus-visible:ring-red-400'
    : 'bg-transparent text-ink hover:bg-neutral-50 focus-visible:ring-[color:var(--link)]'
  return [base, sizing, palette].join(' ')
}

export function Button({ children, className, variant = 'primary', size = 'md', ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & CommonProps) {
  return (
    <button className={[baseClasses(variant, size), className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </button>
  )
}

export function ButtonLink({ href, children, className, variant = 'primary', size = 'md', ...rest }: CommonProps & { href: string } & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <Link href={href} className={[baseClasses(variant, size), className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </Link>
  )
}


