import React, { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, IndianRupee, CheckCircle, User, Briefcase, Calendar, Users } from 'lucide-react'
import { api } from '@/services/api'
import { useAuth } from '@/hooks/useAuth'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { AppDatePicker } from '@/components/ui/AppDatePicker'
import { WizardStepFooter } from '@/components/ui/WizardStepFooter'
import { TabContent } from '@/components/motion/TabContent'
import { CompensationBreakdownTable } from '@/components/offers/CompensationBreakdownTable'
import { useToastStore } from '@/store/toastStore'
import { isOfferStageCandidate } from '@/pages/candidates/_shared/candidate.utils'
import { requirementSelectOptions } from '@/lib/selectOptions'
import { formatRequirementLocation } from '@/lib/requirementFields'
import { OfferApprovalChainEditor } from '@/components/offers/OfferApprovalChainEditor'
import {
  createDefaultApprovalChain,
  OFFER_APPROVER_ELIGIBLE_ROLES,
  validateApprovalChain,
} from '@/lib/offerApprovalChain'
import type { OfferApprovalChain } from '@/types'
import './new.css'

const schema = z.object({
  candidateId: z.string().min(1, 'Candidate is required'),
  requirementId: z.string().min(1, 'Job Requirement is required'),
  annualCtc: z.number().min(10000, 'Annual CTC must be at least 10,000'),
  candidateAddress: z.string().min(5, 'Candidate address is required'),
  positionTitle: z.string().min(1, 'Position title is required'),
  joiningDate: z.string().min(1, 'Joining date is required'),
  clientCompanyName: z.string().min(1, 'Client company is required'),
  clientSiteAddress: z.string().min(5, 'Client site address is required'),
  reportingTime: z.string().optional(),
})

type OfferFormValues = z.infer<typeof schema>

const NewOffer = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { addToast } = useToastStore()
  const [currentStep, setCurrentStep] = useState(0)
  const [approvalChain, setApprovalChain] = useState<OfferApprovalChain>(createDefaultApprovalChain)

  const { register, handleSubmit, control, trigger, watch, setValue, formState: { errors } } = useForm<OfferFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      annualCtc: 0,
      reportingTime: '9:30 AM',
    },
  })

  const annualCtc = watch('annualCtc')

  const { data: candidates = [] } = useQuery({ queryKey: ['candidates'], queryFn: api.candidates.list })
  const { data: requirements = [] } = useQuery({ queryKey: ['requirements'], queryFn: api.requirements.list })
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: api.users.list })

  const { data: breakdown } = useQuery({
    queryKey: ['offer-comp-preview', annualCtc],
    queryFn: () => api.offers.previewCompensation(annualCtc),
    enabled: annualCtc >= 10000,
  })

  const candidateId = watch('candidateId')
  const requirementId = watch('requirementId')

  const offerStageCandidates = useMemo(
    () => candidates.filter(isOfferStageCandidate),
    [candidates]
  )

  const candidateOptions = useMemo(
    () =>
      offerStageCandidates.map((c) => ({
        value: c.id,
        label: c.name,
        sublabel: [c.role, c.email, c.status].filter(Boolean).join(' · '),
      })),
    [offerStageCandidates]
  )

  const selectedCandidate = useMemo(
    () => offerStageCandidates.find((c) => c.id === candidateId),
    [offerStageCandidates, candidateId]
  )

  const selectedRequirement = useMemo(
    () => requirements.find((r) => r.id === requirementId),
    [requirements, requirementId]
  )

  useEffect(() => {
    if (!candidateId) {
      setValue('requirementId', '')
      return
    }
    const candidate = offerStageCandidates.find((c) => c.id === candidateId)
    if (candidate?.requirementId) {
      setValue('requirementId', candidate.requirementId)
    }
  }, [candidateId, offerStageCandidates, setValue])

  useEffect(() => {
    if (selectedCandidate?.location) {
      setValue('candidateAddress', selectedCandidate.location)
    }
    if (selectedRequirement?.client) {
      setValue('clientCompanyName', selectedRequirement.client)
    }
    if (selectedRequirement) {
      const siteAddress = formatRequirementLocation(selectedRequirement)
      if (siteAddress !== '—') setValue('clientSiteAddress', siteAddress)
    }
    if (selectedRequirement?.title) setValue('positionTitle', selectedRequirement.title)
    else if (selectedCandidate?.role) setValue('positionTitle', selectedCandidate.role)
  }, [selectedCandidate, selectedRequirement, setValue])

  useEffect(() => {
    if (currentStep !== 2) return
    if (selectedCandidate?.location) {
      setValue('candidateAddress', selectedCandidate.location)
    }
    if (selectedRequirement) {
      const siteAddress = formatRequirementLocation(selectedRequirement)
      if (siteAddress !== '—') setValue('clientSiteAddress', siteAddress)
    }
  }, [currentStep, selectedCandidate, selectedRequirement, setValue])

  const requirementOptions = useMemo(
    () => requirementSelectOptions(requirements),
    [requirements]
  )

  const approverOptions = useMemo(
    () =>
      users
        .filter((u) =>
          OFFER_APPROVER_ELIGIBLE_ROLES.includes(
            u.role as (typeof OFFER_APPROVER_ELIGIBLE_ROLES)[number]
          )
        )
        .map((u) => ({
          value: u.uid,
          label: u.name,
          sublabel: [u.role.replace(/_/g, ' '), u.email].join(' · '),
        })),
    [users]
  )

  const createMutation = useMutation({
    mutationFn: (data: OfferFormValues) => {
      const chainError = validateApprovalChain(approvalChain)
      if (chainError) throw new Error(chainError)
      return api.offers.create({
        candidateId: data.candidateId,
        requirementId: data.requirementId,
        annualCtc: data.annualCtc,
        createdBy: user?.uid!,
        approvalChain,
        letterMeta: {
          candidateAddress: data.candidateAddress,
          positionTitle: data.positionTitle,
          joiningDate: data.joiningDate,
          clientCompanyName: data.clientCompanyName,
          clientSiteAddress: data.clientSiteAddress,
          reportingTime: data.reportingTime,
        },
      })
    },
    onSuccess: (offer) => {
      queryClient.invalidateQueries({ queryKey: ['offers'] })
      addToast('Offer draft created', 'success')
      navigate(`/offers/${offer.id}`)
    },
    onError: (err: unknown) =>
      addToast(err instanceof Error ? err.message : 'Failed to create offer', 'error'),
  })

  const onSubmit = (data: OfferFormValues) => {
    createMutation.mutate(data)
  }

  const stepFields: (keyof OfferFormValues)[][] = [
    ['candidateId', 'requirementId'],
    ['annualCtc'],
    ['candidateAddress', 'positionTitle', 'joiningDate', 'clientCompanyName', 'clientSiteAddress'],
  ]

  const nextStep = async () => {
    const ok = await trigger(stepFields[currentStep])
    if (ok) setCurrentStep((s) => Math.min(s + 1, 3))
  }

  const prevStep = () => setCurrentStep((s) => Math.max(s - 1, 0))

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div>
        <h1 className="text-2xl font-black text-primary dark:text-white tracking-tight">Create New Offer</h1>
        <p className="text-sm font-medium text-primary/60 dark:text-white/60">
          Step {currentStep + 1} of 4 — candidate, CTC, letter details, and approvers.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <TabContent activeKey={String(currentStep)}>
          {currentStep === 0 && (
            <section className="bg-white dark:bg-white/5 p-8 rounded-2xl border border-primary/10 shadow-sm space-y-6">
              <h2 className="text-xl font-bold text-primary dark:text-white flex items-center gap-2">
                <User size={20} /> Candidate &amp; role
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-primary/60 uppercase tracking-wider">Candidate</label>
                  <Controller
                    control={control}
                    name="candidateId"
                    render={({ field }) => (
                      <SearchableSelect
                        value={field.value}
                        onChange={field.onChange}
                        options={candidateOptions}
                        placeholder="Select candidate"
                        searchPlaceholder="Search candidates..."
                        icon={<User size={18} />}
                      />
                    )}
                  />
                  {errors.candidateId && <p className="text-xs font-bold text-red-500">{errors.candidateId.message}</p>}
                  {offerStageCandidates.length === 0 && (
                    <p className="text-xs font-bold text-amber-700 dark:text-amber-300">
                      No candidates are in Offer stage. Move a candidate to Offer in the pipeline before creating an offer.
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-primary/60 uppercase tracking-wider">Requirement</label>
                  <Controller
                    control={control}
                    name="requirementId"
                    render={({ field }) => (
                      <SearchableSelect
                        value={field.value}
                        onChange={field.onChange}
                        options={requirementOptions}
                        placeholder="Filled from selected candidate"
                        searchPlaceholder="Search by title, req ID, or client..."
                        icon={<Briefcase size={18} />}
                        disabled
                        allowClear={false}
                      />
                    )}
                  />
                  {errors.requirementId && <p className="text-xs font-bold text-red-500">{errors.requirementId.message}</p>}
                </div>
              </div>
            </section>
          )}

          {currentStep === 1 && (
            <section className="bg-white dark:bg-white/5 p-8 rounded-2xl border border-primary/10 shadow-sm space-y-6">
              <h2 className="text-xl font-bold text-primary dark:text-white flex items-center gap-2">
                <IndianRupee size={20} /> Annual CTC
              </h2>
              <div className="space-y-2 max-w-sm">
                <label className="text-xs font-bold text-primary/60 uppercase tracking-wider">Annual CTC (INR)</label>
                <input
                  type="number"
                  className="w-full px-4 py-3 rounded-xl border border-primary/10 font-bold text-primary dark:text-white"
                  {...register('annualCtc', { valueAsNumber: true })}
                />
                {errors.annualCtc && <p className="text-xs font-bold text-red-500">{errors.annualCtc.message}</p>}
              </div>
              {breakdown && <CompensationBreakdownTable breakdown={breakdown} />}
            </section>
          )}

          {currentStep === 2 && (
            <section className="bg-white dark:bg-white/5 p-8 rounded-2xl border border-primary/10 shadow-sm space-y-6">
              <h2 className="text-xl font-bold text-primary dark:text-white flex items-center gap-2">
                <Calendar size={20} /> Letter details
              </h2>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-xs font-bold text-primary/60 uppercase tracking-wider">Candidate location</label>
                  <textarea rows={3} className="w-full mt-1 px-3 py-2 rounded-xl border text-sm" {...register('candidateAddress')} />
                  {errors.candidateAddress && <p className="text-xs text-red-500">{errors.candidateAddress.message}</p>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-primary/60 uppercase tracking-wider">Position title</label>
                    <input className="w-full mt-1 px-3 py-2 rounded-xl border" {...register('positionTitle')} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-primary/60 uppercase tracking-wider">Joining date</label>
                    <Controller
                      control={control}
                      name="joiningDate"
                      render={({ field }) => (
                        <AppDatePicker
                          value={field.value ?? ''}
                          onChange={field.onChange}
                          className="mt-1"
                          aria-label="Joining date"
                        />
                      )}
                    />
                    {errors.joiningDate && <p className="text-xs text-red-500">{errors.joiningDate.message}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-primary/60 uppercase tracking-wider">Client company</label>
                    <input className="w-full mt-1 px-3 py-2 rounded-xl border" {...register('clientCompanyName')} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-primary/60 uppercase tracking-wider">Reporting time</label>
                    <input className="w-full mt-1 px-3 py-2 rounded-xl border" {...register('reportingTime')} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-primary/60 uppercase tracking-wider">Requirement location</label>
                  <textarea rows={3} className="w-full mt-1 px-3 py-2 rounded-xl border text-sm" {...register('clientSiteAddress')} />
                </div>
              </div>
            </section>
          )}

          {currentStep === 3 && (
            <section className="bg-white dark:bg-white/5 p-8 rounded-2xl border border-primary/10 shadow-sm space-y-6">
              <h2 className="text-xl font-bold text-primary dark:text-white flex items-center gap-2">
                <Users size={20} /> Approval chain
              </h2>
              <OfferApprovalChainEditor
                value={approvalChain}
                onChange={setApprovalChain}
                approverOptions={approverOptions}
              />
            </section>
          )}
        </TabContent>

        <WizardStepFooter currentStep={currentStep} onPreviousStep={prevStep} exitTo="/offers" exitLabel="Cancel">
          {currentStep < 3 ? (
            <button type="button" onClick={nextStep} className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-xl font-bold text-sm">
              Continue <ArrowRight size={18} />
            </button>
          ) : (
            <button type="submit" disabled={createMutation.isPending} className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-xl font-bold text-sm disabled:opacity-50">
              {createMutation.isPending ? 'Creating…' : 'Create draft offer'} <CheckCircle size={18} />
            </button>
          )}
        </WizardStepFooter>
      </form>
    </div>
  )
}

export default NewOffer
