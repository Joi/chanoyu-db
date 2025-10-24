import React from 'react'

/**
 * BilingualLabel Component - Harmonious Japanese-English Labels
 *
 * Philosophy: Reflects the tea ceremony concept of 和 (wa - harmony)
 * by presenting both languages with equal dignity and visual balance.
 * The subtle divider creates a pause (間 ma) between languages without
 * creating visual separation.
 *
 * Design Notes:
 * - Languages marked with proper lang attributes for accessibility
 * - Subtle middle dot separator inspired by Japanese typography
 * - Required indicator follows common form patterns
 * - Text color uses shibui (subtle elegance) from the design system
 */

export interface BilingualLabelProps {
  /** English text */
  en: string
  /** Japanese text */
  ja: string
  /** Associates label with form input for accessibility */
  htmlFor?: string
  /** Shows required indicator */
  required?: boolean
  /** Additional CSS classes */
  className?: string
}

export default function BilingualLabel({
  en,
  ja,
  htmlFor,
  required = false,
  className = ''
}: BilingualLabelProps) {
  const content = (
    <>
      {/* English text with proper language attribute */}
      <span lang="en">{en}</span>

      {/* Subtle divider - the pause between languages */}
      <span className="text-shibui/40 px-1.5" aria-hidden="true">
        ·
      </span>

      {/* Japanese text with proper language attribute */}
      <span lang="ja" className="text-shibui/80">
        {ja}
      </span>

      {/* Required indicator */}
      {required && (
        <span className="text-destructive ml-1" aria-label="required">
          *
        </span>
      )}
    </>
  )

  // If htmlFor provided, render as label element
  if (htmlFor) {
    return (
      <label
        htmlFor={htmlFor}
        className={`text-sm font-medium text-shibui inline-flex items-baseline ${className}`}
      >
        {content}
      </label>
    )
  }

  // Otherwise render as span
  return (
    <span className={`text-sm font-medium text-shibui inline-flex items-baseline ${className}`}>
      {content}
    </span>
  )
}

/**
 * Example Usage:
 *
 * // Simple bilingual label
 * <BilingualLabel en="Name" ja="名前" />
 *
 * // As form label with association
 * <BilingualLabel
 *   en="Description"
 *   ja="説明"
 *   htmlFor="description-input"
 *   required
 * />
 * <textarea id="description-input" />
 *
 * // Inline usage in forms
 * <div className="space-y-2">
 *   <BilingualLabel en="Tea Bowl" ja="茶碗" htmlFor="bowl-type" />
 *   <select id="bowl-type">
 *     <option>Raku</option>
 *     <option>Hagi</option>
 *   </select>
 * </div>
 *
 * // Can be used as card titles
 * <FormCard
 *   title={<BilingualLabel en="Basic Information" ja="基本情報" />}
 * >
 *   ...
 * </FormCard>
 */