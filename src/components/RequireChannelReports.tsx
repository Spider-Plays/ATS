import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { canAccessChannelReports } from '@/permissions'

export function RequireChannelReports({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()

  if (!canAccessChannelReports(user?.role)) {
    return <Navigate to="/reports/hiring" replace />
  }

  return <>{children}</>
}
