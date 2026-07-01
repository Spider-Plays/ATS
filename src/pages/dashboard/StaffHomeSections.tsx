import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BarChart3, type LucideIcon } from 'lucide-react'
import clsx from 'clsx'
import { UserAvatar } from '@/components/ui/UserAvatar'

export function timeGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
}

export type PipelineSegment = {
  key: string
  label: string
  count: number
  pct: number
  color: string
}

export function StaffHomeLoading() {
  return (
    <div className="portal-home-loading">
      <div className="portal-home-loading__spinner" aria-hidden />
      <p className="text-sm font-medium">Loading your workspace…</p>
    </div>
  )
}

export function StaffHomeHero({
  name,
  avatar,
  roleLabel,
  tagline,
  stats,
}: {
  name: string
  avatar?: string | null
  roleLabel: string
  tagline: string
  stats: { icon: LucideIcon; value: number | string; label: string; accent?: boolean }[]
}) {
  const firstName = name.split(' ')[0]

  return (
    <section className="portal-home-hero staff-home-hero">
      <div className="portal-home-hero__grid">
        <div>
          <div className="portal-home-hero__profile">
            <UserAvatar
              name={name}
              avatar={avatar}
              size="lg"
              className="portal-home-hero__avatar"
            />
            <div className="min-w-0">
              <p className="portal-home-hero__eyebrow">{timeGreeting()}</p>
              <h1 className="portal-home-hero__title">Hello, {firstName}</h1>
              <div className="portal-home-hero__badge">{roleLabel}</div>
            </div>
          </div>
          <p className="portal-home-hero__tagline">{tagline}</p>
        </div>

        <div className="portal-home-hero__stats">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div
                key={stat.label}
                className={clsx(
                  'portal-home-stat-pill',
                  stat.accent && 'portal-home-stat-pill--accent',
                )}
              >
                <Icon size={16} />
                <span className="portal-home-stat-pill__value">{stat.value}</span>
                <span className="portal-home-stat-pill__label">{stat.label}</span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export function StaffHomePipelineCard({
  title,
  linkTo,
  linkLabel,
  segments,
  metrics,
  emptyTitle,
  emptyText,
  emptyCta,
  emptyCtaTo,
}: {
  title: string
  linkTo: string
  linkLabel: string
  segments: PipelineSegment[]
  metrics: { value: number; label: string; tone?: 'default' | 'success' | 'muted' | 'warn' }[]
  emptyTitle: string
  emptyText: string
  emptyCta: string
  emptyCtaTo: string
}) {
  const total = segments.reduce((s, x) => s + x.count, 0)

  return (
    <section className="app-card portal-home-card portal-home-card--pipeline">
      <div className="portal-home-card__head">
        <div>
          <p className="portal-home-card__eyebrow">Pipeline snapshot</p>
          <h2 className="portal-home-card__title">{title}</h2>
        </div>
        <Link to={linkTo} className="portal-home-card__link">
          {linkLabel} <ArrowRight size={14} />
        </Link>
      </div>

      {total === 0 ? (
        <div className="portal-home-empty">
          <div className="portal-home-empty__icon">
            <BarChart3 size={28} />
          </div>
          <p className="portal-home-empty__title">{emptyTitle}</p>
          <p className="portal-home-empty__text">{emptyText}</p>
          <Link to={emptyCtaTo} className="portal-home-empty__cta">
            {emptyCta}
          </Link>
        </div>
      ) : (
        <>
          <div
            className="portal-home-pipeline-bar"
            role="img"
            aria-label="Status distribution"
          >
            {segments.map((seg) =>
              seg.pct > 0 ? (
                <div
                  key={seg.key}
                  className="portal-home-pipeline-bar__seg"
                  style={{ width: `${seg.pct}%`, backgroundColor: seg.color }}
                  title={`${seg.label}: ${seg.count}`}
                />
              ) : null,
            )}
          </div>

          <div className="portal-home-pipeline-legend">
            {segments.map((seg) => (
              <div key={seg.key} className="portal-home-pipeline-legend__item">
                <span
                  className="portal-home-pipeline-legend__dot"
                  style={{ backgroundColor: seg.color }}
                />
                <span className="portal-home-pipeline-legend__label">{seg.label}</span>
                <span className="portal-home-pipeline-legend__count">{seg.count}</span>
              </div>
            ))}
          </div>

          <div className="portal-home-pipeline-metrics">
            {metrics.map((m) => (
              <div
                key={m.label}
                className={clsx(
                  'portal-home-pipeline-metric',
                  m.tone === 'success' && 'portal-home-pipeline-metric--success',
                  m.tone === 'muted' && 'portal-home-pipeline-metric--muted',
                  m.tone === 'warn' && 'portal-home-pipeline-metric--warn',
                )}
              >
                <span className="portal-home-pipeline-metric__value">{m.value}</span>
                <span className="portal-home-pipeline-metric__label">{m.label}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  )
}

export function StaffHomeRingCard({
  title,
  rate,
  rateLabel,
  caption,
}: {
  title: string
  rate: number
  rateLabel: string
  caption: string
}) {
  return (
    <section className="app-card portal-home-card portal-home-card--ring">
      <p className="portal-home-card__eyebrow">Performance</p>
      <h2 className="portal-home-card__title">{title}</h2>

      <div className="portal-home-success-ring">
        <svg viewBox="0 0 120 120" className="portal-home-success-ring__svg">
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            className="portal-home-success-ring__track"
          />
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${(rate / 100) * 327} 327`}
            transform="rotate(-90 60 60)"
            className="portal-home-success-ring__fill"
          />
        </svg>
        <div className="portal-home-success-ring__center">
          <span className="portal-home-success-ring__value">{rate}%</span>
          <span className="portal-home-success-ring__label">{rateLabel}</span>
        </div>
      </div>

      <p className="portal-home-success-ring__caption">{caption}</p>
    </section>
  )
}

export function StaffHomeFeedCard({
  title,
  linkTo,
  linkLabel,
  emptyText,
  children,
}: {
  title: string
  linkTo: string
  linkLabel: string
  emptyText: string
  children: React.ReactNode
}) {
  const isEmpty = React.Children.count(children) === 0

  return (
    <section className="app-card portal-home-card portal-home-card--feed">
      <div className="portal-home-card__head">
        <div>
          <p className="portal-home-card__eyebrow">Live feed</p>
          <h2 className="portal-home-card__title">{title}</h2>
        </div>
        <Link to={linkTo} className="portal-home-card__link">
          {linkLabel} <ArrowRight size={14} />
        </Link>
      </div>

      {isEmpty ? (
        <div className="portal-home-empty portal-home-empty--compact">
          <p className="portal-home-empty__text">{emptyText}</p>
        </div>
      ) : (
        <ul className="portal-home-feed">{children}</ul>
      )}
    </section>
  )
}

export function StaffHomeActionsCard({
  actions,
}: {
  actions: {
    to: string
    icon: LucideIcon
    label: string
    hint: string
    tone: 'primary' | 'blue' | 'violet' | 'amber'
  }[]
}) {
  return (
    <section className="app-card portal-home-card portal-home-card--actions">
      <p className="portal-home-card__eyebrow">Shortcuts</p>
      <h2 className="portal-home-card__title">Quick actions</h2>

      <div className="portal-home-actions">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <Link
              key={action.label}
              to={action.to}
              className={clsx(
                'portal-home-action-tile',
                action.tone === 'primary' && 'portal-home-action-tile--primary',
                action.tone === 'blue' && 'portal-home-action-tile--blue',
                action.tone === 'violet' && 'portal-home-action-tile--violet',
                action.tone === 'amber' && 'portal-home-action-tile--amber',
              )}
            >
              <Icon size={22} />
              <span className="portal-home-action-tile__label">{action.label}</span>
              <span className="portal-home-action-tile__hint">{action.hint}</span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

export function StaffHomeAlert({
  title,
  text,
  linkTo,
  linkLabel,
}: {
  title: string
  text: string
  linkTo: string
  linkLabel: string
}) {
  return (
    <div className="portal-home-alert" role="status">
      <div>
        <p className="portal-home-alert__title">{title}</p>
        <p className="portal-home-alert__text">{text}</p>
      </div>
      <Link to={linkTo} className="portal-home-alert__link">
        {linkLabel} <ArrowRight size={14} />
      </Link>
    </div>
  )
}
