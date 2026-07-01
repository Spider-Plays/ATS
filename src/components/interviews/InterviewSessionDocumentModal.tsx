import React, { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FileText, Loader2, X } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { DocumentPreviewFrame } from '@/components/documents/DocumentPreviewFrame'
import { api } from '@/services/api'

type DocumentKind = 'resume' | 'jobDescription'

type InterviewSessionDocumentModalProps = {
  open: boolean
  onClose: () => void
  kind: DocumentKind
  interviewId: string
  requirementId: string
  candidateName?: string
  jobTitle?: string
}

export function InterviewSessionDocumentModal({
  open,
  onClose,
  kind,
  interviewId,
  requirementId,
  candidateName,
  jobTitle,
}: InterviewSessionDocumentModalProps) {
  const [resumeBlobUrl, setResumeBlobUrl] = useState<string | null>(null)
  const [resumeMimeType, setResumeMimeType] = useState<string | null>(null)
  const [resumeError, setResumeError] = useState<string | null>(null)
  const [resumeLoading, setResumeLoading] = useState(false)

  const { data: requirement, isLoading: requirementLoading } = useQuery({
    queryKey: ['requirement', requirementId],
    queryFn: () => api.requirements.getById(requirementId),
    enabled: open && kind === 'jobDescription' && !!requirementId,
  })

  const { data: candidate } = useQuery({
    queryKey: ['candidate', interviewId, 'resume-meta'],
    queryFn: async () => {
      const interview = await api.interviews.get(interviewId)
      if (!interview?.candidateId) return undefined
      return api.candidates.get(interview.candidateId)
    },
    enabled: open && kind === 'resume' && !!interviewId,
  })

  useEffect(() => {
    if (!open || kind !== 'resume') return

    let objectUrl: string | null = null
    let cancelled = false

    const load = async () => {
      setResumeLoading(true)
      setResumeError(null)
      setResumeBlobUrl(null)
      setResumeMimeType(null)
      try {
        const blob = await api.interviews.fetchCandidateResume(interviewId)
        if (cancelled || !blob) {
          if (!cancelled && !blob) setResumeError('No resume uploaded for this candidate.')
          return
        }
        objectUrl = URL.createObjectURL(blob)
        setResumeBlobUrl(objectUrl)
        setResumeMimeType(blob.type || null)
      } catch (e) {
        if (!cancelled) {
          setResumeError(e instanceof Error ? e.message : 'Could not load resume')
        }
      } finally {
        if (!cancelled) setResumeLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [open, kind, interviewId])

  const resumeDisplayName = candidate?.resumeFileName ?? 'Resume'

  const title =
    kind === 'resume'
      ? `${candidateName || 'Candidate'} — resume`
      : `${jobTitle || 'Role'} — job description`

  const subtitle =
    kind === 'resume'
      ? 'View-only resume preview for this interview session.'
      : 'Job description from the linked requirement.'

  const jobDescriptionText =
    requirement?.jobDescription?.trim() ||
    requirement?.description?.trim() ||
    ''

  return (
    <Modal open={open} onClose={onClose} aria-labelledby="interview-session-doc-title">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-white/10 w-[min(100vw-2rem,56rem)] max-h-[min(100vh-2rem,900px)] flex flex-col overflow-hidden">
        <div className="flex items-start justify-between gap-4 p-5 border-b border-slate-200 dark:border-white/10 shrink-0">
          <div>
            <p className="text-xs font-bold uppercase text-slate-500">Interview prep</p>
            <h2 id="interview-session-doc-title" className="text-lg font-black text-slate-900 dark:text-white">
              {title}
            </h2>
            <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500"
            aria-label="Close preview"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50 dark:bg-slate-950/40">
          {kind === 'resume' ? (
            resumeLoading ? (
              <div className="py-20 flex flex-col items-center gap-3 text-slate-500">
                <Loader2 size={28} className="animate-spin" />
                <p className="text-sm font-medium">Loading resume…</p>
              </div>
            ) : resumeError ? (
              <p className="text-sm text-red-600 dark:text-red-400 text-center py-12 font-medium">
                {resumeError}
              </p>
            ) : resumeBlobUrl ? (
              <>
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-500">Document</p>
                    <p className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2 mt-1">
                      <FileText size={18} className="shrink-0 text-slate-400" />
                      <span className="truncate">{resumeDisplayName}</span>
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      View only — downloading is not available in the interviewer session.
                    </p>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden p-1">
                  <DocumentPreviewFrame
                    blobUrl={resumeBlobUrl}
                    title="Resume preview"
                    mimeType={resumeMimeType ?? candidate?.resumeMimeType}
                    fileName={resumeDisplayName}
                  />
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-500 text-center py-12">
                No resume has been uploaded for this candidate yet.
              </p>
            )
          ) : requirementLoading ? (
            <div className="py-20 flex flex-col items-center gap-3 text-slate-500">
              <Loader2 size={28} className="animate-spin" />
              <p className="text-sm font-medium">Loading job description…</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 p-6">
              {jobDescriptionText ? (
                <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 leading-relaxed">
                  <p className="whitespace-pre-wrap m-0">{jobDescriptionText}</p>
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-8">
                  No job description provided for this requirement.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
