export type CalendarAttendee = {
  email: string
  name: string
}

export type InterviewCalendarEvent = {
  uid: string
  sequence: number
  method: 'REQUEST' | 'CANCEL'
  summary: string
  description: string
  location?: string
  meetingLink?: string
  start: Date
  end: Date
  organizerEmail: string
  organizerName: string
  attendees: CalendarAttendee[]
}

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

function formatIcsUtc(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  )
}

function foldIcsLine(line: string): string {
  const max = 75
  if (line.length <= max) return line
  const parts: string[] = [line.slice(0, max)]
  let offset = max
  while (offset < line.length) {
    parts.push(` ${line.slice(offset, offset + max - 1)}`)
    offset += max - 1
  }
  return parts.join('\r\n')
}

export function buildInterviewIcs(event: InterviewCalendarEvent): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Stitch ATS//Interview Scheduler//EN',
    `METHOD:${event.method}`,
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${escapeIcsText(event.uid)}`,
    `DTSTAMP:${formatIcsUtc(new Date())}`,
    `DTSTART:${formatIcsUtc(event.start)}`,
    `DTEND:${formatIcsUtc(event.end)}`,
    foldIcsLine(`SUMMARY:${escapeIcsText(event.summary)}`),
    foldIcsLine(`DESCRIPTION:${escapeIcsText(event.description)}`),
    `SEQUENCE:${event.sequence}`,
    `STATUS:${event.method === 'CANCEL' ? 'CANCELLED' : 'CONFIRMED'}`,
    foldIcsLine(
      `ORGANIZER;CN=${escapeIcsText(event.organizerName)}:mailto:${event.organizerEmail}`
    ),
  ]

  if (event.location) {
    lines.push(foldIcsLine(`LOCATION:${escapeIcsText(event.location)}`))
  }
  if (event.meetingLink) {
    lines.push(foldIcsLine(`URL:${escapeIcsText(event.meetingLink)}`))
  }

  for (const attendee of event.attendees) {
    lines.push(
      foldIcsLine(
        `ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE;CN=${escapeIcsText(attendee.name)}:mailto:${attendee.email}`
      )
    )
  }

  lines.push('END:VEVENT', 'END:VCALENDAR')
  return `${lines.join('\r\n')}\r\n`
}

export function interviewCalendarUid(interviewId: string): string {
  return `interview-${interviewId}@stitch-ats.in`
}

export function interviewEndTime(scheduledAt: Date, durationMinutes: number | null | undefined): Date {
  const end = new Date(scheduledAt)
  end.setMinutes(end.getMinutes() + (durationMinutes ?? 60))
  return end
}
