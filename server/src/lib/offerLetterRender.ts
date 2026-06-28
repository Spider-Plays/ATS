import type { CompensationBreakdown } from './offerCompensation.js'
import { DEFAULT_ORG_SETTINGS, EMPLOYMENT_CLAUSE_PAGES } from './offerLetterLegal.js'
import { getOfferLetterLogoHtml } from './offerBrandAssets.js'
import { amountToIndianWords, formatIndianCurrency } from './numberToWords.js'

export type OfferLetterContext = {
  candidateName: string
  candidateAddress: string
  positionTitle: string
  joiningDate: Date
  clientCompanyName: string
  clientSiteAddress: string
  reportingTime?: string
  letterDate?: Date
  acceptanceDeadlineDays?: number
  annualCtc: number
  breakdown: CompensationBreakdown
  org?: Partial<typeof DEFAULT_ORG_SETTINGS>
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br/>')
}

function formatLongDate(d: Date): string {
  return d.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatShortDate(d: Date): string {
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
}

function fmtNum(n: number): string {
  return Math.round(n).toLocaleString('en-IN')
}

function compensationTableHtml(b: CompensationBreakdown): string {
  const row = (label: string, annual: number, monthly: number, bold = false) =>
    `<tr${bold ? ' style="font-weight:bold;background:#f8fafc;"' : ''}>
      <td style="padding:6px 10px;border:1px solid #e2e8f0;">${escapeHtml(label)}</td>
      <td style="padding:6px 10px;border:1px solid #e2e8f0;text-align:right;">${fmtNum(annual)}</td>
      <td style="padding:6px 10px;border:1px solid #e2e8f0;text-align:right;">${fmtNum(monthly)}</td>
    </tr>`

  const rows: string[] = [
    `<tr style="background:#1a5fb4;color:#fff;font-weight:bold;">
      <th style="padding:8px 10px;border:1px solid #e2e8f0;text-align:left;">Head</th>
      <th style="padding:8px 10px;border:1px solid #e2e8f0;text-align:right;">Annual</th>
      <th style="padding:8px 10px;border:1px solid #e2e8f0;text-align:right;">Monthly</th>
    </tr>`,
  ]

  for (const e of b.earnings) rows.push(row(e.label, e.annual, e.monthly))
  rows.push(row(b.gross.label, b.gross.annual, b.gross.monthly, true))
  for (const e of b.employerContributions) rows.push(row(e.label, e.annual, e.monthly))
  rows.push(row(b.totalCtc.label, b.totalCtc.annual, b.totalCtc.monthly, true))
  for (const e of b.employeeDeductions) rows.push(row(e.label, e.annual, e.monthly))
  rows.push(row(b.totalDeduction.label, b.totalDeduction.annual, b.totalDeduction.monthly, true))
  rows.push(row(b.netPay.label, b.netPay.annual, b.netPay.monthly, true))

  return `<table style="width:100%;border-collapse:collapse;font-size:12px;margin:16px 0;">${rows.join('')}</table>`
}

function letterhead(org: { legalEntityName?: string }): string {
  const subtitle = org.legalEntityName?.trim()
  return getOfferLetterLogoHtml(subtitle || undefined)
}

function offerPage(inner: string): string {
  return `<section class="offer-page">${inner}</section>`
}

const OFFER_LETTER_STYLES = `
  @page {
    size: A4;
    margin: 18mm 16mm 20mm 16mm;
  }
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    font-size: 13px;
    line-height: 1.55;
    color: #1e293b;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .offer-page {
    page-break-after: always;
    break-after: page;
    padding: 0;
  }
  .offer-page:last-child {
    page-break-after: auto;
    break-after: auto;
  }
  @media screen {
    body {
      background: #e2e8f0;
      padding: 20px 12px 32px;
    }
    .offer-page {
      page-break-after: auto;
      break-after: auto;
      width: 210mm;
      max-width: 100%;
      min-height: 297mm;
      margin: 0 auto 20px;
      padding: 18mm 16mm;
      background: #fff;
      box-shadow: 0 4px 24px rgba(15, 23, 42, 0.1);
    }
  }
  h2 { font-size: 16px; margin: 16px 0 12px; color: #1a5fb4; }
  h3 {
    font-size: 13px;
    margin: 18px 0 8px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    page-break-after: avoid;
    break-after: avoid;
  }
  p { margin: 0 0 12px; orphans: 3; widows: 3; }
  table { page-break-inside: avoid; break-inside: avoid; }
  .sig-row {
    margin-top: 48px;
    display: flex;
    justify-content: space-between;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .sig-block {
    width: 45%;
    border-top: 1px solid #94a3b8;
    padding-top: 8px;
    font-size: 12px;
  }
`

function applyClausePlaceholders(
  template: string,
  vars: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? '')
}

export function renderOfferLetterHtml(ctx: OfferLetterContext): string {
  const org = { ...DEFAULT_ORG_SETTINGS, ...ctx.org }
  const letterDate = ctx.letterDate ?? new Date()
  const joiningFormatted = formatLongDate(ctx.joiningDate)
  const ctcFormatted = formatIndianCurrency(ctx.annualCtc)
  const ctcWords = amountToIndianWords(ctx.annualCtc)
  const compTable = compensationTableHtml(ctx.breakdown)

  const timesheetAddress = org.timesheetAddress?.trim() ?? ''
  const clauseVars: Record<string, string> = {
    timesheetAddressSuffix: timesheetAddress ? ' to the following address' : '',
    timesheetAddressBlock: timesheetAddress ? `<p>${escapeHtml(timesheetAddress)}</p>` : '',
    joiningDateFormatted: escapeHtml(joiningFormatted),
    positionTitle: escapeHtml(ctx.positionTitle),
    reviewPeriodMonths: String(org.reviewPeriodMonths),
    annualLeaveDays: String(org.annualLeaveDays),
    noticePeriodDays: String(org.noticePeriodDays),
  }

  const returnAddressBlock = org.returnAddress?.trim()
    ? `<p>${escapeHtml(org.returnAddress)}</p>`
    : ''

  const pages: string[] = []

  pages.push(
    offerPage(`
    ${letterhead(org)}
    <p><strong>Name:</strong> ${escapeHtml(ctx.candidateName)}</p>
    <p><strong>Address:</strong><br/>${escapeHtml(ctx.candidateAddress)}</p>
    <p>Dear ${escapeHtml(ctx.candidateName)},</p>
    <p>We are pleased to inform you that based on your application and the subsequent interviews you had, you have been selected for the position of <strong>${escapeHtml(ctx.positionTitle)}</strong>.</p>
    <p>Your joining date will be <strong>${escapeHtml(joiningFormatted)}</strong></p>
    <p>On the first day of the employment, please report to:</p>
    <p><strong>Company Address:</strong> ${escapeHtml(ctx.clientSiteAddress)}</p>
    <p><strong>Reporting Time:</strong> ${escapeHtml(ctx.reportingTime ?? org.reportingTime)}</p>
    <p>You will be paid a gross annual salary of <strong>${escapeHtml(ctcFormatted)}</strong> (${escapeHtml(ctcWords)}).</p>
    <p>Your salary composition and other details are listed in the Employment Agreement annexed to this letter. Please indicate your acceptance to the Employment Agreement by signing and returning it within <strong>${org.acceptanceDeadlineDays}</strong> days from the date of this letter${returnAddressBlock ? ' to the following address' : ''}. Please retain the second copy for your records.</p>
    ${returnAddressBlock}
    <p>I look forward to welcoming you in our organization.</p>
    <p>Should you need any further clarifications, please feel free to contact us.</p>
    <div class="sig-row">
      <div class="sig-block">HR Signature</div>
      <div class="sig-block">Candidate Signature</div>
    </div>
  `)
  )

  const agreementIntro = `
    ${letterhead(org)}
    <h2>EMPLOYMENT AGREEMENT</h2>
    <h3>COMPENSATION STRUCTURE</h3>
    <p>Your individual compensation is strictly between yourself and the Company. It has been determined based on various factors such as your job, skills, specific background and professional merit. This information and any changes therein should be treated as personal and confidential.</p>
    <p>Your total annual CTC will be <strong>${escapeHtml(ctcFormatted)}</strong> and its composition will be as follows:</p>
    ${compTable}
  `

  EMPLOYMENT_CLAUSE_PAGES.forEach((clausePage, index) => {
    const body = applyClausePlaceholders(clausePage, clauseVars)
    if (index === 0) {
      pages.push(offerPage(agreementIntro + body))
    } else {
      pages.push(offerPage(letterhead(org) + body))
    }
  })

  pages.push(
    offerPage(`
    ${letterhead(org)}
    <h2>DECLARATION</h2>
    <p>This is to confirm that the documents and information provided by me to the Company for the purpose of my services are true and accurate to the best of my knowledge and belief. I also agree that the various terms and conditions set forth in this Agreement are fair, just and reasonable and I shall strictly adhere to the terms specified.</p>
    <div class="sig-row" style="margin-top:80px;">
      <div class="sig-block">Signature</div>
      <div class="sig-block">Date<br/>${escapeHtml(formatShortDate(letterDate))}</div>
    </div>
  `)
  )

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>Offer Letter — ${escapeHtml(ctx.candidateName)}</title>
  <style>${OFFER_LETTER_STYLES}</style>
</head>
<body>
  ${pages.join('\n')}
</body>
</html>`
}

export function buildLetterMetaJson(ctx: Partial<{
  candidateAddress: string
  positionTitle: string
  joiningDate: string
  clientCompanyName: string
  clientSiteAddress: string
  reportingTime: string
  acceptanceDeadlineDays: number
}>): string {
  return JSON.stringify(ctx)
}

export function parseLetterMetaJson(raw: string | null | undefined): Record<string, unknown> {
  if (!raw) return {}
  try {
    return JSON.parse(raw) as Record<string, unknown>
  } catch {
    return {}
  }
}
