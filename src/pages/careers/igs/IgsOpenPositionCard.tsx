import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Briefcase, MapPin } from 'lucide-react'
import type { PortalOpenPosition } from '@/services/http/portal'

type IgsOpenPositionCardProps = {
  job: PortalOpenPosition
  to: string
  actionLabel?: string
}

export function IgsOpenPositionCard({
  job,
  to,
  actionLabel = 'View position',
}: IgsOpenPositionCardProps) {
  return (
    <Link to={to} className="igs-position-card">
      <div className="igs-position-card__main">
        <span className="igs-position-card__code">{job.jobCode}</span>

        <h3 className="igs-position-card__title">{job.title}</h3>

        <div className="igs-position-card__tags">
          <span className="igs-position-card__tag">
            <Briefcase size={13} aria-hidden />
            {job.department}
          </span>
          {job.location && (
            <span className="igs-position-card__tag">
              <MapPin size={13} aria-hidden />
              {job.location}
            </span>
          )}
        </div>

        {job.description && (
          <p className="igs-position-card__desc">{job.description}</p>
        )}
      </div>

      <div className="igs-position-card__aside">
        <span className="igs-position-card__cta">
          {actionLabel}
          <ArrowRight size={16} aria-hidden className="igs-position-card__cta-icon" />
        </span>
      </div>
    </Link>
  )
}
