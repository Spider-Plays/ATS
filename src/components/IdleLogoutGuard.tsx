import { useIdleLogout } from '@/hooks/useIdleLogout'

export function IdleLogoutGuard() {
  useIdleLogout()
  return null
}
