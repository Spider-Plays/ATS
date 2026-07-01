import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowRight,
  Briefcase,
  Check,
  CheckCircle2,
  Handshake,
  Loader2,
  Sparkles,
} from 'lucide-react'
import clsx from 'clsx'
import { api } from '@/services/api'
import { useAuth } from '@/hooks/useAuth'
import { SkillSelectSection } from '@/components/skills/SkillSelectSection'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { AppSelect } from '@/components/ui/AppSelect'
import { AppDatePicker } from '@/components/ui/AppDatePicker'
import { EMPLOYMENT_TYPE_OPTIONS } from '@/lib/selectOptions'
import { WizardStepFooter } from '@/components/ui/WizardStepFooter'
import { PageHero } from '@/components/layout/PageHero'
import { ClientSelectField } from '@/components/requirements/ClientSelectField'
import {
  isSingleClientValue,
  ONE_CLIENT_PER_REQUIREMENT_MSG,
} from '@/lib/requirementClient'
import { useToastStore } from '@/store/toastStore'
import { ApiError } from '@/lib/apiClient'
import { priorityMeta } from '@/pages/requirements/_shared/requirement.utils'
import {
  WORK_MODES,
  SENIORITY_LEVELS,
  buildLocationDisplay,
  employmentTypeLabel,
  workModeLabel,
  seniorityLabel,
  formatExperienceRange,
  formatRequirementLocation,
  formatDateLabel,
} from '@/lib/requirementFields'
import '@/pages/requirements/new/new.css'

const requiredYears = z.preprocess(
  (v) => (v === '' || v === null || v === undefined ? NaN : Number(v)),
  z
    .number({ invalid_type_error: 'Required', required_error: 'Required' })
    .min(0, 'Must be 0 or more')
    .max(50, 'Must be 50 or less')
)

const schema = z
  .object({
    client: z
      .string()
      .min(1, 'Client is required')
      .refine(isSingleClientValue, { message: ONE_CLIENT_PER_REQUIREMENT_MSG }),
    title: z.string().min(3, 'Title must be at least 3 characters'),
    department: z.string().min(1, 'Department is required'),
    accountManager: z.string().min(1, 'Account manager is required'),
    hiringManager: z.string().min(1, 'Hiring manager is required'),
    openings: z.number().min(1, 'At least 1 opening required'),
    primarySkills: z.array(z.string()).min(1, 'Select at least one primary skill'),
    secondarySkills: z.array(z.string()).default([]),
    jobDescription: z.string().min(20, 'Job description must be at least 20 characters'),
    priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
    seniorityLevel: z.enum(['JUNIOR', 'MID', 'SENIOR', 'LEAD', 'PRINCIPAL']),
    employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN']),
    workMode: z.enum(['REMOTE', 'HYBRID', 'ONSITE']),
    isRemote: z.boolean().default(false),
    locationCity: z.string().min(1, 'City is required'),
    experienceMinYears: requiredYears,
    experienceMaxYears: requiredYears,
    salaryBand: z.string().min(1, 'Salary band is required'),
    targetStartDate: z.string().min(1, 'Target start date is required'),
    hiringDeadline: z.string().min(1, 'Hiring deadline is required'),
  })
  .refine((d) => d.experienceMaxYears >= d.experienceMinYears, {
    message: 'Max experience must be ≥ min',
    path: ['experienceMaxYears'],
  })

type FormValues = z.infer<typeof schema>

const STEPS = [
  { id: 0, label: 'Client & role', description: 'Stakeholders and role basics', icon: Handshake },
  { id: 1, label: 'Skills & description', description: 'Skills and full job description', icon: Sparkles },
  { id: 2, label: 'Review & create', description: 'Confirm before saving', icon: CheckCircle2 },
] as const

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const

const inputClass =
  'w-full px-4 py-3 rounded-xl border border-primary/10 dark:border-white/10 bg-white dark:bg-white/[0.02] focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none font-medium text-primary dark:text-white placeholder:text-primary/30 dark:placeholder:text-white/30 transition-shadow'

function FieldLabel({
  children,
  required,
}: {
  children: React.ReactNode
  required?: boolean
}) {
  return (
    <label className="text-xs font-bold text-primary/60 dark:text-white/60 uppercase tracking-wider flex items-center gap-1">
      {required && <span className="text-red-500" aria-hidden>*</span>}
      {children}
    </label>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs font-bold text-red-500 mt-1">{message}</p>
}

const NewBusinessRequirement = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { addToast } = useToastStore()
  const [currentStep, setCurrentStep] = useState(0)

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: api.users.list,
  })

  const { data: departmentCatalog = [] } = useQuery({
    queryKey: ['department-catalog'],
    queryFn: api.departments.list,
  })

  const departmentOptions = useMemo(
    () => departmentCatalog.map((d) => ({ value: d.name, label: d.name })),
    [departmentCatalog]
  )

  const accountManagerOptions = useMemo(() => {
    const options = users
      .filter((u) => u.status === 'ACTIVE' && u.role === 'ACCOUNT_MANAGER')
      .map((u) => ({
        value: u.uid,
        label: u.name,
        sublabel: [u.department, u.email].filter(Boolean).join(' · '),
      }))
    if (
      user?.uid &&
      user.role === 'ACCOUNT_MANAGER' &&
      !options.some((o) => o.value === user.uid)
    ) {
      options.unshift({ value: user.uid, label: user.name, sublabel: user.email ?? '' })
    }
    return options
  }, [users, user])

  const hiringManagerOptions = useMemo(() => {
    const options = users
      .filter((u) => u.status === 'ACTIVE' && u.role === 'HIRING_MANAGER')
      .map((u) => ({
        value: u.uid,
        label: u.name,
        sublabel: [u.department, u.email].filter(Boolean).join(' · '),
      }))
    if (
      user?.uid &&
      user.role === 'HIRING_MANAGER' &&
      !options.some((o) => o.value === user.uid)
    ) {
      options.unshift({ value: user.uid, label: user.name, sublabel: user.email ?? '' })
    }
    return options
  }, [users, user])

  const defaultAccountManager =
    user?.role === 'ACCOUNT_MANAGER' && user.uid ? user.uid : accountManagerOptions[0]?.value ?? ''
  const defaultHiringManager =
    user?.role === 'HIRING_MANAGER' && user.uid ? user.uid : hiringManagerOptions[0]?.value ?? ''

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    trigger,
    watch,
    setValue,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      openings: 1,
      priority: 'MEDIUM',
      employmentType: 'FULL_TIME',
      isRemote: false,
      primarySkills: [],
      secondarySkills: [],
      accountManager: defaultAccountManager,
      hiringManager: defaultHiringManager,
      locationCity: '',
      salaryBand: '',
      targetStartDate: '',
      hiringDeadline: '',
    },
  })

  const formValues = watch()
  const workMode = watch('workMode')
  const isRemote = watch('isRemote')
  const locationCity = watch('locationCity')

  useEffect(() => {
    if (accountManagerOptions.length > 0 && !formValues.accountManager) {
      setValue('accountManager', accountManagerOptions[0].value, { shouldValidate: true })
    }
    if (hiringManagerOptions.length > 0 && !formValues.hiringManager) {
      setValue('hiringManager', hiringManagerOptions[0].value, { shouldValidate: true })
    }
  }, [
    accountManagerOptions,
    hiringManagerOptions,
    formValues.accountManager,
    formValues.hiringManager,
    setValue,
  ])

  const createMutation = useMutation({
    mutationFn: (values: FormValues) => {
      const location = buildLocationDisplay({
        locationCity: values.locationCity,
        workMode: values.workMode,
        isRemote: values.isRemote,
      })
      return api.businessRequirements.create({
        ...values,
        location,
        description: values.jobDescription.slice(0, 2000),
      })
    },
    onSuccess: (row) => {
      queryClient.invalidateQueries({ queryKey: ['businessRequirements'] })
      addToast('Business requirement created', 'success')
      navigate(`/business-requirements/${row.id}`)
    },
    onError: (err: unknown) => {
      addToast(err instanceof ApiError ? err.message : 'Could not create requirement', 'error')
    },
  })

  const nextStep = async () => {
    let isValid = false
    if (currentStep === 0) {
      isValid = await trigger([
        'client',
        'title',
        'department',
        'accountManager',
        'hiringManager',
        'openings',
        'priority',
        'seniorityLevel',
        'employmentType',
        'workMode',
        'locationCity',
        'experienceMinYears',
        'experienceMaxYears',
        'salaryBand',
        'targetStartDate',
        'hiringDeadline',
      ])
    } else if (currentStep === 1) {
      isValid = await trigger(['primarySkills', 'secondarySkills', 'jobDescription'])
    }
    if (isValid) setCurrentStep((prev) => prev + 1)
  }

  const prevStep = () => setCurrentStep((prev) => Math.max(0, prev - 1))
  const progressPct = ((currentStep + 1) / STEPS.length) * 100

  const accountManagerName =
    accountManagerOptions.find((o) => o.value === formValues.accountManager)?.label ?? '—'
  const hiringManagerName =
    hiringManagerOptions.find((o) => o.value === formValues.hiringManager)?.label ?? '—'

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <PageHero
        icon={Handshake}
        eyebrow="Business"
        title="New business requirement"
        description="Three quick steps. Stays private until you open it to the hiring team."
        actions={
          <span className="text-xs font-bold uppercase tracking-wider text-white/80">
            Step {currentStep + 1} of {STEPS.length}
          </span>
        }
      />

      <div className="h-1.5 w-full rounded-full bg-primary/10 dark:bg-white/10 overflow-hidden">
        <div
          className="h-full bg-primary dark:bg-white transition-all duration-500 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        <nav className="hidden lg:flex flex-col gap-2 w-56 shrink-0" aria-label="Form steps">
          {STEPS.map((step) => {
            const Icon = step.icon
            const done = currentStep > step.id
            const active = currentStep === step.id
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => {
                  if (step.id < currentStep) setCurrentStep(step.id)
                }}
                disabled={step.id > currentStep}
                className={clsx(
                  'flex items-start gap-3 p-4 rounded-2xl border text-left transition-all',
                  active
                    ? 'border-primary/20 dark:border-white/20 bg-white dark:bg-white/5 shadow-sm'
                    : done
                      ? 'border-transparent hover:bg-primary/5 dark:hover:bg-white/5 cursor-pointer'
                      : 'border-transparent opacity-50 cursor-not-allowed'
                )}
              >
                <div
                  className={clsx(
                    'shrink-0 size-9 rounded-xl flex items-center justify-center',
                    done
                      ? 'bg-emerald-500 text-white'
                      : active
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-primary/10 dark:bg-white/10 text-muted-foreground'
                  )}
                >
                  {done ? <Check size={18} /> : <Icon size={18} />}
                </div>
                <div className="min-w-0">
                  <p
                    className={clsx(
                      'text-sm font-bold',
                      active ? 'text-primary dark:text-white' : 'text-primary/70 dark:text-white/70'
                    )}
                  >
                    {step.label}
                  </p>
                  <p className="text-[11px] font-medium text-primary/45 dark:text-white/45 mt-0.5 leading-snug">
                    {step.description}
                  </p>
                </div>
              </button>
            )
          })}
        </nav>

        <form
          className="flex-1 min-w-0 space-y-6"
          onSubmit={handleSubmit((values) => createMutation.mutate(values))}
        >
          {currentStep === 0 && (
            <div className="app-card p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 dark:bg-white/10 text-primary dark:text-white">
                  <Briefcase size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-primary dark:text-white">Client & role</h2>
                  <p className="text-xs font-medium text-primary/50 dark:text-white/50">
                    Who owns the deal and what role is being discussed
                  </p>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Controller
                    name="client"
                    control={control}
                    render={({ field }) => (
                      <ClientSelectField
                        value={field.value}
                        onChange={field.onChange}
                        error={errors.client?.message}
                        showAdminLink={false}
                      />
                    )}
                  />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel required>Title</FieldLabel>
                  <input className={inputClass} placeholder="e.g. Senior React Developer" {...register('title')} />
                  <FieldError message={errors.title?.message} />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel required>Department</FieldLabel>
                  <Controller
                    name="department"
                    control={control}
                    render={({ field }) => (
                      <SearchableSelect
                        value={field.value}
                        onChange={field.onChange}
                        options={departmentOptions}
                        placeholder="Select department"
                      />
                    )}
                  />
                  <FieldError message={errors.department?.message} />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel required>Account manager</FieldLabel>
                  <Controller
                    name="accountManager"
                    control={control}
                    render={({ field }) => (
                      <SearchableSelect
                        value={field.value}
                        onChange={field.onChange}
                        options={accountManagerOptions}
                        placeholder="Select account manager"
                      />
                    )}
                  />
                  <FieldError message={errors.accountManager?.message} />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel required>Hiring manager</FieldLabel>
                  <Controller
                    name="hiringManager"
                    control={control}
                    render={({ field }) => (
                      <SearchableSelect
                        value={field.value}
                        onChange={field.onChange}
                        options={hiringManagerOptions}
                        placeholder="Select hiring manager"
                      />
                    )}
                  />
                  <FieldError message={errors.hiringManager?.message} />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel required>Openings</FieldLabel>
                  <input
                    type="number"
                    min={1}
                    className={inputClass}
                    {...register('openings', { valueAsNumber: true })}
                  />
                  <FieldError message={errors.openings?.message} />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel>Priority</FieldLabel>
                  <Controller
                    name="priority"
                    control={control}
                    render={({ field }) => (
                      <AppSelect
                        value={field.value}
                        onChange={field.onChange}
                        options={PRIORITIES.map((p) => ({
                          value: p,
                          label: priorityMeta(p).label,
                        }))}
                      />
                    )}
                  />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel required>Seniority</FieldLabel>
                  <Controller
                    name="seniorityLevel"
                    control={control}
                    render={({ field }) => (
                      <AppSelect
                        value={field.value}
                        onChange={field.onChange}
                        options={SENIORITY_LEVELS.map((s) => ({ value: s.value, label: s.label }))}
                      />
                    )}
                  />
                  <FieldError message={errors.seniorityLevel?.message} />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel required>Employment type</FieldLabel>
                  <Controller
                    name="employmentType"
                    control={control}
                    render={({ field }) => (
                      <AppSelect value={field.value} onChange={field.onChange} options={EMPLOYMENT_TYPE_OPTIONS} />
                    )}
                  />
                  <FieldError message={errors.employmentType?.message} />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel required>Work mode</FieldLabel>
                  <Controller
                    name="workMode"
                    control={control}
                    render={({ field }) => (
                      <AppSelect
                        value={field.value}
                        onChange={(v) => {
                          field.onChange(v)
                          setValue('isRemote', v === 'REMOTE')
                        }}
                        options={WORK_MODES.map((m) => ({ value: m.value, label: m.label }))}
                      />
                    )}
                  />
                  <FieldError message={errors.workMode?.message} />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel required>City</FieldLabel>
                  <input className={inputClass} {...register('locationCity')} />
                  <FieldError message={errors.locationCity?.message} />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel required>Min experience (years)</FieldLabel>
                  <input type="number" min={0} className={inputClass} {...register('experienceMinYears')} />
                  <FieldError message={errors.experienceMinYears?.message} />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel required>Max experience (years)</FieldLabel>
                  <input type="number" min={0} className={inputClass} {...register('experienceMaxYears')} />
                  <FieldError message={errors.experienceMaxYears?.message} />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel required>Salary / CTC band</FieldLabel>
                  <input className={inputClass} {...register('salaryBand')} />
                  <FieldError message={errors.salaryBand?.message} />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel required>Target start date</FieldLabel>
                  <Controller
                    name="targetStartDate"
                    control={control}
                    render={({ field }) => <AppDatePicker value={field.value} onChange={field.onChange} />}
                  />
                  <FieldError message={errors.targetStartDate?.message} />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel required>Hiring deadline</FieldLabel>
                  <Controller
                    name="hiringDeadline"
                    control={control}
                    render={({ field }) => <AppDatePicker value={field.value} onChange={field.onChange} />}
                  />
                  <FieldError message={errors.hiringDeadline?.message} />
                </div>
              </div>
              <p className="text-xs font-medium text-primary/50 dark:text-white/50">
                Location preview:{' '}
                {buildLocationDisplay({ locationCity, workMode, isRemote }) || '—'}
              </p>
            </div>
          )}

          {currentStep === 1 && (
            <div className="app-card p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 dark:bg-white/10 text-primary dark:text-white">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-primary dark:text-white">Skills & description</h2>
                  <p className="text-xs font-medium text-primary/50 dark:text-white/50">
                    What the client is looking for
                  </p>
                </div>
              </div>
              <Controller
                name="primarySkills"
                control={control}
                render={({ field: primaryField }) => (
                  <Controller
                    name="secondarySkills"
                    control={control}
                    render={({ field: secondaryField }) => (
                      <SkillSelectSection
                        primarySkills={primaryField.value}
                        secondarySkills={secondaryField.value}
                        onPrimaryChange={primaryField.onChange}
                        onSecondaryChange={secondaryField.onChange}
                        primaryError={errors.primarySkills?.message}
                      />
                    )}
                  />
                )}
              />
              <div className="space-y-1.5">
                <FieldLabel required>Job description</FieldLabel>
                <textarea
                  className={clsx(inputClass, 'min-h-[220px] resize-y')}
                  {...register('jobDescription')}
                  placeholder="Describe the role, responsibilities, and requirements…"
                />
                <FieldError message={errors.jobDescription?.message} />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="app-card p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-primary dark:text-white">Review & create</h2>
                  <p className="text-xs font-medium text-primary/50 dark:text-white/50">
                    Confirm details before saving
                  </p>
                </div>
              </div>
              <dl className="grid gap-4 sm:grid-cols-2 text-sm">
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-primary/50">Client</dt>
                  <dd className="font-semibold text-primary dark:text-white mt-1">{formValues.client}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-primary/50">Title</dt>
                  <dd className="font-semibold text-primary dark:text-white mt-1">{formValues.title}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-primary/50">Department</dt>
                  <dd className="font-semibold text-primary dark:text-white mt-1">{formValues.department}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-primary/50">Account manager</dt>
                  <dd className="font-semibold text-primary dark:text-white mt-1">{accountManagerName}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-primary/50">Hiring manager</dt>
                  <dd className="font-semibold text-primary dark:text-white mt-1">{hiringManagerName}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-primary/50">Location</dt>
                  <dd className="font-semibold text-primary dark:text-white mt-1">
                    {formatRequirementLocation(formValues)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-primary/50">Experience</dt>
                  <dd className="font-semibold text-primary dark:text-white mt-1">
                    {formatExperienceRange(formValues.experienceMinYears, formValues.experienceMaxYears)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-primary/50">Seniority</dt>
                  <dd className="font-semibold text-primary dark:text-white mt-1">
                    {formValues.seniorityLevel ? seniorityLabel(formValues.seniorityLevel) : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-primary/50">Employment</dt>
                  <dd className="font-semibold text-primary dark:text-white mt-1">
                    {formValues.employmentType ? employmentTypeLabel(formValues.employmentType) : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-primary/50">Work mode</dt>
                  <dd className="font-semibold text-primary dark:text-white mt-1">
                    {formValues.workMode ? workModeLabel(formValues.workMode) : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-primary/50">Target start</dt>
                  <dd className="font-semibold text-primary dark:text-white mt-1">
                    {formValues.targetStartDate ? formatDateLabel(formValues.targetStartDate) : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-primary/50">Hiring deadline</dt>
                  <dd className="font-semibold text-primary dark:text-white mt-1">
                    {formValues.hiringDeadline ? formatDateLabel(formValues.hiringDeadline) : '—'}
                  </dd>
                </div>
              </dl>
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-wider text-primary/50">Primary skills</dt>
                <dd className="font-medium text-primary dark:text-white mt-1">
                  {formValues.primarySkills?.join(', ') || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-wider text-primary/50">Job description</dt>
                <dd className="mt-2 text-sm text-primary/80 dark:text-white/80 whitespace-pre-wrap line-clamp-6">
                  {formValues.jobDescription}
                </dd>
              </div>
            </div>
          )}

          <WizardStepFooter
            currentStep={currentStep}
            onPreviousStep={prevStep}
            exitTo="/business-requirements"
            exitLabel="Cancel"
          >
            {currentStep < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={nextStep}
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-primary text-primary-foreground rounded-2xl font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20 dark:shadow-none w-full sm:w-auto"
              >
                Continue
                <ArrowRight size={18} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm active:scale-[0.98] transition-all shadow-lg shadow-emerald-600/25 disabled:opacity-60 w-full sm:w-auto"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating…
                  </>
                ) : (
                  <>
                    Create requirement
                    <Check size={18} />
                  </>
                )}
              </button>
            )}
          </WizardStepFooter>
        </form>
      </div>
    </div>
  )
}

export default NewBusinessRequirement
