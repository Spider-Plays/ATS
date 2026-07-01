import React, { useEffect, useMemo } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Handshake, Loader2 } from 'lucide-react'
import { BackButton } from '@/components/ui/BackButton'
import { api } from '@/services/api'
import { useAuth } from '@/hooks/useAuth'
import { SkillSelectSection } from '@/components/skills/SkillSelectSection'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { AppSelect } from '@/components/ui/AppSelect'
import { AppDatePicker } from '@/components/ui/AppDatePicker'
import { EMPLOYMENT_TYPE_OPTIONS } from '@/lib/selectOptions'
import { PageHero } from '@/components/layout/PageHero'
import { ClientSelectField } from '@/components/requirements/ClientSelectField'
import {
  isSingleClientValue,
  ONE_CLIENT_PER_REQUIREMENT_MSG,
} from '@/lib/requirementClient'
import { useToastStore } from '@/store/toastStore'
import { ApiError } from '@/lib/apiClient'
import { canMutateBusinessRequirement } from '@/permissions'
import {
  WORK_MODES,
  SENIORITY_LEVELS,
  buildLocationDisplay,
} from '@/lib/requirementFields'
import '@/pages/requirements/new/new.css'

const schema = z.object({
  client: z
    .string()
    .min(1, 'Client is required')
    .refine(isSingleClientValue, { message: ONE_CLIENT_PER_REQUIREMENT_MSG }),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  department: z.string().min(1, 'Department is required'),
  accountManager: z.string().min(1, 'Account manager is required'),
  hiringManager: z.string().min(1, 'Hiring manager is required'),
  openings: z.number().min(1),
  primarySkills: z.array(z.string()).min(1),
  secondarySkills: z.array(z.string()).default([]),
  jobDescription: z.string().min(20),
  priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
  seniorityLevel: z.enum(['JUNIOR', 'MID', 'SENIOR', 'LEAD', 'PRINCIPAL']),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN']),
  workMode: z.enum(['REMOTE', 'HYBRID', 'ONSITE']),
  isRemote: z.boolean().default(false),
  locationCity: z.string().min(1),
  experienceMinYears: z.number().min(0),
  experienceMaxYears: z.number().min(0),
  salaryBand: z.string().min(1),
  targetStartDate: z.string().min(1),
  hiringDeadline: z.string().min(1),
})

type FormValues = z.infer<typeof schema>

const inputClass =
  'w-full px-4 py-3 rounded-xl border border-primary/10 dark:border-white/10 bg-white dark:bg-white/[0.02] focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none font-medium text-primary dark:text-white'

const EditBusinessRequirement = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { addToast } = useToastStore()

  const { data: req, isLoading } = useQuery({
    queryKey: ['businessRequirement', id],
    queryFn: () => api.businessRequirements.getById(id!),
    enabled: !!id,
  })

  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: api.users.list })
  const { data: departmentCatalog = [] } = useQuery({
    queryKey: ['department-catalog'],
    queryFn: api.departments.list,
  })

  const departmentOptions = useMemo(
    () => departmentCatalog.map((d) => ({ value: d.name, label: d.name })),
    [departmentCatalog]
  )

  const accountManagerOptions = useMemo(
    () =>
      users
        .filter((u) => u.status === 'ACTIVE' && u.role === 'ACCOUNT_MANAGER')
        .map((u) => ({ value: u.uid, label: u.name, sublabel: u.email })),
    [users]
  )

  const hiringManagerOptions = useMemo(
    () =>
      users
        .filter((u) => u.status === 'ACTIVE' && u.role === 'HIRING_MANAGER')
        .map((u) => ({ value: u.uid, label: u.name, sublabel: u.email })),
    [users]
  )

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (!req) return
    reset({
      client: req.client ?? '',
      title: req.title,
      department: req.department,
      accountManager: req.accountManager,
      hiringManager: req.hiringManager,
      openings: req.openings,
      primarySkills: req.primarySkills ?? [],
      secondarySkills: req.secondarySkills ?? [],
      jobDescription: req.jobDescription ?? req.description ?? '',
      priority: req.priority ?? 'MEDIUM',
      seniorityLevel: req.seniorityLevel ?? 'MID',
      employmentType: req.employmentType ?? 'FULL_TIME',
      workMode: req.workMode ?? 'ONSITE',
      isRemote: req.isRemote ?? false,
      locationCity: req.locationCity ?? '',
      experienceMinYears: req.experienceMinYears ?? 0,
      experienceMaxYears: req.experienceMaxYears ?? 0,
      salaryBand: req.salaryBand ?? '',
      targetStartDate: req.targetStartDate?.slice(0, 10) ?? '',
      hiringDeadline: req.hiringDeadline?.slice(0, 10) ?? '',
    })
  }, [req, reset])

  const workMode = watch('workMode')
  const locationCity = watch('locationCity')
  const isRemote = watch('isRemote')

  const canEdit = req ? canMutateBusinessRequirement(user?.role, req, user?.uid) : false

  const updateMutation = useMutation({
    mutationFn: (values: FormValues) =>
      api.businessRequirements.update(id!, {
        ...values,
        location: buildLocationDisplay({
          locationCity: values.locationCity,
          workMode: values.workMode,
          isRemote: values.isRemote,
        }),
        description: values.jobDescription.slice(0, 2000),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businessRequirement', id] })
      queryClient.invalidateQueries({ queryKey: ['businessRequirements'] })
      queryClient.invalidateQueries({ queryKey: ['activityLogs'] })
      queryClient.invalidateQueries({ queryKey: ['businessRequirementActivity', id] })
      addToast('Business requirement updated', 'success')
      navigate(`/business-requirements/${id}`)
    },
    onError: (err: unknown) => {
      addToast(err instanceof ApiError ? err.message : 'Could not update requirement', 'error')
    },
  })

  if (isLoading) {
    return <div className="p-12 text-center animate-pulse">Loading…</div>
  }
  if (!req || !canEdit || req.status !== 'ACTIVE') {
    return <Navigate to={id ? `/business-requirements/${id}` : '/business-requirements'} replace />
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12 p-6 md:p-8">
      <BackButton
        fallback={`/business-requirements/${id}`}
        to={`/business-requirements/${id}`}
        label="Back to requirement"
        variant="muted"
      />

      <PageHero
        icon={Handshake}
        eyebrow="Business"
        title="Edit business requirement"
        description="Update role details while the deal is still in progress."
      />

      <form
        className="app-card p-6 md:p-8 space-y-6"
        onSubmit={handleSubmit((v) => updateMutation.mutate(v))}
      >
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
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-primary/60">Title</label>
            <input className={inputClass} {...register('title')} />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-primary/60">Department</label>
            <Controller
              name="department"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  value={field.value}
                  onChange={field.onChange}
                  options={departmentOptions}
                />
              )}
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-primary/60">Account manager</label>
            <Controller
              name="accountManager"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  value={field.value}
                  onChange={field.onChange}
                  options={accountManagerOptions}
                />
              )}
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-primary/60">Hiring manager</label>
            <Controller
              name="hiringManager"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  value={field.value}
                  onChange={field.onChange}
                  options={hiringManagerOptions}
                />
              )}
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-primary/60">Openings</label>
            <input type="number" min={1} className={inputClass} {...register('openings', { valueAsNumber: true })} />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-primary/60">City</label>
            <input className={inputClass} {...register('locationCity')} />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-primary/60">Work mode</label>
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
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-primary/60">Seniority</label>
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
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-primary/60">Employment type</label>
            <Controller
              name="employmentType"
              control={control}
              render={({ field }) => (
                <AppSelect value={field.value} onChange={field.onChange} options={EMPLOYMENT_TYPE_OPTIONS} />
              )}
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-primary/60">Salary band</label>
            <input className={inputClass} {...register('salaryBand')} />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-primary/60">Target start</label>
            <Controller
              name="targetStartDate"
              control={control}
              render={({ field }) => <AppDatePicker value={field.value} onChange={field.onChange} />}
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-primary/60">Hiring deadline</label>
            <Controller
              name="hiringDeadline"
              control={control}
              render={({ field }) => <AppDatePicker value={field.value} onChange={field.onChange} />}
            />
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Location: {buildLocationDisplay({ locationCity, workMode, isRemote }) || '—'}
        </p>

        <Controller
          name="primarySkills"
          control={control}
          render={({ field: p }) => (
            <Controller
              name="secondarySkills"
              control={control}
              render={({ field: s }) => (
                <SkillSelectSection
                  primarySkills={p.value}
                  secondarySkills={s.value}
                  onPrimaryChange={p.onChange}
                  onSecondaryChange={s.onChange}
                  primaryError={errors.primarySkills?.message}
                />
              )}
            />
          )}
        />

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-primary/60">Job description</label>
          <textarea className={`${inputClass} min-h-[200px] mt-1`} {...register('jobDescription')} />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-primary/10">
          <BackButton
            to={`/business-requirements/${id}`}
            fallback={`/business-requirements/${id}`}
            label="Cancel"
            showIcon={false}
            variant="muted"
          />
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-60"
          >
            {updateMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Save changes
          </button>
        </div>
      </form>
    </div>
  )
}

export default EditBusinessRequirement
