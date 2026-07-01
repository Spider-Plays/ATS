import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useGoBack } from '@/hooks/useGoBack'
import clsx from 'clsx'

type BackButtonVariant = 'default' | 'igs' | 'muted'

type BackButtonProps = {
  /** Used when browser history is unavailable; also the direct target when `to` is set. */
  fallback: string
  /** When set, always navigate here (Link) instead of history back. */
  to?: string
  label?: string
  className?: string
  variant?: BackButtonVariant
  showIcon?: boolean
}

export function backButtonClass(
  variant: BackButtonVariant = 'default',
  className?: string,
) {
  return clsx(
    'inline-flex items-center justify-center gap-1.5 text-sm font-bold transition-colors',
    (variant === 'default' || variant === 'muted') &&
      'btn-tonal !h-9 !px-4 !rounded-xl !text-slate-700 dark:!text-slate-200',
    variant === 'igs' &&
      'h-9 px-4 rounded-xl border border-slate-200 bg-white text-[#0a1628] hover:bg-slate-50 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800',
    className,
  )
}

export function BackButton({
  fallback,
  to,
  label = 'Back',
  className,
  variant = 'default',
  showIcon = true,
}: BackButtonProps) {
  const goBack = useGoBack(fallback)
  const classes = backButtonClass(variant, className)
  const content = (
    <>
      {showIcon && <ArrowLeft size={16} aria-hidden />}
      {label}
    </>
  )

  if (to) {
    return (
      <Link to={to} className={classes}>
        {content}
      </Link>
    )
  }

  return (
    <button type="button" onClick={goBack} className={classes}>
      {content}
    </button>
  )
}
