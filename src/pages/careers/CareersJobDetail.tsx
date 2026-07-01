import React, { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { api } from '@/services/api'
import { ApiError } from '@/lib/apiClient'
import { useAuth } from '@/hooks/useAuth'
import { portalAuthPath } from '@/lib/portalReturnTo'
import { CANDIDATE_PORTAL } from '@/lib/candidatePortalPaths'
import { OpenPositionJobDetailBody } from '@/components/careers/OpenPositionJobDetailBody'
import { BackButton } from '@/components/ui/BackButton'
import { useCareersTheme } from './theme/CareersThemeContext'
import clsx from 'clsx'
import './careers.css'
import './job-detail.css'
import './igs/igs.css'

const CareersJobDetail = () => {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { themeId, theme } = useCareersTheme()
  const isIgs = themeId === 'igs'

  const { data: job, isLoading, isError, error } = useQuery({
    queryKey: ['careers-position', id],
    queryFn: () => api.careers.getPosition(id!),
    enabled: !!id,
  })

  useEffect(() => {
    document.title = job ? `${job.title} | ${theme.companyName}` : theme.documentTitle
  }, [job, theme])

  if (isLoading) {
    return (
      <div className="p-12 flex justify-center text-muted-foreground">
        <Loader2 className="animate-spin" size={28} />
      </div>
    )
  }

  if (isError || !job) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center space-y-4">
        <p className="text-red-600 font-medium">
          {error instanceof ApiError ? error.message : 'Job not found'}
        </p>
        <BackButton
          fallback="/careers#open-roles"
          label="Back to open roles"
          variant={isIgs ? 'igs' : 'default'}
        />
      </div>
    )
  }

  const portalJobPath = `${CANDIDATE_PORTAL}/jobs/${job.id}`
  const isCandidate = user?.role === 'CANDIDATE'
  const isStaff = user && user.role !== 'CANDIDATE'

  const applyHref = isCandidate
    ? portalJobPath
    : portalAuthPath(`${CANDIDATE_PORTAL}/signup`, portalJobPath)

  return (
    <div
      className={clsx(
        'mx-auto p-4 md:p-8 space-y-6 careers-job-detail',
        isIgs ? 'igs-careers max-w-[80rem]' : 'max-w-3xl'
      )}
    >
      <BackButton
        fallback="/careers#open-roles"
        label="Back to open roles"
        variant={isIgs ? 'igs' : 'default'}
      />

      <article
        className={clsx(
          'p-6 md:p-8 space-y-6',
          isIgs ? 'igs-job-detail-card' : 'app-card'
        )}
      >
        <OpenPositionJobDetailBody job={job} variant={isIgs ? 'igs' : 'default'}>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to={applyHref}
              className={clsx(
                isIgs
                  ? 'igs-btn-capabilities !text-sm'
                  : 'btn-filled !h-10 !px-6 text-m3-label inline-flex items-center justify-center'
              )}
            >
              {isCandidate ? 'Apply for this position' : 'Create account to apply'}
            </Link>
            {!isCandidate && (
              <Link
                to={portalAuthPath(`${CANDIDATE_PORTAL}/login`, portalJobPath)}
                className={clsx(
                  isIgs
                    ? 'igs-btn-outline-dark'
                    : 'btn-tonal !h-10 !px-6 text-m3-label inline-flex items-center justify-center'
                )}
              >
                Sign in to apply
              </Link>
            )}
          </div>

          {isStaff && (
            <p className="text-sm text-amber-700 font-medium">
              You are signed in with a team account. Use a personal candidate account to apply for
              this role.
            </p>
          )}
        </OpenPositionJobDetailBody>
      </article>
    </div>
  )
}

export default CareersJobDetail
