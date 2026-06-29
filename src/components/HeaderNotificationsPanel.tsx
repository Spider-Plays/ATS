import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { useNotifications } from '@/hooks/useNotifications'

const iconBtnClass =
  'm3-state-layer p-2.5 rounded-full text-on-surface-variant hover:text-on-surface size-10 flex items-center justify-center'

export function HeaderNotificationsPanel() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const {
    notifications,
    unreadCount,
    isLoading,
    markAllNotificationsAsRead,
    markNotificationAsRead,
  } = useNotifications()

  const preview = notifications.slice(0, 12)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const node = e.target as Node
      if (wrapRef.current && !wrapRef.current.contains(node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const handleOpen = () => setOpen((current) => !current)

  const handleMarkAllAsRead = () => {
    markAllNotificationsAsRead()
  }

  const handleNotificationClick = (id: string, link?: string) => {
    markNotificationAsRead(id)
    if (link) {
      navigate(link)
      setOpen(false)
    }
  }

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={handleOpen}
        className={clsx(iconBtnClass, 'relative')}
        aria-label="Notifications"
        aria-expanded={open}
        title="Notifications"
      >
        <span className="material-symbols-outlined text-[22px]">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full ring-2 ring-card" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[min(24rem,calc(100vw-2rem))] app-modal rounded-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground">Notifications</p>
              <p className="text-xs text-muted-foreground">
                {unreadCount === 0
                  ? 'You are all caught up'
                  : `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-primary hover:bg-primary/10 transition-colors"
                >
                  Mark all as read
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60"
                aria-label="Close notifications"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto custom-scrollbar">
            {isLoading ? (
              <p className="p-4 text-sm text-muted-foreground">Loading notifications…</p>
            ) : preview.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <span className="material-symbols-outlined !text-3xl mb-2 block">notifications_off</span>
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              <ul className="divide-y divide-border/50">
                {preview.map((notification) => (
                  <li key={notification.id}>
                    <button
                      type="button"
                      onClick={() => handleNotificationClick(notification.id, notification.link)}
                      className={clsx(
                        'w-full text-left p-4 hover:bg-muted/30 transition-colors relative',
                        !notification.read && 'bg-primary/[0.02]'
                      )}
                    >
                      {!notification.read && (
                        <span className="absolute left-0 top-4 bottom-4 w-1 bg-primary rounded-r" />
                      )}
                      <div className="flex items-start gap-3">
                        <div
                          className={clsx(
                            'size-9 rounded-xl flex items-center justify-center shrink-0',
                            notification.colorClass
                          )}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {notification.icon}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold text-foreground leading-tight">
                              {notification.title}
                            </p>
                            <span className="text-[10px] font-bold text-muted-foreground shrink-0">
                              {notification.time}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {notification.subtitle}
                          </p>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {!isLoading && notifications.length > preview.length && (
            <div className="px-4 py-2.5 border-t border-border/50 bg-muted/20 text-center">
              <p className="text-xs text-muted-foreground">
                Showing {preview.length} of {notifications.length} notifications
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
