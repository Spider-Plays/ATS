import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'
import { useAuth } from '@/hooks/useAuth'
import { canApproveRequirement } from '@/permissions'
import { useNotificationStore } from '@/store/notificationStore'
import {
  applyNotificationReadState,
  buildActivityLogNotifications,
  buildInterviewerFeedbackNotifications,
  buildPendingRequirementNotifications,
  filterNotificationsForRole,
  mergeNotificationItems,
  type NotificationItem,
} from '@/lib/notificationItems'

export function useNotifications() {
  const { user } = useAuth()
  const userId = user?.uid
  const isInterviewer = user?.role === 'INTERVIEWER'
  const canReviewPendingApprovals = canApproveRequirement(user?.role)

  const readIdsByUser = useNotificationStore((s) => s.readIdsByUser)
  const isRead = useNotificationStore((s) => s.isRead)
  const markAsRead = useNotificationStore((s) => s.markAsRead)
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead)

  const { data: pendingRequirements = [], isLoading: isLoadingReqs } = useQuery({
    queryKey: ['pendingRequirements'],
    queryFn: api.requirements.getPending,
    enabled: canReviewPendingApprovals,
    staleTime: 30_000,
    refetchInterval: 60_000,
  })

  const { data: activityLogs = [], isLoading: isLoadingLogs } = useQuery({
    queryKey: ['activityLogs', user?.role, userId],
    queryFn: () => api.activityLogs.list(),
    staleTime: 30_000,
    refetchInterval: 60_000,
  })

  const { data: interviews = [], isLoading: isLoadingInterviews } = useQuery({
    queryKey: ['interviews', 'header-notifications'],
    queryFn: api.interviews.list,
    enabled: isInterviewer,
    staleTime: 60_000,
    refetchInterval: 120_000,
  })

  const isLoading =
    isLoadingLogs || (canReviewPendingApprovals && isLoadingReqs) || (isInterviewer && isLoadingInterviews)

  const notifications = useMemo(() => {
    const items = mergeNotificationItems([
      ...buildPendingRequirementNotifications(pendingRequirements),
      ...buildInterviewerFeedbackNotifications(interviews, userId),
      ...buildActivityLogNotifications(activityLogs),
    ])
    const scoped = filterNotificationsForRole(items, user?.role)
    return applyNotificationReadState(scoped, userId, isRead)
  }, [pendingRequirements, interviews, activityLogs, user?.role, userId, isRead, readIdsByUser])

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications]
  )

  const markAllNotificationsAsRead = () => {
    markAllAsRead(
      userId,
      notifications.map((notification) => notification.id)
    )
  }

  const markNotificationAsRead = (id: string) => {
    markAsRead(userId, id)
  }

  return {
    notifications,
    unreadCount,
    isLoading,
    markAllNotificationsAsRead,
    markNotificationAsRead,
  }
}

export type { NotificationItem }
