import { prisma } from './prisma.js'
import {
  calculateCompensationBreakdown,
  getAnnualCtcFromOffer,
  type CompensationBreakdown,
} from './offerCompensation.js'
import {
  buildLetterMetaJson,
  parseLetterMetaJson,
  renderOfferLetterHtml,
} from './offerLetterRender.js'

export type OfferLetterMetaInput = {
  candidateAddress?: string
  positionTitle?: string
  joiningDate?: string
  clientCompanyName?: string
  clientSiteAddress?: string
  reportingTime?: string
  acceptanceDeadlineDays?: number
}

export async function loadOfferLetterContext(offerId: string) {
  const offer = await prisma.offer.findUnique({ where: { id: offerId } })
  if (!offer) return null

  const [candidate, requirement] = await Promise.all([
    prisma.candidate.findUnique({ where: { id: offer.candidateId } }),
    prisma.requirement.findUnique({ where: { id: offer.requirementId } }),
  ])
  if (!candidate) return null

  const meta = parseLetterMetaJson(offer.letterMetaJson)
  const annualCtc = getAnnualCtcFromOffer(offer)
  const breakdown =
    offer.compensationJson && offer.compensationJson !== '{}'
      ? (JSON.parse(offer.compensationJson) as CompensationBreakdown)
      : calculateCompensationBreakdown(annualCtc)

  const joiningDateRaw =
    (typeof meta.joiningDate === 'string' && meta.joiningDate) ||
    candidate.expectedJoiningDate?.toISOString().slice(0, 10) ||
    new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10)

  const joiningDate = new Date(joiningDateRaw)
  const positionTitle =
    (typeof meta.positionTitle === 'string' && meta.positionTitle) ||
    candidate.role ||
    requirement?.title ||
    'Team Member'

  const clientSiteAddress =
    (typeof meta.clientSiteAddress === 'string' && meta.clientSiteAddress) ||
    requirement?.location ||
    'As communicated by HR'

  const clientCompanyName =
    (typeof meta.clientCompanyName === 'string' && meta.clientCompanyName) ||
    requirement?.client ||
    'Client Organization'

  const candidateAddress =
    (typeof meta.candidateAddress === 'string' && meta.candidateAddress) ||
    candidate.location ||
    'Address on file'

  return {
    offer,
    candidate,
    requirement,
    annualCtc,
    breakdown,
    letterHtml: renderOfferLetterHtml({
      candidateName: candidate.name,
      candidateAddress,
      positionTitle,
      joiningDate,
      clientCompanyName,
      clientSiteAddress,
      reportingTime:
        typeof meta.reportingTime === 'string' ? meta.reportingTime : undefined,
      annualCtc,
      breakdown,
    }),
  }
}

export function buildOfferCreateData(body: {
  candidateId: string
  requirementId: string
  annualCtc?: number
  baseSalary?: number
  letterMeta?: OfferLetterMetaInput
  createdBy: string
}) {
  const annualCtc = body.annualCtc ?? body.baseSalary ?? 0
  const breakdown = calculateCompensationBreakdown(annualCtc)
  const letterMetaJson = buildLetterMetaJson({
    candidateAddress: body.letterMeta?.candidateAddress ?? '',
    positionTitle: body.letterMeta?.positionTitle ?? '',
    joiningDate: body.letterMeta?.joiningDate ?? '',
    clientCompanyName: body.letterMeta?.clientCompanyName ?? '',
    clientSiteAddress: body.letterMeta?.clientSiteAddress ?? '',
    reportingTime: body.letterMeta?.reportingTime,
    acceptanceDeadlineDays: body.letterMeta?.acceptanceDeadlineDays,
  })

  return {
    candidateId: body.candidateId,
    requirementId: body.requirementId,
    baseSalary: annualCtc,
    annualCtc,
    status: 'DRAFT',
    compensationJson: JSON.stringify(breakdown),
    letterMetaJson,
    createdBy: body.createdBy,
  }
}

export function appendOfferHistory(
  existing: string,
  action: string,
  description: string,
  userId: string
): string {
  const history = JSON.parse(existing || '[]')
  return JSON.stringify([
    ...history,
    {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      action,
      description,
      userId,
    },
  ])
}

export function appendApprovalHistory(existing: string, entry: unknown): string {
  const history = JSON.parse(existing || '[]')
  return JSON.stringify([...history, entry])
}
