import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'
import {
  CAREERS_THEME_STORAGE_KEY,
  CAREERS_THEMES,
  type CareersThemeConfig,
  type CareersThemeId,
  isCareersThemeId,
} from './careersTheme'

type CareersThemeContextValue = {
  themeId: CareersThemeId
  theme: CareersThemeConfig
  setThemeId: (id: CareersThemeId) => void
}

const CareersThemeContext = createContext<CareersThemeContextValue | null>(null)

function readStoredTheme(): CareersThemeId {
  try {
    const raw = localStorage.getItem(CAREERS_THEME_STORAGE_KEY)
    if (isCareersThemeId(raw)) return raw
  } catch {
    /* ignore */
  }
  return 'stitch'
}

export function CareersThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeIdState] = useState<CareersThemeId>(readStoredTheme)

  const setThemeId = useCallback((id: CareersThemeId) => {
    setThemeIdState(id)
    try {
      localStorage.setItem(CAREERS_THEME_STORAGE_KEY, id)
    } catch {
      /* ignore */
    }
  }, [])

  const value = useMemo(
    () => ({
      themeId,
      theme: CAREERS_THEMES[themeId],
      setThemeId,
    }),
    [themeId, setThemeId]
  )

  return <CareersThemeContext.Provider value={value}>{children}</CareersThemeContext.Provider>
}

export function useCareersTheme() {
  const ctx = useContext(CareersThemeContext)
  if (!ctx) throw new Error('useCareersTheme must be used within CareersThemeProvider')
  return ctx
}
