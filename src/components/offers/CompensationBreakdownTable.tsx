import React from 'react'
import type { CompensationBreakdown } from '@/types'

function fmt(n: number) {
  return Math.round(n).toLocaleString('en-IN')
}

type Props = {
  breakdown: CompensationBreakdown
  compact?: boolean
}

export function CompensationBreakdownTable({ breakdown, compact }: Props) {
  const rows: Array<{ label: string; annual: number; monthly: number; bold?: boolean }> = [
    ...breakdown.earnings.map((e) => ({ label: e.label, annual: e.annual, monthly: e.monthly })),
    { label: breakdown.gross.label, annual: breakdown.gross.annual, monthly: breakdown.gross.monthly, bold: true },
    ...breakdown.employerContributions.map((e) => ({
      label: e.label,
      annual: e.annual,
      monthly: e.monthly,
    })),
    {
      label: breakdown.totalCtc.label,
      annual: breakdown.totalCtc.annual,
      monthly: breakdown.totalCtc.monthly,
      bold: true,
    },
    ...breakdown.employeeDeductions.map((e) => ({
      label: e.label,
      annual: e.annual,
      monthly: e.monthly,
    })),
    {
      label: breakdown.totalDeduction.label,
      annual: breakdown.totalDeduction.annual,
      monthly: breakdown.totalDeduction.monthly,
      bold: true,
    },
    {
      label: breakdown.netPay.label,
      annual: breakdown.netPay.annual,
      monthly: breakdown.netPay.monthly,
      bold: true,
    },
  ]

  return (
    <div className="overflow-x-auto">
      <table className={`w-full text-left border-collapse ${compact ? 'text-xs' : 'text-sm'}`}>
        <thead>
          <tr className="bg-primary text-primary-foreground">
            <th className="p-2 border border-primary/20">Head</th>
            <th className="p-2 border border-primary/20 text-right">Annual</th>
            <th className="p-2 border border-primary/20 text-right">Monthly</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.label}
              className={row.bold ? 'bg-slate-50 dark:bg-white/5 font-bold' : ''}
            >
              <td className="p-2 border border-primary/10">{row.label}</td>
              <td className="p-2 border border-primary/10 text-right">{fmt(row.annual)}</td>
              <td className="p-2 border border-primary/10 text-right">{fmt(row.monthly)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
