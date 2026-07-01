import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { useAuth } from '@/hooks/useAuth'
import { useNotifications } from '@/hooks/useNotifications'
import { ListSearchBar } from '@/components/ui/ListSearchBar'
import { matchesAnySearch } from '@/lib/textSearch'
import { isInterviewerCandidateView, canViewSystemNotifications } from '@/permissions'
import type { ActivityNotificationItem } from '@/lib/activityLogNotifications'
import { PageHeader } from '@/components/layout/PageHeader'
import { AnimatedTabNav } from '@/components/motion/AnimatedTabNav'
import { heroBtnSecondary } from '@/components/layout/PageHero'
import { Bell } from 'lucide-react'
import './list.css'

type NotificationFilter = 'ALL' | ActivityNotificationItem['type']

const NOTIFICATION_TABS: { key: NotificationFilter; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'ACTION_REQUIRED', label: 'Action required' },
  { key: 'UPDATE', label: 'Updates' },
  { key: 'SYSTEM', label: 'System' },
]

const Notifications = () => {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>('ALL')
  const isInterviewerView = isInterviewerCandidateView(user?.role)
  const showSystemTab = canViewSystemNotifications(user?.role)
  const notificationTabs = useMemo(
    () =>
      showSystemTab
        ? NOTIFICATION_TABS
        : NOTIFICATION_TABS.filter((tab) => tab.key !== 'SYSTEM'),
    [showSystemTab]
  )
  const {
    notifications,
    unreadCount,
    isLoading,
    markAllNotificationsAsRead,
    markNotificationAsRead,
  } = useNotifications()

  useEffect(() => {
    if (!showSystemTab && activeFilter === 'SYSTEM') {
      setActiveFilter('ALL')
    }
  }, [showSystemTab, activeFilter])

  const filteredNotifications = useMemo(() => {
    const byType =
      activeFilter === 'ALL'
        ? notifications
        : notifications.filter((n) => n.type === activeFilter)
    return byType.filter((n) =>
      matchesAnySearch([n.title, n.subtitle, n.type], searchTerm)
    )
  }, [notifications, searchTerm, activeFilter])

  const emptyMessage = useMemo(() => {
    if (searchTerm.trim()) return 'No notifications match your search'
    if (isInterviewerView) return 'No interview updates yet'
    switch (activeFilter) {
      case 'ACTION_REQUIRED':
        return 'No actions required right now'
      case 'UPDATE':
        return 'No pipeline updates yet'
      case 'SYSTEM':
        return 'No system notifications'
      default:
        return 'No new notifications'
    }
  }, [searchTerm, isInterviewerView, activeFilter])

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500 pb-20">
      <PageHeader
        highlighted
        icon={Bell}
        eyebrow="Inbox"
        title="Notifications"
        description={
          isInterviewerView
            ? 'Updates for interviews and candidates assigned to you.'
            : 'Stay updated on your hiring pipeline.'
        }
        className="mb-8"
        actions={
          unreadCount > 0 ? (
            <button
              type="button"
              className={heroBtnSecondary}
              onClick={markAllNotificationsAsRead}
            >
              Mark all as read
            </button>
          ) : undefined
        }
      />

      <div className="mb-4">
        <ListSearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search notifications..."
          className="max-w-none"
        />
      </div>

      <div className="bg-white dark:bg-white/5 border border-primary/10 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
        {!isInterviewerView && (
          <div className="px-4 pt-4 pb-3 border-b border-primary/10 dark:border-white/10 overflow-x-auto custom-scrollbar">
            <AnimatedTabNav
              layoutId="notifications-filter-tabs"
              variant="pill"
              tabs={notificationTabs.map((tab) => ({ id: tab.key, label: tab.label }))}
              activeId={activeFilter}
              onChange={(id) => setActiveFilter(id as NotificationFilter)}
              aria-label="Notification filters"
            />
          </div>
        )}

        <div className="divide-y divide-primary/5 dark:divide-white/5">
          {isLoading && (
            <div className="p-8 text-center text-primary/40">Loading notifications...</div>
          )}

          {!isLoading && filteredNotifications.length === 0 && (
            <div className="p-12 text-center text-primary/40">
              <span className="material-symbols-outlined !text-4xl mb-2">notifications_off</span>
              <p>{emptyMessage}</p>
            </div>
          )}

          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={clsx(
                'p-6 hover:bg-primary/[0.02] dark:hover:bg-white/[0.02] transition-colors relative group',
                !notification.read && 'bg-primary/[0.01]'
              )}
            >
              {!notification.read && (
                <div className="absolute left-0 top-6 bottom-6 w-1 bg-primary rounded-r" />
              )}
              <div className="flex gap-4">
                <div
                  className={clsx(
                    'size-10 rounded-full flex items-center justify-center shrink-0',
                    notification.colorClass
                  )}
                >
                  <span className="material-symbols-outlined">{notification.icon}</span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className="text-sm font-bold text-primary dark:text-white leading-tight">
                      {notification.title}
                    </h3>
                    <span className="text-[10px] font-bold text-muted-foreground">
                      {notification.time}
                    </span>
                  </div>
                  <p className="text-xs text-primary/60 dark:text-white/60 mt-1 font-medium">
                    {notification.subtitle}
                  </p>

                  {notification.actions && (
                    <div className="flex gap-2 mt-3">
                      {notification.actions.map((action) => (
                        <Link
                          key={action.label}
                          to={notification.link || '#'}
                          onClick={() => markNotificationAsRead(notification.id)}
                          className={clsx(
                            'text-xs px-3 py-1.5 rounded-lg font-bold transition-colors inline-block',
                            action.primary
                              ? 'bg-primary text-primary-foreground hover:opacity-90'
                              : 'bg-primary/5 dark:bg-white/10 text-primary dark:text-white hover:bg-primary/10 dark:hover:bg-white/20'
                          )}
                        >
                          {action.label}
                        </Link>
                      ))}
                    </div>
                  )}
                  {!notification.actions && notification.link && (
                    <Link
                      to={notification.link}
                      onClick={() => markNotificationAsRead(notification.id)}
                      className="absolute inset-0 z-10"
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Notifications
