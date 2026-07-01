import React from 'react'
import {
  Briefcase,
  Building2,
  Clock,
  Hash,
  MapPin,
  Monitor,
  TrendingUp,
  Users,
} from 'lucide-react'
import {
  employmentTypeLabel,
  formatExperienceRange,
  formatRequirementLocation,
  seniorityLabel,
  workModeLabel,
} from '@/lib/requirementFields'
import type { PortalOpenPosition } from '@/services/http/portal'
import clsx from 'clsx'

export type OpenPositionJobDetailVariant = 'igs' | 'default'

type JobMetaItem = {
  label: string
  value: string
  icon: React.ReactNode
}

function resolveWorkMode(job: PortalOpenPosition): string | undefined {
  if (job.workMode) return workModeLabel(job.workMode)
  if (job.isRemote) return 'Remote'
  return undefined
}

export function buildOpenPositionMetaItems(job: PortalOpenPosition): JobMetaItem[] {
  const spotsLeft = Math.max(0, job.openings - job.filled)
  const items: JobMetaItem[] = []

  items.push({
    label: 'Openings',
    value:
      spotsLeft > 0
        ? `${spotsLeft} opening${spotsLeft !== 1 ? 's' : ''} remaining`
        : 'No openings listed — you may still apply',
    icon: <Users size={16} aria-hidden />,
  })

  if (job.employmentType) {
    items.push({
      label: 'Employment',
      value: employmentTypeLabel(job.employmentType),
      icon: <Briefcase size={16} aria-hidden />,
    })
  }

  const workMode = resolveWorkMode(job)
  if (workMode) {
    items.push({
      label: 'Work mode',
      value: workMode,
      icon: <Monitor size={16} aria-hidden />,
    })
  }

  if (job.seniorityLevel) {
    items.push({
      label: 'Seniority',
      value: seniorityLabel(job.seniorityLevel),
      icon: <TrendingUp size={16} aria-hidden />,
    })
  }

  if (job.experienceMinYears != null || job.experienceMaxYears != null) {
    const experience = formatExperienceRange(job.experienceMinYears, job.experienceMaxYears)
    if (experience !== '—') {
      items.push({
        label: 'Experience',
        value: experience,
        icon: <Clock size={16} aria-hidden />,
      })
    }
  }

  return items
}

function JobSkillsSection({
  title,
  skills,
  variant,
  skillVariant,
}: {
  title: string
  skills: string[]
  variant: OpenPositionJobDetailVariant
  skillVariant: 'primary' | 'secondary'
}) {
  if (skills.length === 0) return null

  const isIgs = variant === 'igs'

  return (
    <div className={isIgs ? 'igs-job-detail-skills' : 'space-y-2'}>
      <h3
        className={clsx(
          'text-sm font-bold uppercase tracking-wider',
          isIgs ? 'igs-job-detail-section__title' : 'text-slate-400'
        )}
      >
        {title}
      </h3>
      <div className={clsx('flex flex-wrap gap-2', isIgs && 'igs-job-detail-skills__list')}>
        {skills.map((skill) => (
          <span
            key={skill}
            className={clsx(
              isIgs
                ? skillVariant === 'primary'
                  ? 'igs-job-skill igs-job-skill--primary'
                  : 'igs-job-skill igs-job-skill--secondary'
                : skillVariant === 'primary'
                  ? 'px-2.5 py-1 rounded-lg bg-[#0f3d38]/10 text-[#0f3d38] text-xs font-bold'
                  : 'px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold'
            )}
          >
            {skill}
          </span>
        ))}
      </div>
    </div>
  )
}

type OpenPositionJobDetailBodyProps = {
  job: PortalOpenPosition
  variant: OpenPositionJobDetailVariant
  showClient?: boolean
  children?: React.ReactNode
}

export function OpenPositionJobDetailBody({
  job,
  variant,
  showClient = false,
  children,
}: OpenPositionJobDetailBodyProps) {
  const isIgs = variant === 'igs'
  const locationLabel = formatRequirementLocation(job)
  const metaItems = buildOpenPositionMetaItems(job)
  const summary = job.description?.trim()
  const fullDescription = job.jobDescription?.trim()
  const roleBody = fullDescription || summary
  const showSummary = !!summary && !!fullDescription && summary !== fullDescription

  return (
    <>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Hash size={14} /> Req ID: {job.jobCode}
        </p>
        <h1
          className={clsx(
            'text-2xl font-black mt-2',
            isIgs ? 'text-[#0a1628] font-bold' : 'text-slate-900'
          )}
        >
          {job.title}
        </h1>
        <div className="flex flex-wrap gap-3 mt-3 text-sm text-slate-600">
          {showClient && job.client && (
            <span className="inline-flex items-center gap-1 font-medium">
              <Building2 size={14} /> {job.client}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Briefcase size={14} /> {job.department}
          </span>
          {locationLabel !== '—' && (
            <span className="inline-flex items-center gap-1">
              <MapPin size={14} /> {locationLabel}
            </span>
          )}
        </div>
      </div>

      {metaItems.length > 0 && (
        <div className={clsx(isIgs ? 'igs-job-detail-meta' : 'grid grid-cols-2 sm:grid-cols-3 gap-3')}>
          {metaItems.map((item) => (
            <div
              key={item.label}
              className={clsx(
                isIgs ? 'igs-job-detail-meta__item' : 'rounded-xl border border-slate-100 bg-slate-50 p-3'
              )}
            >
              <p
                className={clsx(
                  'flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider',
                  isIgs ? 'igs-job-detail-meta__label' : 'text-slate-400'
                )}
              >
                {item.icon}
                {item.label}
              </p>
              <p
                className={clsx(
                  'mt-1 text-sm font-semibold',
                  isIgs ? 'igs-job-detail-meta__value' : 'text-slate-800'
                )}
              >
                {item.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {showSummary && (
        <div className={clsx(isIgs && 'igs-job-detail-section')}>
          <h2
            className={clsx(
              'text-sm font-bold uppercase mb-2',
              isIgs ? 'igs-job-detail-section__title' : 'text-slate-400'
            )}
          >
            Role summary
          </h2>
          <p
            className={clsx(
              'text-sm whitespace-pre-wrap leading-relaxed',
              isIgs ? 'igs-job-detail-section__body' : 'text-slate-700'
            )}
          >
            {summary}
          </p>
        </div>
      )}

      {roleBody && (
        <div className={clsx(isIgs && 'igs-job-detail-section')}>
          <h2
            className={clsx(
              'text-sm font-bold uppercase mb-2',
              isIgs ? 'igs-job-detail-section__title' : 'text-slate-400'
            )}
          >
            {fullDescription ? 'Job description' : 'About the role'}
          </h2>
          <p
            className={clsx(
              'text-sm whitespace-pre-wrap leading-relaxed',
              isIgs ? 'igs-job-detail-section__body' : 'text-slate-700'
            )}
          >
            {roleBody}
          </p>
        </div>
      )}

      {((job.primarySkills?.length ?? 0) > 0 || (job.secondarySkills?.length ?? 0) > 0) && (
        <div className={clsx('space-y-4', isIgs && 'igs-job-detail-section')}>
          <h2
            className={clsx(
              'text-sm font-bold uppercase',
              isIgs ? 'igs-job-detail-section__title' : 'text-slate-400'
            )}
          >
            Skills
          </h2>
          <JobSkillsSection
            title="Primary skills"
            skills={job.primarySkills ?? []}
            variant={variant}
            skillVariant="primary"
          />
          <JobSkillsSection
            title="Good to have"
            skills={job.secondarySkills ?? []}
            variant={variant}
            skillVariant="secondary"
          />
        </div>
      )}

      {children}
    </>
  )
}
