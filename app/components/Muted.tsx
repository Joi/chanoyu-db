export default function Muted({ children, className }: { children: React.ReactNode, className?: string }) {
  return <p className={["text-[color:var(--ink-subtle)] text-sm", className].filter(Boolean).join(' ')}>{children}</p>
}


