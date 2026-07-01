import type { ActivityLog, Interview, Requirement } from '@/types'
import {
  activityLogToNotificationItem,
  type ActivityNotificationItem,
} from '@/lib/activityLogNotifications'
import { canViewSystemNotifications, isAssignedInterviewer } from '@/permissions'
import { needsFeedback } from '@/pages/interviews/_shared/interview.utils'

export type NotificationItem = ActivityNotificationItem & {
  actions?: { label: string; primary: boolean }[]
}

export function buildPendingRequirementNotifications(
  pendingRequirements: Requirement[]
): NotificationItem[] {
  return pendingRequirements.map((req) => ({
    id: `req-${req.id}`,
    type: 'ACTION_REQUIRED' as const,
    title: 'Requirement approval needed',
    subtitle: `${req.title} · ${req.department}`,
    time: new Date(req.createdAt).toLocaleDateString(),
    read: false,
    icon: 'gavel',
    colorClass: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400',
    link: `/requirements/${req.id}`,
    actions: [{ label: 'Review', primary: true }],
    timestamp: new Date(req.createdAt).getTime(),
  }))
}

export function buildInterviewerFeedbackNotifications(
  interviews: Interview[],
  userId: string | undefined | null
): NotificationItem[] {
  if (!userId) return []

  return interviews
    .filter((interview) => isAssignedInterviewer(interview, userId) && needsFeedback(interview))
    .map((interview) => ({
      id: `feedback-${interview.id}`,
      type: 'ACTION_REQUIRED' as const,
      title: 'Feedback required',
      subtitle: `${interview.candidateName || 'Candidate'} · ${interview.type.replace(/_/g, ' ')}`,
      time: new Date(interview.scheduledAt).toLocaleDateString(),
      read: false,
      icon: 'rate_review',
      colorClass: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400',
      link: interview.candidateId
        ? `/candidates/${interview.candidateId}`
        : `/interviews/${interview.id}/feedback`,
      actions: [{ label: 'Submit feedback', primary: true }],
      timestamp: new Date(interview.scheduledAt).getTime(),
    }))
}

export function buildActivityLogNotifications(activityLogs: ActivityLog[]): NotificationItem[] {
  return activityLogs.map((log) => ({
    ...activityLogToNotificationItem(log),
    read: false,
  }))
}

/** Hide generic system activity from non-admin roles. */
export function filterNotificationsForRole(
  items: NotificationItem[],
  role?: string | null
): NotificationItem[] {
  if (canViewSystemNotifications(role)) return items
  return items.filter((item) => item.type !== 'SYSTEM')
}

export function mergeNotificationItems(items: NotificationItem[]): NotificationItem[] {
  return [...items].sort((a, b) => b.timestamp - a.timestamp)
}

export function applyNotificationReadState(
  items: NotificationItem[],
  userId: string | undefined | null,
  isRead: (userId: string | undefined | null, id: string) => boolean
): NotificationItem[] {
  return items.map((item) => ({
    ...item,
    read: isRead(userId, item.id),
  }))
}
