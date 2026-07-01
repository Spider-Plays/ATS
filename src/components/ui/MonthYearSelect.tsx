import React, { useEffect, useState } from 'react'
import { AppSelect } from './AppSelect'
import { joinMonthValue, splitMonthValue } from '@/lib/candidateMilestones'
import { calendarMonthSelectOptions, calendarYearSelectOptions } from '@/lib/selectOptions'

type MonthYearSelectProps = {
  value: string
  onChange: (value: string) => void
  monthAriaLabel: string
  yearAriaLabel: string
  disabled?: boolean
}

export function MonthYearSelect({
  value,
  onChange,
  monthAriaLabel,
  yearAriaLabel,
  disabled = false,
}: MonthYearSelectProps) {
  const [month, setMonth] = useState(() => splitMonthValue(value).month)
  const [year, setYear] = useState(() => splitMonthValue(value).year)

  useEffect(() => {
    const next = splitMonthValue(value)
    setMonth(next.month)
    setYear(next.year)
  }, [value])

  const handleMonthChange = (nextMonth: string) => {
    setMonth(nextMonth)
    onChange(joinMonthValue(year, nextMonth))
  }

  const handleYearChange = (nextYear: string) => {
    setYear(nextYear)
    onChange(joinMonthValue(nextYear, month))
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <AppSelect
        value={month}
        onChange={handleMonthChange}
        options={calendarMonthSelectOptions()}
        placeholder="Month"
        disabled={disabled}
        aria-label={monthAriaLabel}
      />
      <AppSelect
        value={year}
        onChange={handleYearChange}
        options={calendarYearSelectOptions()}
        placeholder="Year"
        disabled={disabled}
        aria-label={yearAriaLabel}
      />
    </div>
  )
}
