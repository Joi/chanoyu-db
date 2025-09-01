import React from 'react'
export default function Separator({ className }: { className?: string }) {
  return <div className={["h-px bg-[color:var(--line)]", className].filter(Boolean).join(' ')} />
}


