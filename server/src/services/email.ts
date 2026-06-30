import { Resend } from 'resend'
import { env } from '../config/env.js'
import {
  emailUsesStitchMark,
  getStitchMarkInlineAttachment,
  STITCH_MARK_CID,
} from '../lib/emailBrandAssets.js'
import { isM365EmailConfigured, sendM365HtmlEmail } from '../integrations/m365/index.js'

export type SendEmailResult =
  | { sent: true; id: string }
  | { sent: false; reason: 'not_configured' }
  | { sent: false; reason: 'error'; message: string }

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const EMAIL_BRAND = {
  primary: '#1266c4',
  primaryDark: '#0d4d96',
  primaryLight: '#e8f2ff',
  text: '#1a2b3c',
  textMuted: '#64748b',
  border: '#e2e8f0',
  bg: '#f0f5fa',
  white: '#ffffff',
  /** Mark chip on dark header — matches StitchLogo inverse onDark (white/12 on primary). */
  markChipBg: '#2e76cc',
  wordmarkSuffix: '#cce0f5',
} as const

/** Inline CID mark — embedded with the email, no external URL. */
function emailStitchMarkImg(): string {
  return `<img src="cid:${STITCH_MARK_CID}" alt="" width="32" height="32" style="display:block;border:0;outline:none;width:32px;height:32px;" />`
}

/** Matches <StitchLogo tone="inverse" size="lg" onDark /> — mark chip + wordmark. */
function emailStitchLogo(): string {
  return `<table cellpadding="0" cellspacing="0" border="0" role="presentation">
    <tr>
      <td style="vertical-align:middle;padding-right:12px;">
        <table cellpadding="0" cellspacing="0" border="0" role="presentation">
          <tr>
            <td width="48" height="48" align="center" valign="middle" bgcolor="${EMAIL_BRAND.markChipBg}" style="background-color:${EMAIL_BRAND.markChipBg};border-radius:12px;">
              ${emailStitchMarkImg()}
            </td>
          </tr>
        </table>
      </td>
      <td style="vertical-align:middle;">
        <span style="font-size:24px;font-weight:800;color:#ffffff;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;letter-spacing:-0.02em;line-height:1;">Stitch</span><span style="font-size:18px;font-weight:600;color:${EMAIL_BRAND.wordmarkSuffix};font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;letter-spacing:0.02em;line-height:1;margin-left:6px;">ATS</span>
      </td>
    </tr>
  </table>`
}

/** Bulletproof CTA — solid bgcolor on td + anchor for Outlook/Gmail. */
function emailButton(href: string, label: string): string {
  const safeLabel = escapeHtml(label)
  return `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin:28px 0 0;">
    <tr>
      <td align="left">
        <table cellpadding="0" cellspacing="0" border="0" role="presentation">
          <tr>
            <td align="center" bgcolor="${EMAIL_BRAND.primary}" style="background-color:${EMAIL_BRAND.primary};border-radius:8px;">
              <a href="${href}" target="_blank" style="display:inline-block;padding:14px 32px;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:8px;border:1px solid ${EMAIL_BRAND.primary};background-color:${EMAIL_BRAND.primary};">${safeLabel}</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`
}

function detailBox(fields: Array<{ label: string; value: string; mono?: boolean }>): string {
  const rows = fields
    .map((field, index) => {
      const valueHtml = field.mono
        ? `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin-top:4px;">
            <tr>
              <td bgcolor="${EMAIL_BRAND.white}" style="background-color:${EMAIL_BRAND.white};padding:10px 14px;border:1px dashed ${EMAIL_BRAND.primary};font-family:Consolas,Monaco,monospace;font-size:16px;font-weight:600;color:${EMAIL_BRAND.primary};letter-spacing:0.04em;">${escapeHtml(field.value)}</td>
            </tr>
          </table>`
        : `<p style="margin:0;font-size:15px;color:${EMAIL_BRAND.text};font-weight:500;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">${escapeHtml(field.value)}</p>`
      return `
        <p style="margin:${index > 0 ? '16px' : '0'} 0 4px;font-size:11px;font-weight:600;color:${EMAIL_BRAND.textMuted};text-transform:uppercase;letter-spacing:0.05em;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">${escapeHtml(field.label)}</p>
        ${valueHtml}
      `
    })
    .join('')
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" bgcolor="${EMAIL_BRAND.bg}" style="background-color:${EMAIL_BRAND.bg};border:1px solid ${EMAIL_BRAND.border};">
    <tr><td style="padding:20px 24px;">${rows}</td></tr>
  </table>`
}

function emailGreeting(name: string): string {
  return `<p style="margin:0 0 8px;font-size:16px;color:${EMAIL_BRAND.text};line-height:1.6;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">Hi <strong>${escapeHtml(name)}</strong>,</p>`
}

function emailLead(html: string): string {
  return `<p style="margin:0 0 24px;font-size:15px;color:${EMAIL_BRAND.textMuted};line-height:1.6;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">${html}</p>`
}

function emailParagraph(html: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;color:${EMAIL_BRAND.textMuted};line-height:1.6;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">${html}</p>`
}

function emailNote(html: string): string {
  return `<p style="margin:16px 0 0;font-size:13px;color:${EMAIL_BRAND.textMuted};line-height:1.5;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">${html}</p>`
}

function emailBadge(label: string): string {
  return `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin-bottom:24px;">
    <tr>
      <td bgcolor="${EMAIL_BRAND.primaryLight}" style="background-color:${EMAIL_BRAND.primaryLight};padding:6px 14px;">
        <span style="font-size:12px;font-weight:700;color:${EMAIL_BRAND.primary};text-transform:uppercase;letter-spacing:0.06em;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">${escapeHtml(label)}</span>
      </td>
    </tr>
  </table>`
}

function emailLink(href: string, label: string): string {
  return `<a href="${escapeHtml(href)}" target="_blank" style="color:${EMAIL_BRAND.primary};font-weight:600;text-decoration:none;">${escapeHtml(label)}</a>`
}

function emailShell(params: { preheader?: string; headerTitle: string; content: string }): string {
  const appName = escapeHtml(env.appName)
  const headerTitle = escapeHtml(params.headerTitle)
  const preheader = params.preheader
    ? `<div style="display:none;font-size:1px;color:${EMAIL_BRAND.bg};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(params.preheader)}</div>`
    : ''
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta name="color-scheme" content="light"/>
  <meta name="supported-color-schemes" content="light"/>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:${EMAIL_BRAND.bg};font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;-webkit-text-size-adjust:100%;">
  ${preheader}
  <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" bgcolor="${EMAIL_BRAND.bg}" style="background-color:${EMAIL_BRAND.bg};padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" border="0" role="presentation" style="width:100%;max-width:560px;">
          <tr>
            <td align="left" bgcolor="${EMAIL_BRAND.primary}" style="background-color:${EMAIL_BRAND.primary};padding:32px 36px;">
              ${emailStitchLogo()}
              <p style="margin:20px 0 0;font-size:26px;font-weight:700;color:#ffffff;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.3;letter-spacing:-0.02em;">${headerTitle}</p>
            </td>
          </tr>
          <tr>
            <td bgcolor="${EMAIL_BRAND.white}" style="background-color:${EMAIL_BRAND.white};padding:36px;border:1px solid ${EMAIL_BRAND.border};border-top:none;">
              ${params.content}
            </td>
          </tr>
          <tr>
            <td style="padding:24px 16px 0;text-align:center;">
              <p style="margin:0;font-size:12px;color:${EMAIL_BRAND.textMuted};line-height:1.6;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
                ${appName} · Talent Acquisition Platform<br/>
                <a href="mailto:talentacquisition@stitch-ats.in" style="color:${EMAIL_BRAND.primary};text-decoration:none;font-weight:600;">talentacquisition@stitch-ats.in</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

const CANDIDATE_STATUS_MESSAGES: Record<string, string> = {
  SHORTLISTED: 'You have been shortlisted for further review.',
  INTERVIEW: 'You have been moved to the interview stage.',
  OFFER: 'Congratulations — your application has progressed to the offer stage.',
  HIRED: 'Congratulations — you have been hired. Welcome aboard!',
  JOINED: 'Welcome — your joining has been recorded.',
  REJECTED: 'Thank you for your interest. After careful review, we will not be moving forward at this time.',
}

export function isEmailConfigured(): boolean {
  return isM365EmailConfigured() || Boolean(env.resendApiKey)
}

/** Prefix QA staging subjects so test mail is easy to spot in inboxes. */
function formatEmailSubject(subject: string): string {
  if (process.env.ATS_ENV !== 'staging') return subject
  return subject.startsWith('[QA] ') ? subject : `[QA] ${subject}`
}

async function sendHtmlEmail(params: {
  to: string
  subject: string
  html: string
  attachments?: Array<{
    filename: string
    contentType: string
    content: Buffer
  }>
}): Promise<SendEmailResult> {
  const subject = formatEmailSubject(params.subject)
  const inlineAttachments = emailUsesStitchMark(params.html)
    ? [getStitchMarkInlineAttachment()].filter((item): item is NonNullable<typeof item> => item !== null)
    : []

  if (isM365EmailConfigured()) {
    return sendM365HtmlEmail({ ...params, subject, inlineAttachments })
  }

  if (!env.resendApiKey) return { sent: false, reason: 'not_configured' }

  const resend = new Resend(env.resendApiKey)
  try {
    const { data, error } = await resend.emails.send({
      from: env.emailFrom,
      to: params.to,
      subject,
      html: params.html,
      attachments: [
        ...inlineAttachments.map((item) => ({
          filename: item.filename,
          content: item.content,
          contentId: item.cid,
        })),
        ...(params.attachments?.map((item) => ({
          filename: item.filename,
          content: item.content,
        })) ?? []),
      ],
    })
    if (error) return { sent: false, reason: 'error', message: error.message }
    return { sent: true, id: data?.id ?? 'unknown' }
  } catch (e) {
    return { sent: false, reason: 'error', message: e instanceof Error ? e.message : 'Failed to send email' }
  }
}

export async function sendInviteEmail(params: {
  to: string
  name: string
  role: string
  tempPassword: string
}): Promise<SendEmailResult> {
  const loginUrl = `${env.clientOrigin.replace(/\/$/, '')}/login?email=${encodeURIComponent(params.to)}`
  return sendHtmlEmail({
    to: params.to,
    subject: `You're invited to ${env.appName}`,
    html: emailShell({
      preheader: `Your ${env.appName} account is ready — sign in with the credentials below.`,
      headerTitle: "You're invited!",
      content: `
        ${emailGreeting(params.name)}
        ${emailLead(`You've been invited to join <strong style="color:${EMAIL_BRAND.text};">${escapeHtml(env.appName)}</strong>. Use the credentials below to sign in and start collaborating with your team.`)}
        ${emailBadge(params.role)}
        ${detailBox([
          { label: 'Email address', value: params.to },
          { label: 'Temporary password', value: params.tempPassword, mono: true },
        ])}
        ${emailNote('For your security, change this password after your first login under <strong>Settings → Security</strong>.')}
        ${emailButton(loginUrl, `Sign in to ${env.appName}`)}
      `,
    }),
  })
}

export async function sendAdminPasswordEmail(params: {
  to: string
  name: string
  password: string
  setByAdmin?: boolean
}): Promise<SendEmailResult> {
  const loginUrl = `${env.clientOrigin.replace(/\/$/, '')}/login?email=${encodeURIComponent(params.to)}`
  const action = params.setByAdmin ? 'reset' : 'updated'
  return sendHtmlEmail({
    to: params.to,
    subject: `Your ${env.appName} password was reset`,
    html: emailShell({
      preheader: `An administrator ${action} your ${env.appName} password.`,
      headerTitle: 'Password updated',
      content: `
        ${emailGreeting(params.name)}
        ${emailLead(`An administrator ${action} your account password. Use the new credentials below to sign in.`)}
        ${detailBox([
          { label: 'Email address', value: params.to },
          { label: 'New password', value: params.password, mono: true },
        ])}
        ${emailNote('Change your password after signing in under <strong>Settings → Security</strong>.')}
        ${emailButton(loginUrl, `Sign in to ${env.appName}`)}
      `,
    }),
  })
}

export async function sendPasswordResetEmail(params: {
  to: string
  name: string
  resetUrl: string
}): Promise<SendEmailResult> {
  return sendHtmlEmail({
    to: params.to,
    subject: `Reset your ${env.appName} password`,
    html: emailShell({
      preheader: `Reset your ${env.appName} password — link expires in 1 hour.`,
      headerTitle: 'Reset your password',
      content: `
        ${emailGreeting(params.name)}
        ${emailLead('We received a request to reset your password. Click the button below to choose a new one. This link expires in <strong>1 hour</strong>.')}
        ${emailButton(params.resetUrl, 'Reset password')}
        ${emailNote('If you did not request this, you can safely ignore this email.')}
      `,
    }),
  })
}

export async function sendInterviewScheduledEmail(params: {
  to: string
  candidateName: string
  type: string
  scheduledAt: string
  meetingLink?: string
  location?: string
  calendarInvite?: Buffer
}): Promise<SendEmailResult> {
  return sendHtmlEmail({
    to: params.to,
    subject: `Interview scheduled — ${env.appName}`,
    html: interviewEmailBody({ ...params, headline: 'Interview scheduled' }),
    attachments: params.calendarInvite
      ? [{ filename: 'interview.ics', contentType: 'text/calendar; method=REQUEST', content: params.calendarInvite }]
      : undefined,
  })
}

export async function sendInterviewUpdatedEmail(params: {
  to: string
  candidateName: string
  type: string
  scheduledAt: string
  meetingLink?: string
  location?: string
  rescheduled?: boolean
  calendarInvite?: Buffer
}): Promise<SendEmailResult> {
  return sendHtmlEmail({
    to: params.to,
    subject: params.rescheduled
      ? `Interview rescheduled — ${env.appName}`
      : `Interview updated — ${env.appName}`,
    html: interviewEmailBody({
      candidateName: params.candidateName,
      type: params.type,
      scheduledAt: params.scheduledAt,
      meetingLink: params.meetingLink,
      location: params.location,
      headline: params.rescheduled ? 'Interview rescheduled' : 'Interview details updated',
    }),
    attachments: params.calendarInvite
      ? [{ filename: 'interview.ics', contentType: 'text/calendar; method=REQUEST', content: params.calendarInvite }]
      : undefined,
  })
}

function interviewEmailBody(params: {
  candidateName: string
  type: string
  scheduledAt: string
  meetingLink?: string
  location?: string
  headline: string
}): string {
  const details: Array<{ label: string; value: string }> = [
    { label: 'Interview type', value: params.type },
    { label: 'Date & time', value: params.scheduledAt },
  ]
  if (params.location) details.push({ label: 'Location', value: params.location })

  return emailShell({
    preheader: `Your ${params.type} interview is scheduled for ${params.scheduledAt}.`,
    headerTitle: params.headline,
    content: `
      ${emailGreeting(params.candidateName)}
      ${emailLead(`Your <strong style="color:${EMAIL_BRAND.text};">${escapeHtml(params.type)}</strong> interview has been scheduled.`)}
      ${detailBox(details)}
      ${params.meetingLink ? emailParagraph(`${emailLink(params.meetingLink, 'Join meeting')}`) : ''}
      ${emailNote('A calendar invite is attached — accept it to block this time on your Google or Microsoft calendar.')}
      ${emailParagraph(`Sign in to your candidate portal for updates.`)}
    `,
  })
}

export async function sendOfferSentEmail(params: {
  to: string
  candidateName: string
  annualCtc: number
  portalOfferUrl: string
  validUntil?: string
}): Promise<SendEmailResult> {
  const ctc = params.annualCtc.toLocaleString('en-IN')
  return sendHtmlEmail({
    to: params.to,
    subject: `Offer from ${env.appName}`,
    html: emailShell({
      preheader: 'Your offer letter is ready',
      headerTitle: 'Offer extended',
      content: `
        ${emailGreeting(params.candidateName)}
        ${emailLead(`We're pleased to extend an offer with an annual CTC of <strong style="color:${EMAIL_BRAND.text};">Rs. ${ctc}/-</strong>.`)}
        ${params.validUntil ? emailParagraph(`Please respond by <strong style="color:${EMAIL_BRAND.text};">${escapeHtml(new Date(params.validUntil).toLocaleDateString('en-IN'))}</strong>.`) : ''}
        ${emailButton(params.portalOfferUrl, 'View & respond to offer')}
      `,
    }),
  })
}

export async function sendOfferAcceptedEmail(params: {
  to: string
  recipientName: string
  candidateName: string
  jobTitle: string
  baseSalary: number
}): Promise<SendEmailResult> {
  return sendHtmlEmail({
    to: params.to,
    subject: `Offer accepted — ${params.candidateName}`,
    html: emailShell({
      headerTitle: 'Offer accepted',
      content: `
        ${emailGreeting(params.recipientName)}
        ${emailLead(`<strong style="color:${EMAIL_BRAND.text};">${escapeHtml(params.candidateName)}</strong> has accepted the offer for <strong style="color:${EMAIL_BRAND.text};">${escapeHtml(params.jobTitle)}</strong>.`)}
        ${detailBox([{ label: 'Base salary', value: params.baseSalary.toLocaleString() }])}
      `,
    }),
  })
}

export async function sendOfferDeclinedEmail(params: {
  to: string
  recipientName: string
  candidateName: string
  jobTitle: string
  baseSalary: number
}): Promise<SendEmailResult> {
  return sendHtmlEmail({
    to: params.to,
    subject: `Offer declined — ${params.candidateName}`,
    html: emailShell({
      headerTitle: 'Offer declined',
      content: `
        ${emailGreeting(params.recipientName)}
        ${emailLead(`<strong style="color:${EMAIL_BRAND.text};">${escapeHtml(params.candidateName)}</strong> has declined the offer for <strong style="color:${EMAIL_BRAND.text};">${escapeHtml(params.jobTitle)}</strong>.`)}
        ${detailBox([{ label: 'Base salary offered', value: params.baseSalary.toLocaleString() }])}
      `,
    }),
  })
}

export async function sendInterviewerAssignedEmail(params: {
  to: string
  recipientName: string
  candidateName: string
  type: string
  scheduledAt: string
  meetingLink?: string
  location?: string
  headline: string
  calendarInvite?: Buffer
}): Promise<SendEmailResult> {
  const details: Array<{ label: string; value: string }> = [
    { label: 'Candidate', value: params.candidateName },
    { label: 'Interview type', value: params.type },
    { label: 'Date & time', value: params.scheduledAt },
  ]
  if (params.location) details.push({ label: 'Location', value: params.location })

  return sendHtmlEmail({
    to: params.to,
    subject: `${params.headline} — ${env.appName}`,
    html: emailShell({
      headerTitle: params.headline,
      content: `
        ${emailGreeting(params.recipientName)}
        ${emailLead(`You are assigned to interview <strong style="color:${EMAIL_BRAND.text};">${escapeHtml(params.candidateName)}</strong>.`)}
        ${detailBox(details)}
        ${params.meetingLink ? emailParagraph(`${emailLink(params.meetingLink, 'Join meeting')}`) : ''}
        ${emailNote('A calendar invite is attached — accept it to block this time on your Google or Microsoft calendar.')}
        ${emailParagraph(`Sign in to ${escapeHtml(env.appName)} for full details.`)}
      `,
    }),
    attachments: params.calendarInvite
      ? [{ filename: 'interview.ics', contentType: 'text/calendar; method=REQUEST', content: params.calendarInvite }]
      : undefined,
  })
}

export async function sendInterviewCancelledEmail(params: {
  to: string
  recipientName: string
  type: string
  scheduledAt: string
  candidateName?: string
  calendarInvite?: Buffer
}): Promise<SendEmailResult> {
  return sendHtmlEmail({
    to: params.to,
    subject: `Interview cancelled — ${env.appName}`,
    html: emailShell({
      headerTitle: 'Interview cancelled',
      content: `
        ${emailGreeting(params.recipientName)}
        ${emailLead(`The <strong style="color:${EMAIL_BRAND.text};">${escapeHtml(params.type)}</strong> interview scheduled for <strong style="color:${EMAIL_BRAND.text};">${escapeHtml(params.scheduledAt)}</strong> has been cancelled.`)}
        ${params.candidateName ? detailBox([{ label: 'Candidate', value: params.candidateName }]) : ''}
        ${emailNote('The attached calendar update will remove the event from your calendar.')}
      `,
    }),
    attachments: params.calendarInvite
      ? [{ filename: 'interview-cancel.ics', contentType: 'text/calendar; method=CANCEL', content: params.calendarInvite }]
      : undefined,
  })
}

export async function sendInterviewReminderEmail(params: {
  to: string
  recipientName: string
  type: string
  scheduledAt: string
  meetingLink?: string
  location?: string
  hoursUntil: number
  candidateName?: string
  calendarInvite?: Buffer
}): Promise<SendEmailResult> {
  const label = params.hoursUntil >= 2 ? `${params.hoursUntil} hours` : '1 hour'
  const details: Array<{ label: string; value: string }> = [
    { label: 'Interview type', value: params.type },
    { label: 'Starts in', value: label },
    { label: 'Date & time', value: params.scheduledAt },
  ]
  if (params.candidateName) details.push({ label: 'Candidate', value: params.candidateName })
  if (params.location) details.push({ label: 'Location', value: params.location })

  return sendHtmlEmail({
    to: params.to,
    subject: `Interview reminder (${label}) — ${env.appName}`,
    html: emailShell({
      headerTitle: 'Interview reminder',
      content: `
        ${emailGreeting(params.recipientName)}
        ${emailLead(`Reminder: a <strong style="color:${EMAIL_BRAND.text};">${escapeHtml(params.type)}</strong> interview is coming up in about <strong style="color:${EMAIL_BRAND.text};">${label}</strong>.`)}
        ${detailBox(details)}
        ${params.meetingLink ? emailParagraph(`${emailLink(params.meetingLink, 'Join meeting')}`) : ''}
      `,
    }),
    attachments: params.calendarInvite
      ? [{ filename: 'interview.ics', contentType: 'text/calendar; method=REQUEST', content: params.calendarInvite }]
      : undefined,
  })
}

export async function sendCandidateStatusEmail(params: {
  to: string
  candidateName: string
  status: string
  jobTitle: string
}): Promise<SendEmailResult> {
  const message = CANDIDATE_STATUS_MESSAGES[params.status] ?? 'Your application status has been updated.'
  const portalUrl = `${env.clientOrigin.replace(/\/$/, '')}/portal/login`
  return sendHtmlEmail({
    to: params.to,
    subject: `Application update — ${env.appName}`,
    html: emailShell({
      headerTitle: 'Application update',
      content: `
        ${emailGreeting(params.candidateName)}
        ${emailLead(message)}
        ${detailBox([
          { label: 'Role', value: params.jobTitle },
          { label: 'Status', value: params.status.replace(/_/g, ' ') },
        ])}
        ${emailButton(portalUrl, 'View candidate portal')}
      `,
    }),
  })
}

export async function sendReferralSubmittedEmail(params: {
  to: string
  referrerName: string
  candidateName: string
  jobTitle: string
  jobCode?: string
}): Promise<SendEmailResult> {
  const portalUrl = `${env.clientOrigin.replace(/\/$/, '')}/referral-portal/login`
  return sendHtmlEmail({
    to: params.to,
    subject: `Referral submitted — ${env.appName}`,
    html: emailShell({
      headerTitle: 'Referral submitted',
      content: `
        ${emailGreeting(params.referrerName)}
        ${emailLead(`Your referral for <strong style="color:${EMAIL_BRAND.text};">${escapeHtml(params.candidateName)}</strong> has been submitted for <strong style="color:${EMAIL_BRAND.text};">${escapeHtml(params.jobTitle)}</strong>${params.jobCode ? ` (${escapeHtml(params.jobCode)})` : ''}.`)}
        ${emailParagraph("We'll notify you when their status changes.")}
        ${emailButton(portalUrl, 'View referral portal')}
      `,
    }),
  })
}

export async function sendReferralStatusEmail(params: {
  to: string
  referrerName: string
  candidateName: string
  jobTitle: string
  status: string
}): Promise<SendEmailResult> {
  const hired = params.status === 'HIRED' || params.status === 'JOINED'
  const headline = hired ? 'Referral hired' : 'Referral update'
  const message = hired
    ? `Great news — ${escapeHtml(params.candidateName)} has been hired for ${escapeHtml(params.jobTitle)}.`
    : `${escapeHtml(params.candidateName)}&apos;s application for ${escapeHtml(params.jobTitle)} was not selected.`
  return sendHtmlEmail({
    to: params.to,
    subject: `${headline} — ${env.appName}`,
    html: emailShell({
      headerTitle: headline,
      content: `
        ${emailGreeting(params.referrerName)}
        ${emailLead(message)}
      `,
    }),
  })
}

export async function sendNewCandidateNotificationEmail(params: {
  to: string
  recipientName: string
  candidateName: string
  candidateEmail: string
  jobTitle: string
  jobCode?: string
  source: string
  submittedBy?: string
  vendorName?: string
  referrerName?: string
}): Promise<SendEmailResult> {
  const origin = params.submittedBy ?? params.vendorName ?? params.referrerName
  const details: Array<{ label: string; value: string }> = [
    { label: 'Candidate', value: `${params.candidateName} (${params.candidateEmail})` },
    { label: 'Role', value: `${params.jobTitle}${params.jobCode ? ` · ${params.jobCode}` : ''}` },
    { label: 'Source', value: params.source },
  ]
  if (origin) details.push({ label: 'Submitted by', value: origin })

  return sendHtmlEmail({
    to: params.to,
    subject: `New candidate — ${params.candidateName}`,
    html: emailShell({
      headerTitle: 'New candidate submitted',
      content: `
        ${emailGreeting(params.recipientName)}
        ${emailLead(`A new candidate profile is ready for review.`)}
        ${detailBox(details)}
        ${emailParagraph(`Sign in to ${escapeHtml(env.appName)} to review the profile.`)}
      `,
    }),
  })
}

export async function sendVendorAssignmentEmail(params: {
  to: string
  recipientName: string
  vendorName: string
  requirements: Array<{ title: string; jobCode: string | null }>
}): Promise<SendEmailResult> {
  const portalUrl = `${env.clientOrigin.replace(/\/$/, '')}/login`
  const list = params.requirements
    .map(
      (r) =>
        `<li style="margin-bottom:8px;font-size:15px;color:${EMAIL_BRAND.text};font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">${escapeHtml(r.title)}${r.jobCode ? ` (${escapeHtml(r.jobCode)})` : ''}</li>`
    )
    .join('')
  return sendHtmlEmail({
    to: params.to,
    subject: `New job assignments — ${env.appName}`,
    html: emailShell({
      headerTitle: 'New assignments',
      content: `
        ${emailGreeting(params.recipientName)}
        ${emailLead(`<strong style="color:${EMAIL_BRAND.text};">${escapeHtml(params.vendorName)}</strong> has been assigned to the following open roles:`)}
        <ul style="margin:0 0 24px;padding-left:20px;color:${EMAIL_BRAND.textMuted};line-height:1.6;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">${list}</ul>
        ${emailButton(portalUrl, 'Open vendor portal')}
      `,
    }),
  })
}

export async function sendStaffNotificationEmail(params: {
  to: string
  recipientName: string
  subject: string
  headline: string
  body: string
}): Promise<SendEmailResult> {
  return sendHtmlEmail({
    to: params.to,
    subject: params.subject,
    html: emailShell({
      headerTitle: params.headline,
      content: `
        ${emailGreeting(params.recipientName)}
        ${emailLead(escapeHtml(params.body))}
      `,
    }),
  })
}
