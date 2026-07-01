import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import clsx from 'clsx'
import { BarChart3, Building2, UserPlus } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { canAccessChannelReports } from '@/permissions'
import { tabIndicatorSpring } from '@/lib/motion'

function isReportsNavActive(pathname: string, to: string): boolean {
  if (to === '/reports/hiring') {
    return pathname === '/reports' || pathname === '/reports/hiring'
  }
  return pathname === to || pathname.startsWith(`${to}/`)
}

export function ReportsSubNav() {
  const { pathname } = useLocation()
  const { user } = useAuth()
  const showChannelReports = canAccessChannelReports(user?.role)

  const tabs = [
    { to: '/reports/hiring', label: 'Hiring', icon: BarChart3 },
    ...(showChannelReports
      ? [
          { to: '/reports/referrals', label: 'Employee referrals', icon: UserPlus },
          { to: '/reports/vendors', label: 'Vendors', icon: Building2 },
        ]
      : []),
  ]

  return (
    <nav
      aria-label="Report sections"
      className={clsx(
        'shrink-0 border-b border-outline-variant/50',
        'bg-surface-container-low',
        'px-6 lg:px-8 py-3 overflow-x-auto custom-scrollbar'
      )}
    >
      <div className="flex items-center gap-1 min-w-max p-1 rounded-full bg-surface-container border border-outline-variant/40">
        {tabs.map(({ to, icon: Icon, label }) => {
          const active = isReportsNavActive(pathname, to)
          return (
            <Link
              key={to}
              to={to}
              className={clsx(
                'relative inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap app-tab-btn',
                active
                  ? 'text-primary-foreground [&_svg]:text-primary-foreground'
                  : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface [&_svg]:text-current'
              )}
            >
              {active && (
                <motion.span
                  layoutId="reports-subnav-indicator"
                  className="absolute inset-0 rounded-full m3-surface-primary shadow-m3-1"
                  transition={tabIndicatorSpring}
                  aria-hidden
                />
              )}
              <Icon size={16} className="relative z-[1]" aria-hidden />
              <span className="relative z-[1]">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
