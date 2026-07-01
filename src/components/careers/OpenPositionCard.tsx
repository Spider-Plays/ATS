import React from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { Gift, MapPin, Building2, Briefcase, Hash } from 'lucide-react'
import type { PortalOpenPosition } from '@/services/http/portal'

type OpenPositionCardProps = {
  job: PortalOpenPosition
  to: string
  isApplied?: boolean
  actionLabel?: string
  showClient?: boolean
  referralBonusAmount?: number
  openingsRemaining?: number
}

export function OpenPositionCard({
  job,
  to,
  isApplied = false,
  actionLabel = 'View & apply →',
  showClient = true,
  referralBonusAmount,
  openingsRemaining,
}: OpenPositionCardProps) {
  const spots =
    openingsRemaining ?? Math.max(0, job.openings - job.filled)

  return (
    <Link
      to={to}
      className={clsx(
        'app-card-interactive block p-5',
        isApplied && 'ring-2 ring-primary/30 border-primary/40'
      )}
    >
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
        <div className="space-y-2 min-w-0">
          <p className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
            <Hash size={12} /> {job.jobCode}
          </p>
          <h2 className="text-lg font-bold text-foreground">{job.title}</h2>
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            {showClient && job.client && (
              <span className="inline-flex items-center gap-1">
                <Building2 size={14} /> {job.client}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Briefcase size={14} /> {job.department}
            </span>
            {job.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin size={14} /> {job.location}
              </span>
            )}
          </div>
          {job.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{job.description}</p>
          )}
        </div>
        <div className="shrink-0 text-right space-y-2">
          {referralBonusAmount ? (
            <div className="portal-bonus-pill justify-end">
              <Gift size={14} className="text-tertiary" />
              <span className="portal-bonus-text">
                ₹{referralBonusAmount.toLocaleString('en-IN')} bonus
              </span>
            </div>
          ) : null}
          {isApplied ? (
            <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-primary-container text-on-primary-container">
              Applied
            </span>
          ) : (
            <span className="inline-block text-xs font-bold text-primary">{actionLabel}</span>
          )}
          <p className="text-xs text-muted-foreground">
            {spots > 0 ? `${spots} opening${spots !== 1 ? 's' : ''}` : 'Apply now'}
          </p>
        </div>
      </div>
    </Link>
  )
}
