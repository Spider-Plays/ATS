import React from 'react'
import clsx from 'clsx'
import { ListSearchBar } from '@/components/ui/ListSearchBar'
import { AppSelect } from '@/components/ui/AppSelect'
import { EmptyState } from '@/components/ui/EmptyState'
import { OpenPositionCard } from '@/components/careers/OpenPositionCard'
import { IgsOpenPositionCard } from './igs/IgsOpenPositionCard'
import type { PortalOpenPosition } from '@/services/http/portal'
import type { CareersThemeId } from './theme/careersTheme'

type CareersOpenRolesSectionProps = {
  themeId: CareersThemeId
  jobs: PortalOpenPosition[]
  filteredJobs: PortalOpenPosition[]
  departments: string[]
  search: string
  setSearch: (v: string) => void
  department: string
  setDepartment: (v: string) => void
  isLoading: boolean
  isError: boolean
  error: unknown
  refetch: () => void
}

export function CareersOpenRolesSection({
  themeId,
  jobs,
  filteredJobs,
  departments,
  search,
  setSearch,
  department,
  setDepartment,
  isLoading,
  isError,
  error,
  refetch,
}: CareersOpenRolesSectionProps) {
  const isIgs = themeId === 'igs'

  return (
    <section
      id="open-roles"
      className={
        isIgs
          ? 'igs-open-roles px-4 md:px-8 scroll-mt-24'
          : 'careers-open-roles careers-section scroll-mt-20'
      }
    >
      <div className={isIgs ? 'max-w-[80rem] mx-auto space-y-6' : 'max-w-6xl mx-auto space-y-6'}>
        <header className="space-y-3 mb-8">
          {isIgs ? (
            <h2 className="igs-section-title">Job board</h2>
          ) : (
            <>
              <span className="badge-eyebrow">Open roles</span>
              <h2 className="text-page-title">Current opportunities</h2>
            </>
          )}
          <p className={isIgs ? 'igs-section-sub' : 'text-page-desc'}>
            {jobs.length > 0
              ? isIgs
                ? `${jobs.length} open role${jobs.length !== 1 ? 's' : ''} across quality engineering, testing, and automation.`
                : `${jobs.length} open role${jobs.length !== 1 ? 's' : ''} — same listings as the candidate portal. Create a free account to apply.`
              : isIgs
                ? 'New opportunities are posted when roles go live on our hiring portal.'
                : 'New positions appear here when recruiters post live jobs to the candidate portal.'}
          </p>
        </header>

        <div className={clsx('flex flex-col sm:flex-row gap-3', isIgs && 'igs-filters')}>
          <div className="flex-1">
            <ListSearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search by title, department, location…"
              className={isIgs ? 'igs-search w-full min-w-0 max-w-none' : undefined}
              inputClassName={isIgs ? 'igs-search-input' : undefined}
              iconClassName={isIgs ? 'igs-search-icon' : undefined}
            />
          </div>
          {departments.length > 0 && (
            <div className={isIgs ? 'igs-select sm:w-56' : 'sm:w-56'}>
              <AppSelect
                value={department}
                onChange={setDepartment}
                options={[
                  { value: '', label: 'All departments' },
                  ...departments.map((d) => ({ value: d, label: d })),
                ]}
                className="w-full"
                menuClassName={isIgs ? 'igs-select-menu' : undefined}
                aria-label="Filter by department"
              />
            </div>
          )}
        </div>

        {isLoading ? (
          <p className="text-muted-foreground text-center py-12">Loading open roles…</p>
        ) : isError ? (
          <div className="text-center py-12 space-y-4">
            <p className="text-red-600 font-medium">
              {error instanceof Error ? error.message : 'Could not load open roles'}
            </p>
            <button
              type="button"
              onClick={() => void refetch()}
              className={isIgs ? 'igs-btn-primary' : 'btn-filled !h-9 !px-5 !text-sm'}
            >
              Try again
            </button>
          </div>
        ) : filteredJobs.length === 0 ? (
          <EmptyState
            icon="work"
            title={search || department ? 'No matching roles' : 'No open roles right now'}
            description={
              search || department
                ? 'Try adjusting your search or department filter.'
                : 'Check back soon — new roles are added when hiring opens.'
            }
          />
        ) : (
          <ul className="grid grid-cols-1 gap-5">
            {filteredJobs.map((job) => (
              <li key={job.id}>
                {isIgs ? (
                  <IgsOpenPositionCard job={job} to={`/careers/jobs/${job.id}`} />
                ) : (
                  <OpenPositionCard
                    job={job}
                    to={`/careers/jobs/${job.id}`}
                    actionLabel="View role →"
                    showClient={false}
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
