import React, { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { IndianRupee, RotateCcw, Save } from 'lucide-react'
import { api } from '@/services/api'
import { CompensationBreakdownTable } from '@/components/offers/CompensationBreakdownTable'
import { useToastStore } from '@/store/toastStore'
import type { CompensationConfig } from '@/types'

const DEFAULT_CONFIG: CompensationConfig = {
  basicPercentOfCtc: 40,
  hraPercentOfBasic: 50,
  statBonusPercentOfBasic: 8.33,
  ltaPercentOfBasic: 8.33,
  mealAllowanceAnnual: 12000,
  mobileAllowanceAnnual: 7200,
  siteAllowanceAnnual: 24000,
  employerPfPercentOfBasic: 12,
  pfAdminPercentOfBasic: 1,
  insuranceAnnual: 2880,
  employerLwfAnnual: 600,
  employeeLwfAnnual: 300,
}

type FieldDef = {
  key: keyof CompensationConfig
  label: string
  suffix?: string
  step?: number
}

const EARNING_FIELDS: FieldDef[] = [
  { key: 'basicPercentOfCtc', label: 'Basic (% of CTC)', suffix: '%', step: 0.01 },
  { key: 'hraPercentOfBasic', label: 'HRA (% of Basic)', suffix: '%', step: 0.01 },
  { key: 'statBonusPercentOfBasic', label: 'Stat Bonus (% of Basic)', suffix: '%', step: 0.01 },
  { key: 'ltaPercentOfBasic', label: 'LTA (% of Basic)', suffix: '%', step: 0.01 },
  { key: 'mealAllowanceAnnual', label: 'Meal Allowance (annual)', suffix: 'INR' },
  { key: 'mobileAllowanceAnnual', label: 'Mobile Allowance (annual)', suffix: 'INR' },
  { key: 'siteAllowanceAnnual', label: 'Site Allowance (annual)', suffix: 'INR' },
]

const STATUTORY_FIELDS: FieldDef[] = [
  { key: 'employerPfPercentOfBasic', label: 'Employer PF (% of Basic)', suffix: '%', step: 0.01 },
  { key: 'pfAdminPercentOfBasic', label: 'PF Admin (% of Basic)', suffix: '%', step: 0.01 },
  { key: 'insuranceAnnual', label: 'Insurance (annual)', suffix: 'INR' },
  { key: 'employerLwfAnnual', label: 'Employer LWF (annual)', suffix: 'INR' },
  { key: 'employeeLwfAnnual', label: 'Employee LWF (annual)', suffix: 'INR' },
]

function ConfigFieldGroup({
  title,
  fields,
  config,
  onChange,
}: {
  title: string
  fields: FieldDef[]
  config: CompensationConfig
  onChange: (key: keyof CompensationConfig, value: number) => void
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-sm font-black uppercase tracking-wider text-primary/60">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((field) => (
          <div key={field.key} className="space-y-1">
            <label className="text-xs font-bold text-primary/60 uppercase tracking-wider">
              {field.label}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step={field.step ?? 1}
                className="w-full px-3 py-2 rounded-xl border border-primary/10 font-bold"
                value={config[field.key]}
                onChange={(e) => onChange(field.key, Number(e.target.value))}
              />
              {field.suffix && (
                <span className="text-xs font-bold text-primary/50 shrink-0">{field.suffix}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

const OfferCompensationConfig = () => {
  const queryClient = useQueryClient()
  const { addToast } = useToastStore()
  const [config, setConfig] = useState<CompensationConfig>(DEFAULT_CONFIG)
  const [sampleCtc, setSampleCtc] = useState(960000)

  const { data, isLoading } = useQuery({
    queryKey: ['offer-compensation-config'],
    queryFn: api.offerSettings.getCompensationConfig,
  })

  useEffect(() => {
    if (data) setConfig(data)
  }, [data])

  const { data: preview } = useQuery({
    queryKey: ['offer-comp-preview-config', sampleCtc, config],
    queryFn: () => api.offerSettings.previewCompensation(sampleCtc, config),
    enabled: sampleCtc >= 10000,
  })

  const saveMutation = useMutation({
    mutationFn: () => api.offerSettings.updateCompensationConfig(config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offer-compensation-config'] })
      addToast('Salary breakdown settings saved', 'success')
    },
    onError: () => addToast('Failed to save settings', 'error'),
  })

  const resetDefaults = () => {
    setConfig({ ...DEFAULT_CONFIG })
  }

  const updateField = (key: keyof CompensationConfig, value: number) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
  }

  if (isLoading) {
    return <p className="text-sm text-primary/60 p-8">Loading salary breakdown settings…</p>
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-primary dark:text-white tracking-tight flex items-center gap-2">
            <IndianRupee size={24} /> Salary Breakdown Configuration
          </h1>
          <p className="text-sm font-medium text-primary/60 dark:text-white/60 mt-1">
            Set CTC component percentages and fixed allowances used when creating offer letters.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={resetDefaults}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-primary/10 text-sm font-bold"
          >
            <RotateCcw size={16} /> Reset defaults
          </button>
          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-50"
          >
            <Save size={16} /> {saveMutation.isPending ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-white dark:bg-white/5 p-8 rounded-2xl border border-primary/10 shadow-sm space-y-8">
          <ConfigFieldGroup title="Earnings" fields={EARNING_FIELDS} config={config} onChange={updateField} />
          <ConfigFieldGroup title="Employer contributions & deductions" fields={STATUTORY_FIELDS} config={config} onChange={updateField} />
          <p className="text-xs text-primary/50">
            Special Allowance is calculated automatically as the remainder after all configured components.
          </p>
        </section>

        <section className="bg-white dark:bg-white/5 p-8 rounded-2xl border border-primary/10 shadow-sm space-y-6">
          <h2 className="text-sm font-black uppercase tracking-wider text-primary/60">Live preview</h2>
          <div className="space-y-2 max-w-xs">
            <label className="text-xs font-bold text-primary/60 uppercase tracking-wider">
              Sample annual CTC (INR)
            </label>
            <input
              type="number"
              className="w-full px-4 py-3 rounded-xl border border-primary/10 font-bold"
              value={sampleCtc}
              onChange={(e) => setSampleCtc(Number(e.target.value))}
            />
          </div>
          {preview && <CompensationBreakdownTable breakdown={preview} />}
        </section>
      </div>
    </div>
  )
}

export default OfferCompensationConfig
