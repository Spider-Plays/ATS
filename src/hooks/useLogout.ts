import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './useAuth'
import { CANDIDATE_PORTAL } from '@/lib/candidatePortalPaths'

export function useLogout() {
  const { logout, user } = useAuth()
  const navigate = useNavigate()

  return useCallback(async () => {
    const role = user?.role
    await logout()
    if (role === 'CANDIDATE') {
      navigate(`${CANDIDATE_PORTAL}/login`, { replace: true })
    } else if (role === 'EMPLOYEE') {
      navigate('/referral-portal/login', { replace: true })
    } else {
      navigate('/login', { replace: true })
    }
  }, [logout, navigate, user?.role])
}
