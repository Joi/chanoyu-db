'use client'

import React, { ReactNode, useEffect, useState } from 'react'
import { Check, Loader2, AlertCircle } from 'lucide-react'
import { Button } from './Button'

/**
 * FormCard Component - Tea Ceremony Aesthetic Form Wrapper
 *
 * Philosophy: Embraces the concept of 間 (ma - negative space) to create
 * breathing room for form sections. Each card is a self-contained unit
 * of functionality, like individual tea ceremony movements that together
 * create the complete experience.
 *
 * Design Notes:
 * - 侘び (wabi): Simple, uncluttered interface
 * - 渋い (shibui): Subtle elegance in state transitions
 * - 幽玄 (yugen): Depth through minimal visual elements
 */

export interface FormCardProps {
  /** Card title (can be bilingual via ReactNode) */
  title: string | ReactNode
  /** Japanese title (deprecated - use ReactNode title instead) */
  titleJa?: string
  /** Form content */
  children: ReactNode
  /** Save handler - returns promise for async operations */
  onSave?: () => Promise<void>
  /** Indicates if form has unsaved changes */
  isDirty?: boolean
  /** Loading state during save */
  isSaving?: boolean
  /** Success state after save */
  saveSuccess?: boolean
  /** Error message to display */
  saveError?: string
  /** Additional CSS classes */
  className?: string
}

export default function FormCard({
  title,
  titleJa,
  children,
  onSave,
  isDirty = false,
  isSaving = false,
  saveSuccess = false,
  saveError,
  className = ''
}: FormCardProps) {
  const [showSuccess, setShowSuccess] = useState(false)

  // Auto-hide success message after 3 seconds
  useEffect(() => {
    if (saveSuccess) {
      setShowSuccess(true)
      const timer = setTimeout(() => {
        setShowSuccess(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [saveSuccess])

  // Build title element with optional Japanese
  const titleElement = titleJa ? (
    <div className="flex items-baseline gap-2">
      <span lang="en">{title}</span>
      <span className="text-shibui/60">·</span>
      <span lang="ja" className="text-sm">{titleJa}</span>
    </div>
  ) : (
    title
  )

  return (
    <div
      className={`
        bg-card rounded-lg border border-shibui/20
        overflow-hidden transition-all duration-300
        ${className}
      `}
    >
      {/* Card Header with Title and Save Button */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-shibui/10">
        <h3 className="text-lg font-medium text-yugen">
          {titleElement}
        </h3>

        {/* Save Controls */}
        {onSave && (
          <div className="flex items-center gap-3">
            {/* Status Indicators */}
            {showSuccess && !isSaving && (
              <div className="flex items-center gap-1.5 text-matcha animate-in fade-in duration-300">
                <Check className="w-4 h-4" />
                <span className="text-sm">Saved</span>
              </div>
            )}

            {saveError && !isSaving && (
              <div className="flex items-center gap-1.5 text-destructive animate-in fade-in duration-300">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{saveError}</span>
              </div>
            )}

            {/* Save Button */}
            <Button
              onClick={onSave}
              disabled={!isDirty || isSaving}
              variant="primary"
              size="sm"
              className={`
                bg-matcha text-white hover:bg-matcha/90
                disabled:opacity-50 disabled:cursor-not-allowed
                min-w-[80px] transition-all
                ${isDirty && !isSaving ? 'animate-in fade-in duration-200' : ''}
              `}
            >
              {isSaving ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving</span>
                </div>
              ) : (
                'Save'
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Card Content with Ma (spacing) */}
      <div className="p-6">
        {children}
      </div>
    </div>
  )
}

/**
 * Example Usage:
 *
 * // Simple form card
 * <FormCard title="Basic Information">
 *   <form>...</form>
 * </FormCard>
 *
 * // Bilingual with save capability
 * <FormCard
 *   title="Description"
 *   titleJa="説明"
 *   onSave={async () => await saveData()}
 *   isDirty={hasChanges}
 *   isSaving={saving}
 *   saveSuccess={saved}
 *   saveError={error}
 * >
 *   <textarea />
 * </FormCard>
 *
 * // Using ReactNode for complex bilingual title
 * <FormCard
 *   title={
 *     <BilingualLabel en="Measurements" ja="寸法" />
 *   }
 * >
 *   <input type="number" />
 * </FormCard>
 */