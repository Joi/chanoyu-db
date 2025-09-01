type Props = {
  level?: 1 | 2 | 3 | 4
  children: React.ReactNode
  className?: string
}

export default function Title({ level = 1, children, className }: Props) {
  const Tag = (`h${level}` as unknown) as keyof JSX.IntrinsicElements
  const size =
    level === 1 ? 'text-[2.125rem] leading-tight' :
    level === 2 ? 'text-[1.5rem] leading-snug' :
    level === 3 ? 'text-xl' : 'text-lg'

  return (
    <Tag className={[
      'font-serif',
      size,
      className,
    ].filter(Boolean).join(' ')}>
      {children}
    </Tag>
  )
}


