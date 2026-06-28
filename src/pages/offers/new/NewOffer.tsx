import React, { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, IndianRupee, CheckCircle, User, Briefcase, Calendar } from 'lucide-react'
import { api } from '@/services/api'
import { useAuth } from '@/hooks/useAuth'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { WizardStepFooter } from '@/components/ui/WizardStepFooter'
import { TabContent } from '@/components/motion/TabContent'
import { CompensationBreakdownTable } from '@/components/offers/CompensationBreakdownTable'
import { useToastStore } from '@/store/toastStore'
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

  const { register, handleSubmit, control, trigger, watch, setValue, formState: { errors } } = useForm<OfferFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      annualCtc: 864480,
      reportingTime: '9:30 AM',
    },
  })

  const annualCtc = watch('annualCtc')

  const { data: candidates = [] } = useQuery({ queryKey: ['candidates'], queryFn: api.candidates.list })
  const { data: requirements = [] } = useQuery({ queryKey: ['requirements'], queryFn: api.requirements.list })

  const { data: breakdown } = useQuery({
    queryKey: ['offer-comp-preview', annualCtc],
    queryFn: () => api.offers.previewCompensation(annualCtc),
    enabled: annualCtc >= 10000,
  })

  const candidateId = watch('candidateId')
  const requirementId = watch('requirementId')

  useEffect(() => {
    const c = candidates.find((x) => x.id === candidateId)
    if (c?.location) setValue('candidateAddress', c.location)
    if (c?.role) setValue('positionTitle', c.role)
  }, [candidateId, candidates, setValue])

  useEffect(() => {
    const r = requirements.find((x) => x.id === requirementId)
    if (r?.client) setValue('clientCompanyName', r.client)
    if (r?.location) setValue('clientSiteAddress', r.location)
    if (r?.title) setValue('positionTitle', r.title)
  }, [requirementId, requirements, setValue])

  const candidateOptions = useMemo(
    () =>
      candidates.map((c) => ({
        value: c.id,
        label: c.name,
        sublabel: [c.role, c.email, c.status].filter(Boolean).join(' · '),
      })),
    [candidates]
  )

  const requirementOptions = useMemo(
    () =>
      requirements.map((r) => ({
        value: r.id,
        label: r.title,
        sublabel: `${r.department} · ${r.client || 'Internal'}`,
      })),
    [requirements]
  )

  const createMutation = useMutation({
    mutationFn: (data: OfferFormValues) =>
      api.offers.create({
        candidateId: data.candidateId,
        requirementId: data.requirementId,
        annualCtc: data.annualCtc,
        createdBy: user?.uid!,
        letterMeta: {
          candidateAddress: data.candidateAddress,
          positionTitle: data.positionTitle,
          joiningDate: data.joiningDate,
          clientCompanyName: data.clientCompanyName,
          clientSiteAddress: data.clientSiteAddress,
          reportingTime: data.reportingTime,
        },
      }),
    onSuccess: (offer) => {
      queryClient.invalidateQueries({ queryKey: ['offers'] })
      addToast('Offer draft created', 'success')
      navigate(`/offers/${offer.id}`)
    },
    onError: () => addToast('Failed to create offer', 'error'),
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
    if (ok) setCurrentStep((s) => Math.min(s + 1, 2))
  }

  const prevStep = () => setCurrentStep((s) => Math.max(s - 1, 0))

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div>
        <h1 className="text-2xl font-black text-primary dark:text-white tracking-tight">Create New Offer</h1>
        <p className="text-sm font-medium text-primary/60 dark:text-white/60">
          Step {currentStep + 1} of 3 — candidate, CTC breakdown, and letter details.
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
                        placeholder="Select job"
                        searchPlaceholder="Search requirements..."
                        icon={<Briefcase size={18} />}
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
                  <label className="text-xs font-bold text-primary/60 uppercase tracking-wider">Candidate address</label>
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
                    <input type="date" className="w-full mt-1 px-3 py-2 rounded-xl border" {...register('joiningDate')} />
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
                  <label className="text-xs font-bold text-primary/60 uppercase tracking-wider">Client site / reporting address</label>
                  <textarea rows={3} className="w-full mt-1 px-3 py-2 rounded-xl border text-sm" {...register('clientSiteAddress')} />
                </div>
              </div>
            </section>
          )}
        </TabContent>

        <WizardStepFooter currentStep={currentStep} onPreviousStep={prevStep} exitTo="/offers" exitLabel="Cancel">
          {currentStep < 2 ? (
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
