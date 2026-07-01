import { useCallback } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { sanitizePortalReturnTo } from '@/lib/portalReturnTo'

function canNavigateBack(): boolean {
  if (typeof window === 'undefined') return false
  const idx = window.history.state?.idx
  return typeof idx === 'number' ? idx > 0 : window.history.length > 1
}

function sanitizeBackPath(path: unknown): string | null {
  if (typeof path !== 'string' || !path.startsWith('/')) return null
  if (path.includes('://') || path.startsWith('//')) return null
  return path
}

function resolveBackTarget(
  fallback: string,
  location: ReturnType<typeof useLocation>,
  searchParams: URLSearchParams
): string {
  const fromState = sanitizeBackPath((location.state as { from?: string } | null)?.from)
  if (fromState) return fromState

  const returnTo = sanitizePortalReturnTo(searchParams.get('returnTo'))
  if (returnTo) return returnTo

  return fallback
}

export function useGoBack(fallback: string) {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()

  const goBack = useCallback(() => {
    if (canNavigateBack()) {
      navigate(-1)
      return
    }
    navigate(resolveBackTarget(fallback, location, searchParams))
  }, [navigate, fallback, location, searchParams])

  return goBack
}
