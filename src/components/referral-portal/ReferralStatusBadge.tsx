import clsx from 'clsx'
import { referralStatusBadgeClass, referralStatusLabel } from '@/lib/referralStatus'

type ReferralStatusBadgeProps = {
  status: string
  className?: string
}

export function ReferralStatusBadge({ status, className }: ReferralStatusBadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex px-2 py-0.5 rounded text-[10px] font-bold border',
        referralStatusBadgeClass(status),
        className
      )}
    >
      {referralStatusLabel(status)}
    </span>
  )
}
