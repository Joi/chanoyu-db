import Link from 'next/link'
import { ReactNode } from 'react'

/**
 * Card Component - Tea Ceremony Aesthetic
 *
 * Philosophy: Embraces wabi-sabi (simplicity, natural imperfection)
 * Uses ma (negative space) for breathing room
 *
 * Future: Consider migrating to semantic <article> HTML
 * for accessibility and SEO benefits
 */

interface CardProps {
  /** Optional link destination */
  href?: string
  /** Card title (can be string or React element for bilingual) */
  title: string | ReactNode
  /** Optional subtitle */
  subtitle?: string
  /** Card content */
  children?: ReactNode
  /** Additional CSS classes */
  className?: string
}

export default function Card({
  href,
  title,
  subtitle,
  children,
  className = ''
}: CardProps) {
  const content = (
    <>
      <div className="font-medium text-foreground">{title}</div>
      {subtitle && (
        <div className="text-sm text-muted-foreground mt-1">{subtitle}</div>
      )}
      {children && <div className="mt-3">{children}</div>}
    </>
  )

  // If href provided, render as link
  if (href) {
    return (
      <Link
        href={href}
        className={`card block hover:no-underline ${className}`}
      >
        {content}
      </Link>
    )
  }

  // Otherwise, render as div
  return <div className={`card ${className}`}>{content}</div>
}

/**
 * Example Usage:
 *
 * // Simple card
 * <Card title="Tea Bowl" subtitle="Raku ware, 16th century" />
 *
 * // Linked card
 * <Card
 *   href="/id/abc123"
 *   title="Black Raku chawan"
 *   subtitle="ITO-2025-001"
 * >
 *   <p>A beautiful example of wabi-sabi aesthetics...</p>
 * </Card>
 *
 * // Bilingual card (structural approach)
 * <Card title={
 *   <>
 *     <span lang="en">Tea Bowl</span>
 *     <span lang="ja">茶碗</span>
 *   </>
 * } />
 */
