import type { CompensationBreakdown } from './offerCompensation.js'
import {
  DEFAULT_OFFER_LETTER_TEMPLATE,
  mergeOfferLetterTemplate,
  type OfferLetterTemplate,
} from './offerLetterTemplate.js'
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
  template?: OfferLetterTemplate
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
  const letterTemplate = mergeOfferLetterTemplate(ctx.template ?? DEFAULT_OFFER_LETTER_TEMPLATE)
  const org = letterTemplate.orgSettings
  const letterDate = ctx.letterDate ?? new Date()
  const joiningFormatted = formatLongDate(ctx.joiningDate)
  const ctcFormatted = formatIndianCurrency(ctx.annualCtc)
  const ctcWords = amountToIndianWords(ctx.annualCtc)
  const compTable = compensationTableHtml(ctx.breakdown)

  const timesheetAddress = org.timesheetAddress?.trim() ?? ''
  const returnAddress = org.returnAddress?.trim() ?? ''

  const vars: Record<string, string> = {
    candidateName: escapeHtml(ctx.candidateName),
    candidateAddress: escapeHtml(ctx.candidateAddress),
    positionTitle: escapeHtml(ctx.positionTitle),
    clientSiteAddress: escapeHtml(ctx.clientSiteAddress),
    clientCompanyName: escapeHtml(ctx.clientCompanyName),
    joiningDateFormatted: escapeHtml(joiningFormatted),
    reportingTime: escapeHtml(ctx.reportingTime ?? org.reportingTime),
    ctcFormatted: escapeHtml(ctcFormatted),
    ctcWords: escapeHtml(ctcWords),
    compensationTable: compTable,
    acceptanceDeadlineDays: String(ctx.acceptanceDeadlineDays ?? org.acceptanceDeadlineDays),
    returnAddressSuffix: returnAddress ? ' to the following address' : '',
    returnAddressBlock: returnAddress ? `<p>${escapeHtml(returnAddress)}</p>` : '',
    letterDateFormatted: escapeHtml(formatShortDate(letterDate)),
    timesheetAddressSuffix: timesheetAddress ? ' to the following address' : '',
    timesheetAddressBlock: timesheetAddress ? `<p>${escapeHtml(timesheetAddress)}</p>` : '',
    reviewPeriodMonths: String(org.reviewPeriodMonths),
    annualLeaveDays: String(org.annualLeaveDays),
    noticePeriodDays: String(org.noticePeriodDays),
  }

  const pages: string[] = []

  pages.push(
    offerPage(`
    ${letterhead(org)}
    ${applyClausePlaceholders(letterTemplate.coverPageHtml, vars)}
  `)
  )

  letterTemplate.clausePages.forEach((clausePage, index) => {
    const body = applyClausePlaceholders(clausePage, vars)
    if (index === 0) {
      const intro = applyClausePlaceholders(letterTemplate.agreementIntroHtml, vars)
      pages.push(offerPage(`${letterhead(org)}${intro}${body}`))
    } else {
      pages.push(offerPage(`${letterhead(org)}${body}`))
    }
  })

  pages.push(
    offerPage(`
    ${letterhead(org)}
    ${applyClausePlaceholders(letterTemplate.declarationPageHtml, vars)}
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
