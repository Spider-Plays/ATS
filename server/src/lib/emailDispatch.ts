import { prisma } from './prisma.js'
import { logActivity } from '../services/activityLog.js'
import { env } from '../config/env.js'
import {
  sendAdminPasswordEmail,
  sendCandidateStatusEmail,
  sendInterviewCancelledEmail,
  sendInterviewReminderEmail,
  sendInterviewScheduledEmail,
  sendInterviewUpdatedEmail,
  sendInviteEmail,
  sendInterviewerAssignedEmail,
  sendNewCandidateNotificationEmail,
  sendOfferDeclinedEmail,
  sendOfferAcceptedEmail,
  sendReferralStatusEmail,
  sendReferralSubmittedEmail,
  sendStaffNotificationEmail,
  sendVendorAssignmentEmail,
  type SendEmailResult,
} from '../services/email.js'
import {
  getInterviewerUsers,
  getRequirementRecruiterEmails,
  getUserEmailsByIds,
  getUserEmailsByRoles,
  getVendorUserEmails,
} from './emailRecipients.js'
import {
  buildInterviewIcsAttachment,
  interviewRowToCalendarContext,
  syncInterviewCalendar,
  type InterviewCalendarContext,
} from './interviewCalendar.js'

function fireAndForget(promise: Promise<unknown>) {
  promise.catch((err) => console.error('[email]', err instanceof Error ? err.message : err))
}

async function sendToMany(
  recipients: Array<{ email: string; name: string }>,
  send: (recipient: { email: string; name: string }) => Promise<SendEmailResult>
) {
  await Promise.allSettled(recipients.map((r) => send(r)))
}

async function buildCalendarInvite(ctx: InterviewCalendarContext): Promise<Buffer> {
  const meta = await (async () => {
    const candidate = await prisma.candidate.findUnique({
      where: { id: ctx.candidateId },
      select: { name: true, email: true },
    })
    const requirement = await prisma.requirement.findUnique({
      where: { id: ctx.requirementId },
      select: { title: true, jobCode: true },
    })
    const interviewers = await getInterviewerUsers(ctx.interviewerIds)
    const stageLabel = ctx.stageName ?? ctx.type.replace(/_/g, ' ')
    const jobTitle = requirement?.title ?? 'Open role'
    const jobCode = requirement?.jobCode ? ` (${requirement.jobCode})` : ''
    const candidateName = candidate?.name ?? 'Candidate'
    const summary = `${stageLabel} interview — ${candidateName}`
    const descriptionParts = [
      `${stageLabel} interview for ${candidateName}`,
      `Role: ${jobTitle}${jobCode}`,
      ctx.description?.trim(),
      ctx.meetingLink ? `Join: ${ctx.meetingLink}` : undefined,
      ctx.location ? `Location: ${ctx.location}` : undefined,
    ].filter(Boolean)
    const attendees: Array<{ email: string; name: string }> = []
    if (candidate?.email) attendees.push({ email: candidate.email, name: candidate.name })
    for (const interviewer of interviewers) {
      if (!attendees.some((a) => a.email.toLowerCase() === interviewer.email.toLowerCase())) {
        attendees.push(interviewer)
      }
    }
    return { summary, description: descriptionParts.join('\n'), attendees }
  })()
  return buildInterviewIcsAttachment(ctx, meta)
}

export function notifyStaffUserCreated(user: { email: string; name: string; role: string }, tempPassword: string) {
  fireAndForget(
    sendInviteEmail({
      to: user.email,
      name: user.name,
      role: user.role.replace(/_/g, ' '),
      tempPassword,
    })
  )
}

export function notifyAdminPasswordReset(
  user: { email: string; name: string },
  password: string,
  setByAdmin = true
) {
  fireAndForget(sendAdminPasswordEmail({ to: user.email, name: user.name, password, setByAdmin }))
}

export async function prepareInterviewCalendar<T extends {
  id: string
  candidateId: string
  requirementId: string
  type: string
  scheduledAt: Date
  duration: number | null
  meetingLink: string | null
  location: string | null
  description: string | null
  interviewerIds: string
  calendarEventId: string | null
  calendarSequence: number
  planStageId: string | null
}>(row: T): Promise<T & {
  meetingLink: string | null
  calendarEventId: string | null
  calendarSequence: number
}> {
  const ctx = await interviewRowToCalendarContext(row)
  const synced = await syncInterviewCalendar(ctx)

  const needsUpdate =
    synced.meetingLink !== row.meetingLink ||
    synced.calendarEventId !== row.calendarEventId ||
    synced.calendarSequence !== row.calendarSequence

  if (needsUpdate) {
    await prisma.interview.update({
      where: { id: row.id },
      data: {
        meetingLink: synced.meetingLink,
        calendarEventId: synced.calendarEventId,
        calendarSequence: synced.calendarSequence,
      },
    })
  }

  return {
    ...row,
    meetingLink: synced.meetingLink,
    calendarEventId: synced.calendarEventId,
    calendarSequence: synced.calendarSequence,
  }
}

export function notifyInterviewScheduled(interview: {
  id: string
  type: string
  scheduledAt: Date
  meetingLink: string | null
  location: string | null
  description: string | null
  duration: number | null
  interviewerIds: string
  candidateId: string
  requirementId: string
  calendarEventId: string | null
  calendarSequence: number
  planStageId: string | null
}) {
  fireAndForget((async () => {
    const candidate = await prisma.candidate.findUnique({ where: { id: interview.candidateId } })
    if (!candidate) return

    const stage = interview.planStageId
      ? await prisma.interviewPlanStage.findUnique({ where: { id: interview.planStageId } })
      : null

    const ctx = await interviewRowToCalendarContext(
      { ...interview, planStageId: interview.planStageId },
      { stageName: stage?.name }
    )
    const calendarInvite = await buildCalendarInvite(ctx)
    const scheduledAt = interview.scheduledAt.toLocaleString()
    const type = (stage?.name ?? interview.type).replace(/_/g, ' ')

    if (candidate.email) {
      await sendInterviewScheduledEmail({
        to: candidate.email,
        candidateName: candidate.name,
        type,
        scheduledAt,
        meetingLink: interview.meetingLink ?? undefined,
        location: interview.location ?? undefined,
        calendarInvite,
      })
    }

    const interviewers = await getInterviewerUsers(interview.interviewerIds)
    await sendToMany(interviewers, (u) =>
      sendInterviewerAssignedEmail({
        to: u.email,
        recipientName: u.name,
        candidateName: candidate.name,
        type,
        scheduledAt,
        meetingLink: interview.meetingLink ?? undefined,
        location: interview.location ?? undefined,
        headline: 'Interview assigned to you',
        calendarInvite,
      })
    )
  })())
}

export function notifyInterviewUpdated(
  interview: {
    id: string
    type: string
    scheduledAt: Date
    meetingLink: string | null
    location: string | null
    description: string | null
    duration: number | null
    interviewerIds: string
    candidateId: string
    requirementId: string
    calendarEventId: string | null
    calendarSequence: number
    planStageId: string | null
  },
  options: { rescheduled: boolean }
) {
  fireAndForget((async () => {
    const candidate = await prisma.candidate.findUnique({ where: { id: interview.candidateId } })
    if (!candidate) return

    const stage = interview.planStageId
      ? await prisma.interviewPlanStage.findUnique({ where: { id: interview.planStageId } })
      : null

    const ctx = await interviewRowToCalendarContext(
      { ...interview, planStageId: interview.planStageId },
      { stageName: stage?.name }
    )
    const calendarInvite = await buildCalendarInvite(ctx)
    const scheduledAt = interview.scheduledAt.toLocaleString()
    const type = (stage?.name ?? interview.type).replace(/_/g, ' ')

    if (candidate.email) {
      await sendInterviewUpdatedEmail({
        to: candidate.email,
        candidateName: candidate.name,
        type,
        scheduledAt,
        meetingLink: interview.meetingLink ?? undefined,
        location: interview.location ?? undefined,
        rescheduled: options.rescheduled,
        calendarInvite,
      })
    }

    const interviewers = await getInterviewerUsers(interview.interviewerIds)
    await sendToMany(interviewers, (u) =>
      sendInterviewerAssignedEmail({
        to: u.email,
        recipientName: u.name,
        candidateName: candidate.name,
        type,
        scheduledAt,
        meetingLink: interview.meetingLink ?? undefined,
        location: interview.location ?? undefined,
        headline: options.rescheduled ? 'Interview rescheduled' : 'Interview details updated',
        calendarInvite,
      })
    )
  })())
}

export function notifyInterviewCancelled(interview: {
  id: string
  type: string
  scheduledAt: Date
  meetingLink: string | null
  location: string | null
  description: string | null
  duration: number | null
  interviewerIds: string
  candidateId: string
  requirementId: string
  calendarEventId: string | null
  calendarSequence: number
  planStageId: string | null
}) {
  fireAndForget((async () => {
    const candidate = await prisma.candidate.findUnique({ where: { id: interview.candidateId } })
    if (!candidate) return

    const stage = interview.planStageId
      ? await prisma.interviewPlanStage.findUnique({ where: { id: interview.planStageId } })
      : null

    const ctx = await interviewRowToCalendarContext(
      { ...interview, planStageId: interview.planStageId },
      { cancelled: true, stageName: stage?.name }
    )
    await syncInterviewCalendar(ctx)
    const calendarInvite = await buildCalendarInvite(ctx)

    const scheduledAt = interview.scheduledAt.toLocaleString()
    const type = (stage?.name ?? interview.type).replace(/_/g, ' ')

    if (candidate.email) {
      await sendInterviewCancelledEmail({
        to: candidate.email,
        recipientName: candidate.name,
        type,
        scheduledAt,
        calendarInvite,
      })
    }

    const interviewers = await getInterviewerUsers(interview.interviewerIds)
    await sendToMany(interviewers, (u) =>
      sendInterviewCancelledEmail({
        to: u.email,
        recipientName: u.name,
        type,
        scheduledAt,
        candidateName: candidate.name,
        calendarInvite,
      })
    )
  })())
}

export function notifyOfferStatusChange(
  offer: { id: string; candidateId: string; requirementId: string; baseSalary: number; createdBy: string },
  status: string
) {
  if (status !== 'ACCEPTED' && status !== 'DECLINED') return

  fireAndForget((async () => {
    const [candidate, requirement] = await Promise.all([
      prisma.candidate.findUnique({ where: { id: offer.candidateId } }),
      prisma.requirement.findUnique({
        where: { id: offer.requirementId },
        select: { title: true, jobCode: true },
      }),
    ])
    if (!candidate) return

    const jobTitle = requirement?.title ?? candidate.jobTitle ?? 'the role'
    const recruiters = await getRequirementRecruiterEmails(offer.requirementId)
    const creator = await getUserEmailsByIds([offer.createdBy])
    const recipients = [...recruiters]
    for (const c of creator) {
      if (!recipients.some((r) => r.email === c.email)) {
        recipients.push({ email: c.email, name: c.name })
      }
    }

    const payload = {
      candidateName: candidate.name,
      jobTitle,
      baseSalary: offer.baseSalary,
    }

    await sendToMany(recipients, (u) =>
      status === 'ACCEPTED'
        ? sendOfferAcceptedEmail({ to: u.email, recipientName: u.name, ...payload })
        : sendOfferDeclinedEmail({ to: u.email, recipientName: u.name, ...payload })
    )
  })())
}

async function offerNotificationRecipients(offer: {
  requirementId: string
  createdBy: string
}) {
  const creator = await getUserEmailsByIds([offer.createdBy])
  const recruiters = await getRequirementRecruiterEmails(offer.requirementId)
  const recipients = [...recruiters]
  for (const c of creator) {
    if (!recipients.some((r) => r.email === c.email)) {
      recipients.push({ email: c.email, name: c.name })
    }
  }
  return recipients
}

export function notifyOfferSubmittedForApproval(offer: {
  id: string
  candidateId: string
  requirementId: string
  createdBy: string
}) {
  fireAndForget((async () => {
    const [candidate, approvers] = await Promise.all([
      prisma.candidate.findUnique({ where: { id: offer.candidateId } }),
      getUserEmailsByRoles(['HR_HEAD', 'SUPER_ADMIN']),
    ])
    if (!candidate) return
    await sendToMany(approvers, (u) =>
      sendStaffNotificationEmail({
        to: u.email,
        recipientName: u.name,
        subject: `Offer pending HR approval — ${candidate.name}`,
        headline: 'Offer pending approval',
        body: `An offer for <strong>${candidate.name}</strong> is awaiting HR approval. <a href="${env.clientOrigin}/offers/${offer.id}">Review offer</a>`,
      })
    )
  })())
}

export function notifyOfferPendingExecApproval(offer: {
  id: string
  candidateId: string
}) {
  fireAndForget((async () => {
    const [candidate, approvers] = await Promise.all([
      prisma.candidate.findUnique({ where: { id: offer.candidateId } }),
      getUserEmailsByRoles(['SUPER_ADMIN']),
    ])
    if (!candidate) return
    await sendToMany(approvers, (u) =>
      sendStaffNotificationEmail({
        to: u.email,
        recipientName: u.name,
        subject: `Offer pending executive approval — ${candidate.name}`,
        headline: 'Executive approval required',
        body: `High-compensation offer for <strong>${candidate.name}</strong> requires executive approval. <a href="${env.clientOrigin}/offers/${offer.id}">Review offer</a>`,
      })
    )
  })())
}

export function notifyOfferApproved(offer: {
  id: string
  candidateId: string
  requirementId: string
  createdBy: string
}) {
  fireAndForget((async () => {
    const candidate = await prisma.candidate.findUnique({ where: { id: offer.candidateId } })
    if (!candidate) return
    const recipients = await offerNotificationRecipients(offer)
    await sendToMany(recipients, (u) =>
      sendStaffNotificationEmail({
        to: u.email,
        recipientName: u.name,
        subject: `Offer approved — ${candidate.name}`,
        headline: 'Offer approved',
        body: `The offer for <strong>${candidate.name}</strong> has been approved and is ready to send. <a href="${env.clientOrigin}/offers/${offer.id}">View offer</a>`,
      })
    )
  })())
}

export function notifyOfferRejected(offer: {
  id: string
  candidateId: string
  requirementId: string
  createdBy: string
  rejectionReason?: string | null
}) {
  fireAndForget((async () => {
    const candidate = await prisma.candidate.findUnique({ where: { id: offer.candidateId } })
    if (!candidate) return
    const recipients = await offerNotificationRecipients(offer)
    const reason = offer.rejectionReason ? ` Reason: ${offer.rejectionReason}.` : ''
    await sendToMany(recipients, (u) =>
      sendStaffNotificationEmail({
        to: u.email,
        recipientName: u.name,
        subject: `Offer rejected — ${candidate.name}`,
        headline: 'Offer rejected',
        body: `The offer for <strong>${candidate.name}</strong> was rejected and returned to draft.${reason} <a href="${env.clientOrigin}/offers/${offer.id}">View offer</a>`,
      })
    )
  })())
}

export function notifyCandidateStatusChange(
  candidate: {
    id: string
    email: string
    name: string
    status: string
    jobTitle: string | null
    requirementId: string | null
    referredByUserId: string | null
  },
  previousStatus: string
) {
  if (candidate.status === previousStatus) return

  const notifyCandidateStatuses = new Set([
    'SHORTLISTED',
    'INTERVIEW',
    'OFFER',
    'HIRED',
    'JOINED',
    'REJECTED',
  ])
  const notifyReferrerStatuses = new Set(['HIRED', 'JOINED', 'REJECTED'])

  fireAndForget((async () => {
    const requirement = candidate.requirementId
      ? await prisma.requirement.findUnique({
          where: { id: candidate.requirementId },
          select: { title: true },
        })
      : null
    const jobTitle = requirement?.title ?? candidate.jobTitle ?? 'your application'

    if (candidate.email && notifyCandidateStatuses.has(candidate.status)) {
      await sendCandidateStatusEmail({
        to: candidate.email,
        candidateName: candidate.name,
        status: candidate.status,
        jobTitle,
      })
    }

    if (candidate.referredByUserId && notifyReferrerStatuses.has(candidate.status)) {
      const referrer = await prisma.user.findUnique({
        where: { id: candidate.referredByUserId },
        select: { email: true, name: true },
      })
      if (referrer?.email) {
        await sendReferralStatusEmail({
          to: referrer.email,
          referrerName: referrer.name,
          candidateName: candidate.name,
          jobTitle,
          status: candidate.status,
        })
      }
    }

    if (candidate.status === 'REJECTED') {
      const recruiters = await getRequirementRecruiterEmails(candidate.requirementId)
      await sendToMany(recruiters, (u) =>
        sendStaffNotificationEmail({
          to: u.email,
          recipientName: u.name,
          subject: `Candidate rejected — ${candidate.name}`,
          headline: 'Candidate status updated',
          body: `<strong>${candidate.name}</strong> was marked as <strong>Rejected</strong> for <strong>${jobTitle}</strong>.`,
        })
      )
    }
  })())
}

export function notifyNewCandidate(
  candidate: {
    id: string
    name: string
    email: string
    jobTitle: string | null
    requirementId: string | null
    source: string
  },
  context: { submittedBy?: string; vendorName?: string; referrerName?: string }
) {
  fireAndForget((async () => {
    const recruiters = await getRequirementRecruiterEmails(candidate.requirementId)
    if (recruiters.length === 0) return

    const requirement = candidate.requirementId
      ? await prisma.requirement.findUnique({
          where: { id: candidate.requirementId },
          select: { title: true, jobCode: true },
        })
      : null

    await sendToMany(recruiters, (u) =>
      sendNewCandidateNotificationEmail({
        to: u.email,
        recipientName: u.name,
        candidateName: candidate.name,
        candidateEmail: candidate.email,
        jobTitle: requirement?.title ?? candidate.jobTitle ?? 'Open role',
        jobCode: requirement?.jobCode ?? undefined,
        source: candidate.source,
        submittedBy: context.submittedBy,
        vendorName: context.vendorName,
        referrerName: context.referrerName,
      })
    )
  })())
}

export function notifyReferralSubmitted(
  candidate: { name: string; email: string; jobTitle: string | null },
  referrer: { email: string; name: string },
  requirement: { title: string; jobCode: string | null }
) {
  fireAndForget(
    sendReferralSubmittedEmail({
      to: referrer.email,
      referrerName: referrer.name,
      candidateName: candidate.name,
      jobTitle: requirement.title,
      jobCode: requirement.jobCode ?? undefined,
    })
  )
}

export function notifyVendorAssignment(
  vendor: { id: string; name: string },
  requirements: Array<{ title: string; jobCode: string | null }>
) {
  if (requirements.length === 0) return

  fireAndForget((async () => {
    const vendorUsers = await getVendorUserEmails(vendor.id)
    await sendToMany(vendorUsers, (u) =>
      sendVendorAssignmentEmail({
        to: u.email,
        recipientName: u.name,
        vendorName: vendor.name,
        requirements,
      })
    )
  })())
}

export async function runInterviewReminders() {
  const now = Date.now()
  const windowMs = 30 * 60 * 1000
  const targets = [
    { hours: 24, action: 'INTERVIEW_REMINDER_24H' as const },
    { hours: 1, action: 'INTERVIEW_REMINDER_1H' as const },
  ]

  for (const target of targets) {
    const center = now + target.hours * 60 * 60 * 1000
    const from = new Date(center - windowMs)
    const to = new Date(center + windowMs)

    const interviews = await prisma.interview.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: { gte: from, lte: to },
      },
    })

    for (const interview of interviews) {
      const alreadySent = await prisma.activityLog.findFirst({
        where: {
          entityType: 'INTERVIEW',
          entityId: interview.id,
          action: target.action,
        },
      })
      if (alreadySent) continue

      const candidate = await prisma.candidate.findUnique({ where: { id: interview.candidateId } })
      if (!candidate) continue

      const ctx = await interviewRowToCalendarContext(interview)
      const calendarInvite = await buildCalendarInvite(ctx)
      const scheduledAt = interview.scheduledAt.toLocaleString()
      const type = interview.type.replace(/_/g, ' ')
      const hoursUntil = target.hours

      if (candidate.email) {
        await sendInterviewReminderEmail({
          to: candidate.email,
          recipientName: candidate.name,
          type,
          scheduledAt,
          meetingLink: interview.meetingLink ?? undefined,
          location: interview.location ?? undefined,
          hoursUntil,
          calendarInvite,
        })
      }

      const interviewers = await getInterviewerUsers(interview.interviewerIds)
      await sendToMany(interviewers, (u) =>
        sendInterviewReminderEmail({
          to: u.email,
          recipientName: u.name,
          type,
          scheduledAt,
          meetingLink: interview.meetingLink ?? undefined,
          location: interview.location ?? undefined,
          hoursUntil,
          candidateName: candidate.name,
          calendarInvite,
        })
      )

      await logActivity({
        entityType: 'INTERVIEW',
        entityId: interview.id,
        action: target.action,
        performedBy: 'system',
        performerName: 'System',
        details: { scheduledAt: interview.scheduledAt.toISOString(), hoursUntil },
      })
    }
  }
}

export function startInterviewReminderJob() {
  const intervalMs = 15 * 60 * 1000
  fireAndForget(runInterviewReminders())
  setInterval(() => fireAndForget(runInterviewReminders()), intervalMs)
}
