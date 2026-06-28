import { useCallback, useEffect, useRef } from 'react'
import { useAuth } from './useAuth'
import { useLogout } from './useLogout'

const IDLE_TIMEOUT_MS = 15 * 60 * 1000
const MOUSEMOVE_THROTTLE_MS = 30_000
const LAST_ACTIVITY_KEY = 'stitch_last_activity'

const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'] as const

function readLastActivity(): number {
  const stored = localStorage.getItem(LAST_ACTIVITY_KEY)
  const parsed = stored ? Number(stored) : NaN
  return Number.isFinite(parsed) ? parsed : Date.now()
}

function writeLastActivity(timestamp: number) {
  localStorage.setItem(LAST_ACTIVITY_KEY, String(timestamp))
}

export function useIdleLogout() {
  const { user, loading } = useAuth()
  const handleLogout = useLogout()
  const lastActivityRef = useRef(Date.now())
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const lastMouseMoveRef = useRef(0)

  const clearIdleTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = undefined
    }
  }, [])

  const scheduleIdleLogout = useCallback(() => {
    clearIdleTimer()
    const elapsed = Date.now() - lastActivityRef.current
    const remaining = IDLE_TIMEOUT_MS - elapsed

    if (remaining <= 0) {
      void handleLogout()
      return
    }

    timeoutRef.current = setTimeout(() => {
      void handleLogout()
    }, remaining)
  }, [clearIdleTimer, handleLogout])

  const recordActivity = useCallback(() => {
    const now = Date.now()
    lastActivityRef.current = now
    writeLastActivity(now)
    scheduleIdleLogout()
  }, [scheduleIdleLogout])

  useEffect(() => {
    if (loading || !user) {
      clearIdleTimer()
      return
    }

    lastActivityRef.current = readLastActivity()
    scheduleIdleLogout()

    const onActivity = (event: Event) => {
      if (event.type === 'mousemove') {
        const now = Date.now()
        if (now - lastMouseMoveRef.current < MOUSEMOVE_THROTTLE_MS) return
        lastMouseMoveRef.current = now
      }
      recordActivity()
    }

    const onVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return

      lastActivityRef.current = readLastActivity()
      if (Date.now() - lastActivityRef.current >= IDLE_TIMEOUT_MS) {
        void handleLogout()
        return
      }
      scheduleIdleLogout()
    }

    const onStorage = (event: StorageEvent) => {
      if (event.key !== LAST_ACTIVITY_KEY || !event.newValue) return
      lastActivityRef.current = Number(event.newValue)
      scheduleIdleLogout()
    }

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, onActivity, { passive: true })
    }
    window.addEventListener('mousemove', onActivity, { passive: true })
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('storage', onStorage)

    return () => {
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, onActivity)
      }
      window.removeEventListener('mousemove', onActivity)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('storage', onStorage)
      clearIdleTimer()
    }
  }, [loading, user, recordActivity, scheduleIdleLogout, handleLogout, clearIdleTimer])
}
