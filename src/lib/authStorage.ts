import { clearToken } from './apiClient'

export const LAST_ACTIVITY_KEY = 'stitch_last_activity'

/** Clear session keys that block sign-in in a normal (non-incognito) browser profile. */
export function clearSignInState(): void {
  clearToken()
  try {
    localStorage.removeItem(LAST_ACTIVITY_KEY)
  } catch {
    /* private mode / blocked storage */
  }
}

export function touchLastActivity(at = Date.now()): void {
  try {
    localStorage.setItem(LAST_ACTIVITY_KEY, String(at))
  } catch {
    /* ignore */
  }
}

export function readLastActivity(): number {
  try {
    const stored = localStorage.getItem(LAST_ACTIVITY_KEY)
    const parsed = stored ? Number(stored) : NaN
    return Number.isFinite(parsed) ? parsed : Date.now()
  } catch {
    return Date.now()
  }
}
