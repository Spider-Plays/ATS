import { useState } from 'react'
import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import { api } from '../services/api'
import { ApiError } from '../lib/apiClient'
import { useToastStore } from '../store/toastStore'
import { useAuth } from './useAuth'
import { candidateStatusLabel } from '@/pages/candidates/_shared/candidate.utils'
import {
  canChangeCandidateStage,
  HIRED_STAGE_LOCK_MESSAGE,
} from '@/permissions'
import { requiresStageDetailsModal } from '../components/candidates/CandidateStageDetailsModal'
import { patchInterviewProgressForCandidateStage } from '@/lib/interviewStageProgress'
import type { Candidate, CandidateInterviewProgress, CandidateStatus } from '../types'
import type { HiredMilestoneInput, OfferMilestoneInput } from '../lib/candidateMilestones'

type PendingModal = {
  candidateId: string
  candidateName: string
  status: 'OFFER' | 'HIRED'
}

function mergeCandidate(
  current: Candidate | undefined,
  updated: Candidate
): Candidate {
  return current ? { ...current, ...updated } : updated
}

function patchCandidateInList(
  candidates: Candidate[] | undefined,
  candidateId: string,
  patch: Candidate
): Candidate[] | undefined {
  if (!candidates) return candidates
  return candidates.map((c) => (c.id === candidateId ? mergeCandidate(c, patch) : c))
}

function invalidateInterviewProgress(
  queryClient: QueryClient,
  candidateId: string,
  requirementId?: string | null
) {
  if (requirementId) {
    void queryClient.invalidateQueries({
      queryKey: ['interview-progress', requirementId, candidateId],
    })
    return
  }
  void queryClient.invalidateQueries({
    predicate: (q) =>
      Array.isArray(q.queryKey) &&
      q.queryKey[0] === 'interview-progress' &&
      q.queryKey[2] === candidateId,
  })
}

function patchInterviewProgressCaches(
  queryClient: QueryClient,
  candidateId: string,
  requirementId: string | null | undefined,
  candidateInInterviewStage: boolean
) {
  const updater = (current: CandidateInterviewProgress | undefined) => {
    if (!current) return current
    return patchInterviewProgressForCandidateStage(current, candidateInInterviewStage)
  }

  if (requirementId) {
    queryClient.setQueryData<CandidateInterviewProgress>(
      ['interview-progress', requirementId, candidateId],
      updater
    )
    return
  }

  queryClient.setQueriesData<CandidateInterviewProgress>(
    {
      predicate: (q) =>
        Array.isArray(q.queryKey) &&
        q.queryKey[0] === 'interview-progress' &&
        q.queryKey[2] === candidateId,
    },
    updater
  )
}

function snapshotInterviewProgress(
  queryClient: QueryClient,
  candidateId: string,
  requirementId?: string | null
): CandidateInterviewProgress | undefined {
  if (requirementId) {
    return queryClient.getQueryData<CandidateInterviewProgress>([
      'interview-progress',
      requirementId,
      candidateId,
    ])
  }
  const entries = queryClient.getQueriesData<CandidateInterviewProgress>({
    predicate: (q) =>
      Array.isArray(q.queryKey) &&
      q.queryKey[0] === 'interview-progress' &&
      q.queryKey[2] === candidateId,
  })
  return entries[0]?.[1]
}

function restoreInterviewProgress(
  queryClient: QueryClient,
  candidateId: string,
  requirementId: string | null | undefined,
  snapshot: CandidateInterviewProgress | undefined
) {
  if (!snapshot) {
    invalidateInterviewProgress(queryClient, candidateId, requirementId)
    return
  }
  if (requirementId) {
    queryClient.setQueryData(
      ['interview-progress', requirementId, candidateId],
      snapshot
    )
    return
  }
  queryClient.setQueriesData<CandidateInterviewProgress>(
    {
      predicate: (q) =>
        Array.isArray(q.queryKey) &&
        q.queryKey[0] === 'interview-progress' &&
        q.queryKey[2] === candidateId,
    },
    snapshot
  )
}

function shouldRefreshInterviewProgress(
  previousStatus: CandidateStatus | undefined,
  nextStatus: CandidateStatus
): boolean {
  return previousStatus === 'INTERVIEW' || nextStatus === 'INTERVIEW'
}

export function useCandidateStageChange(options?: { requirementId?: string }) {
  const queryClient = useQueryClient()
  const { addToast } = useToastStore()
  const { user } = useAuth()
  const [pendingModal, setPendingModal] = useState<PendingModal | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const writeCandidateCaches = (candidateId: string, patch: Candidate) => {
    queryClient.setQueryData<Candidate>(['candidate', candidateId], (current) =>
      mergeCandidate(current, patch)
    )
    queryClient.setQueryData<Candidate[]>(['candidates'], (current) =>
      patchCandidateInList(current, candidateId, patch)
    )
    if (options?.requirementId) {
      queryClient.setQueryData<Candidate[]>(
        ['candidates', 'requirement', options.requirementId],
        (current) => patchCandidateInList(current, candidateId, patch)
      )
    }
  }

  const applyStageChange = async (
    candidateId: string,
    newStage: CandidateStatus,
    milestone?: OfferMilestoneInput | HiredMilestoneInput
  ) => {
    const previousCandidate = queryClient.getQueryData<Candidate>(['candidate', candidateId])
    const previousList = queryClient.getQueryData<Candidate[]>(['candidates'])
    const previousRequirementList = options?.requirementId
      ? queryClient.getQueryData<Candidate[]>(['candidates', 'requirement', options.requirementId])
      : undefined

    const requirementId =
      options?.requirementId ?? previousCandidate?.requirementId ?? null
    const previousProgress = shouldRefreshInterviewProgress(
      previousCandidate?.status,
      newStage
    )
      ? snapshotInterviewProgress(queryClient, candidateId, requirementId)
      : undefined

    if (previousCandidate) {
      writeCandidateCaches(candidateId, { ...previousCandidate, status: newStage })
      if (shouldRefreshInterviewProgress(previousCandidate.status, newStage)) {
        patchInterviewProgressCaches(
          queryClient,
          candidateId,
          requirementId,
          newStage === 'INTERVIEW'
        )
      }
    }

    setIsSubmitting(true)
    try {
      const updated = await api.candidates.updateStatus(candidateId, newStage, milestone)
      writeCandidateCaches(candidateId, updated)
      addToast(`Moved to ${candidateStatusLabel(newStage)}`, 'success')
      setPendingModal(null)
      if (shouldRefreshInterviewProgress(previousCandidate?.status, newStage)) {
        invalidateInterviewProgress(
          queryClient,
          candidateId,
          updated.requirementId ?? options?.requirementId ?? previousCandidate?.requirementId
        )
      }
      void queryClient.invalidateQueries({ queryKey: ['candidate-activity', candidateId] })
    } catch (err) {
      if (previousCandidate) {
        queryClient.setQueryData(['candidate', candidateId], previousCandidate)
      }
      if (previousList) {
        queryClient.setQueryData(['candidates'], previousList)
      }
      if (options?.requirementId && previousRequirementList) {
        queryClient.setQueryData(
          ['candidates', 'requirement', options.requirementId],
          previousRequirementList
        )
      }
      if (previousProgress) {
        restoreInterviewProgress(
          queryClient,
          candidateId,
          requirementId,
          previousProgress
        )
      }
      addToast(err instanceof ApiError ? err.message : 'Failed to update stage', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const requestStageChange = (candidate: Candidate, newStage: CandidateStatus) => {
    if (!canChangeCandidateStage(candidate, newStage, user?.role)) {
      if (candidate.status === 'HIRED' && newStage !== candidate.status) {
        addToast(HIRED_STAGE_LOCK_MESSAGE, 'error')
      }
      return
    }
    if (requiresStageDetailsModal(newStage)) {
      setPendingModal({
        candidateId: candidate.id,
        candidateName: candidate.name,
        status: newStage,
      })
      return
    }
    void applyStageChange(candidate.id, newStage)
  }

  const confirmModal = (milestone: OfferMilestoneInput | HiredMilestoneInput) => {
    if (!pendingModal) return
    void applyStageChange(pendingModal.candidateId, pendingModal.status, milestone)
  }

  const closeModal = () => {
    if (!isSubmitting) setPendingModal(null)
  }

  return {
    pendingModal,
    isSubmitting,
    requestStageChange,
    confirmModal,
    closeModal,
  }
}
