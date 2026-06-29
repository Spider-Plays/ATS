import React from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { SearchableMultiSelect } from '@/components/ui/SearchableMultiSelect'
import type { SelectOption } from '@/components/ui/SearchableSelect'
import type { OfferApprovalChain } from '@/types'

type OfferApprovalChainEditorProps = {
  value: OfferApprovalChain
  onChange: (chain: OfferApprovalChain) => void
  approverOptions: SelectOption[]
  disabled?: boolean
}

export function OfferApprovalChainEditor({
  value,
  onChange,
  approverOptions,
  disabled = false,
}: OfferApprovalChainEditorProps) {
  const updateStage = (index: number, patch: Partial<OfferApprovalChain['stages'][number]>) => {
    const stages = value.stages.map((stage, i) => (i === index ? { ...stage, ...patch } : stage))
    onChange({ stages })
  }

  const addStage = () => {
    const nextNum = value.stages.length + 1
    onChange({
      stages: [
        ...value.stages,
        { id: crypto.randomUUID(), label: `L${nextNum}`, approverIds: [] },
      ],
    })
  }

  const removeStage = (index: number) => {
    if (value.stages.length <= 2) return
    onChange({ stages: value.stages.filter((_, i) => i !== index) })
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-primary/60 dark:text-white/60">
        Assign approvers for each stage. L1 and L2 are required; add more stages if needed.
      </p>
      {value.stages.map((stage, index) => (
        <div
          key={stage.id}
          className="rounded-xl border border-primary/10 bg-primary/[0.02] p-4 space-y-3"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1">
              <span className="text-xs font-bold uppercase tracking-wider text-primary/50 w-8">
                {index + 1}
              </span>
              <input
                type="text"
                value={stage.label}
                disabled={disabled}
                onChange={(e) => updateStage(index, { label: e.target.value })}
                className="flex-1 px-3 py-2 rounded-lg border border-primary/10 text-sm font-bold"
                placeholder="Stage label"
              />
            </div>
            {value.stages.length > 2 && !disabled && (
              <button
                type="button"
                onClick={() => removeStage(index)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                aria-label={`Remove ${stage.label}`}
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-primary/60 uppercase tracking-wider">
              Approvers
            </label>
            <SearchableMultiSelect
              value={stage.approverIds}
              onChange={(ids) => updateStage(index, { approverIds: ids })}
              options={approverOptions}
              placeholder="Select approvers..."
              searchPlaceholder="Search team members..."
              emptyLabel="No eligible approvers"
              className={disabled ? 'pointer-events-none opacity-60' : undefined}
            />
          </div>
        </div>
      ))}
      {!disabled && (
        <button
          type="button"
          onClick={addStage}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-primary/20 text-sm font-bold text-primary/70 hover:bg-primary/5"
        >
          <Plus size={16} /> Add approval stage
        </button>
      )}
    </div>
  )
}
