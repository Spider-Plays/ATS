import React from 'react'
import { ArrowLeft } from 'lucide-react'
import { BackButton, backButtonClass } from './BackButton'

type WizardStepFooterProps = {
  currentStep: number
  onPreviousStep: () => void
  exitTo: string
  exitLabel?: string
  children: React.ReactNode
}

/**
 * Footer for multi-step wizards. Step 0 shows an exit button; later steps show Previous.
 */
export function WizardStepFooter({
  currentStep,
  onPreviousStep,
  exitTo,
  exitLabel = 'Cancel',
  children,
}: WizardStepFooterProps) {
  const isFirst = currentStep === 0

  return (
    <div className="mt-8 pt-6 border-t border-primary/10 dark:border-white/10 flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-3">
      {isFirst ? (
        <BackButton
          to={exitTo}
          fallback={exitTo}
          label={exitLabel}
          showIcon={false}
          variant="muted"
        />
      ) : (
        <button type="button" onClick={onPreviousStep} className={backButtonClass('muted')}>
          <ArrowLeft size={16} aria-hidden />
          Previous
        </button>
      )}
      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto sm:justify-end">{children}</div>
    </div>
  )
}
