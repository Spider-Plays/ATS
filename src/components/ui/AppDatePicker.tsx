import React, { useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  addMonths,
  addYears,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  setMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
  subYears,
} from 'date-fns'
import { Calendar, ChevronDown, ChevronUp } from 'lucide-react'
import clsx from 'clsx'
import { parseIsoDate } from '@/lib/candidateMilestones'
import { menuPositionStyle, useSelectMenuPortal } from './select/useSelectMenuPortal'

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const
const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const

function formatIsoDateInputDisplay(isoDate: string): string {
  const d = parseIsoDate(isoDate)
  if (!d) return ''
  return format(d, 'MM/dd/yyyy')
}

type AppDatePickerProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  'aria-label'?: string
}

export function AppDatePicker({
  value,
  onChange,
  placeholder = 'mm/dd/yyyy',
  disabled = false,
  className,
  'aria-label': ariaLabel,
}: AppDatePickerProps) {
  const [open, setOpen] = useState(false)
  const [monthPickerOpen, setMonthPickerOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuId = useId().replace(/:/g, '')
  const close = () => {
    setOpen(false)
    setMonthPickerOpen(false)
  }
  const { anchor } = useSelectMenuPortal(open, triggerRef, menuId, close)

  const selectedDate = parseIsoDate(value)
  const [viewMonth, setViewMonth] = useState(() => selectedDate ?? new Date())

  useEffect(() => {
    if (!open) return
    setViewMonth(selectedDate ?? new Date())
    setMonthPickerOpen(false)
  }, [open, value])

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(viewMonth)
    const monthEnd = endOfMonth(viewMonth)
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 })
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
    return eachDayOfInterval({ start: gridStart, end: gridEnd })
  }, [viewMonth])

  const pickDate = (day: Date) => {
    onChange(format(day, 'yyyy-MM-dd'))
    close()
  }

  const pickMonth = (monthIndex: number) => {
    setViewMonth(setMonth(viewMonth, monthIndex))
    setMonthPickerOpen(false)
  }

  const displayLabel = value ? formatIsoDateInputDisplay(value) : placeholder

  return (
    <div className={clsx('relative', className)}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-label={ariaLabel ?? displayLabel}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => !disabled && setOpen((current) => !current)}
        className={clsx(
          'app-select-trigger app-select-trigger-outlined w-full',
          disabled && 'opacity-[0.38] cursor-not-allowed'
        )}
      >
        <span
          className={clsx(
            'flex-1 truncate text-left text-sm font-medium',
            !value && 'text-muted-foreground'
          )}
        >
          {displayLabel}
        </span>
        <Calendar size={18} className="shrink-0 opacity-70" aria-hidden />
      </button>

      {open &&
        anchor &&
        createPortal(
          <div
            id={menuId}
            role="dialog"
            aria-label="Choose date"
            className="app-date-picker-menu"
            style={{
              ...menuPositionStyle(anchor),
              width: Math.max(anchor.width, 280),
            }}
          >
            <div className="app-date-picker-header">
              <button
                type="button"
                onClick={() => setMonthPickerOpen((current) => !current)}
                className="app-date-picker-month-btn"
                aria-expanded={monthPickerOpen}
              >
                <span>{format(viewMonth, 'MMMM yyyy')}</span>
                <ChevronDown size={14} className="shrink-0 opacity-70" aria-hidden />
              </button>
              <div className="app-date-picker-nav-stack">
                <button
                  type="button"
                  onClick={() => setViewMonth((current) => subMonths(current, 1))}
                  className="app-date-picker-nav"
                  aria-label="Previous month"
                >
                  <ChevronUp size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMonth((current) => addMonths(current, 1))}
                  className="app-date-picker-nav"
                  aria-label="Next month"
                >
                  <ChevronDown size={16} />
                </button>
              </div>
            </div>

            {monthPickerOpen ? (
              <div className="px-3 py-3">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setViewMonth((current) => subYears(current, 1))}
                    className="app-date-picker-nav"
                    aria-label="Previous year"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <span className="text-sm font-semibold text-foreground tabular-nums">
                    {format(viewMonth, 'yyyy')}
                  </span>
                  <button
                    type="button"
                    onClick={() => setViewMonth((current) => addYears(current, 1))}
                    className="app-date-picker-nav"
                    aria-label="Next year"
                  >
                    <ChevronDown size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {MONTHS.map((label, index) => {
                    const active = viewMonth.getMonth() === index
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => pickMonth(index)}
                        className={clsx(
                          'app-date-picker-month-cell',
                          active && 'app-date-picker-month-cell-active'
                        )}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-7 gap-0 px-3 pt-2">
                  {WEEKDAYS.map((day) => (
                    <span key={day} className="app-date-picker-weekday">
                      {day}
                    </span>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-0 px-3 pb-2">
                  {calendarDays.map((day) => {
                    const inMonth = isSameMonth(day, viewMonth)
                    const selected = selectedDate ? isSameDay(day, selectedDate) : false
                    const today = isToday(day)

                    return (
                      <button
                        key={day.toISOString()}
                        type="button"
                        onClick={() => pickDate(day)}
                        className={clsx(
                          'app-date-picker-day',
                          !inMonth && 'app-date-picker-day-outside',
                          today && !selected && 'app-date-picker-day-today',
                          selected && 'app-date-picker-day-selected'
                        )}
                      >
                        {format(day, 'd')}
                      </button>
                    )
                  })}
                </div>
              </>
            )}

            <div className="app-date-picker-footer">
              <button
                type="button"
                onClick={() => {
                  onChange('')
                  close()
                }}
                className="app-date-picker-footer-btn"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => pickDate(new Date())}
                className="app-date-picker-footer-btn"
              >
                Today
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
