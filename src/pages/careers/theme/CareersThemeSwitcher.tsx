import React, { useEffect, useRef, useState } from 'react'
import { Building2, ChevronUp } from 'lucide-react'
import clsx from 'clsx'
import { CAREERS_THEME_LIST } from './careersTheme'
import { useCareersTheme } from './CareersThemeContext'

export function CareersThemeSwitcher() {
  const { themeId, theme, setThemeId } = useCareersTheme()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  return (
    <div
      ref={rootRef}
      className={clsx(
        'fixed bottom-4 right-4 z-50',
        themeId === 'igs' && 'igs-theme-switcher'
      )}
    >
      {open && (
        <div
          className={clsx(
            'mb-2 w-56 rounded-xl border shadow-lg overflow-hidden',
            themeId === 'igs'
              ? 'bg-white border-slate-200 text-slate-800 shadow-xl'
              : 'bg-white border-slate-200 text-slate-800'
          )}
          role="listbox"
          aria-label="Company careers theme"
        >
          <p
            className={clsx(
              'px-3 py-2 text-[10px] font-bold uppercase tracking-wider',
              themeId === 'igs' ? 'text-white/50' : 'text-slate-400'
            )}
          >
            Company view
          </p>
          {CAREERS_THEME_LIST.map((t) => (
            <button
              key={t.id}
              type="button"
              role="option"
              aria-selected={themeId === t.id}
              onClick={() => {
                setThemeId(t.id)
                setOpen(false)
              }}
              className={clsx(
                'w-full text-left px-3 py-2.5 text-sm font-medium transition-colors',
                themeId === t.id
                  ? t.id === 'igs'
                    ? 'bg-blue-50 text-[#0066ff]'
                    : 'bg-emerald-50 text-[#0f3d38]'
                  : 'hover:bg-slate-50 text-slate-700'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={clsx(
          'flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold shadow-lg border transition-all',
          themeId === 'igs'
            ? 'bg-white border-slate-200 text-slate-800 hover:border-[#0066ff]/40'
            : 'bg-white border-slate-200 text-slate-800 hover:border-[#0f3d38]/30'
        )}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <Building2 size={16} className={themeId === 'igs' ? 'text-[#0066ff]' : 'text-[#0f3d38]'} />
        <span className="max-w-[120px] truncate">{theme.label}</span>
        <ChevronUp
          size={14}
          className={clsx('transition-transform opacity-60', open ? 'rotate-0' : 'rotate-180')}
        />
      </button>
    </div>
  )
}
