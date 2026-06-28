import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { mapOffer } from '../utils/mappers.js'
import { requireAuth, requireActiveUser, requireRoles } from '../middleware/auth.js'
import { logActivity } from '../services/activityLog.js'
import {
  INTERNAL_ROLES,
  OFFER_EXEC_APPROVERS,
  OFFER_HR_APPROVERS,
  OFFER_ROLES,
} from '../lib/roles.js'
import {
  assertCanViewCandidate,
  buildOfferListWhere,
  CandidateAccessError,
} from '../lib/candidateAccess.js'
import { sendOfferSentEmail } from '../services/email.js'
import {
  notifyOfferApproved,
  notifyOfferPendingExecApproval,
  notifyOfferRejected,
  notifyOfferStatusChange,
  notifyOfferSubmittedForApproval,
} from '../lib/emailDispatch.js'
import {
  buildOfferApprovalRecord,
  parseOfferApprovalBody,
} from '../lib/offerApproval.js'
import {
  appendApprovalHistory,
  appendOfferHistory,
  buildOfferCreateData,
  loadOfferLetterContext,
} from '../lib/offerActions.js'
import {
  assertCanApproveOfferExec,
  assertCanApproveOfferHr,
  assertCanSendOffer,
  assertCanSubmitOffer,
  nextStatusAfterHrApproval,
} from '../lib/offerPermissions.js'
import { canEditOfferFields } from '../lib/offerTransitions.js'
import {
  calculateCompensationBreakdown,
  getAnnualCtcFromOffer,
} from '../lib/offerCompensation.js'
import { buildLetterMetaJson, parseLetterMetaJson } from '../lib/offerLetterRender.js'
import { env } from '../config/env.js'
import { renderHtmlToPdf } from '../lib/offerPdf.js'

const router = Router()
router.use(requireAuth, requireActiveUser, requireRoles(...INTERNAL_ROLES))

router.get('/pending', async (req, res) => {
  const step = req.query.step === 'exec' ? 'PENDING_EXEC_APPROVAL' : 'PENDING_HR_APPROVAL'
  const listWhere = await buildOfferListWhere(req.auth!)
  const rows = await prisma.offer.findMany({
    where: { ...listWhere, status: step },
    orderBy: { createdAt: 'desc' },
  })
  res.json(rows.map(mapOffer))
})

router.post('/preview-compensation', requireRoles(...OFFER_ROLES), (req, res) => {
  const annualCtc = Number(req.body.annualCtc)
  if (!annualCtc || annualCtc < 1000) {
    return res.status(400).json({ error: 'annualCtc must be at least 1000' })
  }
  res.json(calculateCompensationBreakdown(annualCtc))
})

router.get('/', async (req, res) => {
  const listWhere = await buildOfferListWhere(req.auth!)
  const rows = await prisma.offer.findMany({
    where: listWhere,
    orderBy: { createdAt: 'desc' },
  })
  res.json(rows.map(mapOffer))
})

router.get('/by-candidate/:candidateId', async (req, res) => {
  try {
    await assertCanViewCandidate(req.auth!, req.params.candidateId)
  } catch (err) {
    if (err instanceof CandidateAccessError) {
      return res.status(403).json({ error: err.message })
    }
    throw err
  }
  const rows = await prisma.offer.findMany({
    where: { candidateId: req.params.candidateId },
    orderBy: { createdAt: 'desc' },
  })
  res.json(rows.map(mapOffer))
})

router.get('/:id/letter', async (req, res) => {
  const ctx = await loadOfferLetterContext(req.params.id)
  if (!ctx) return res.status(404).json({ error: 'Not found' })
  try {
    await assertCanViewCandidate(req.auth!, ctx.offer.candidateId)
  } catch (err) {
    if (err instanceof CandidateAccessError) {
      return res.status(403).json({ error: err.message })
    }
    throw err
  }
  res.type('html').send(ctx.letterHtml)
})

router.get('/:id/letter/pdf', async (req, res) => {
  const ctx = await loadOfferLetterContext(req.params.id)
  if (!ctx) return res.status(404).json({ error: 'Not found' })
  try {
    await assertCanViewCandidate(req.auth!, ctx.offer.candidateId)
  } catch (err) {
    if (err instanceof CandidateAccessError) {
      return res.status(403).json({ error: err.message })
    }
    throw err
  }

  const pdf = await renderHtmlToPdf(ctx.letterHtml)
  const safeName = ctx.candidate.name.replace(/[^\w.-]+/g, '_').slice(0, 80)
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="offer-${safeName}.pdf"`)
  res.send(pdf)
})

router.get('/:id', async (req, res) => {
  const row = await prisma.offer.findUnique({ where: { id: req.params.id } })
  if (!row) return res.status(404).json({ error: 'Not found' })
  try {
    await assertCanViewCandidate(req.auth!, row.candidateId)
  } catch (err) {
    if (err instanceof CandidateAccessError) {
      return res.status(403).json({ error: err.message })
    }
    throw err
  }
  res.json(mapOffer(row))
})

router.post('/', requireRoles(...OFFER_ROLES), async (req, res) => {
  const body = req.body
  const candidate = await prisma.candidate.findUnique({ where: { id: body.candidateId } })
  if (!candidate) return res.status(400).json({ error: 'Candidate not found' })
  const requirement = await prisma.requirement.findUnique({
    where: { id: body.requirementId },
  })
  if (!requirement) return res.status(400).json({ error: 'Requirement not found' })

  const createdAt = new Date().toISOString()
  const data = buildOfferCreateData({
    candidateId: body.candidateId,
    requirementId: body.requirementId,
    annualCtc: body.annualCtc ?? body.baseSalary,
    letterMeta: body.letterMeta,
    createdBy: body.createdBy ?? req.auth!.userId,
  })

  const row = await prisma.offer.create({
    data: {
      ...data,
      history: JSON.stringify([
        {
          id: crypto.randomUUID(),
          date: createdAt,
          action: 'CREATED',
          description: 'Offer draft created',
          userId: req.auth!.userId,
        },
      ]),
    },
  })
  await logActivity({
    entityType: 'OFFER',
    entityId: row.id,
    action: 'CREATED',
    performedBy: req.auth!.userId,
    performerRole: req.auth!.role,
    details: { candidateId: body.candidateId },
  })
  res.status(201).json(mapOffer(row))
})

router.patch('/:id', requireRoles(...OFFER_ROLES), async (req, res) => {
  const existing = await prisma.offer.findUnique({ where: { id: req.params.id } })
  if (!existing) return res.status(404).json({ error: 'Not found' })

  if (req.body.status !== undefined) {
    return res.status(400).json({
      error: 'Use dedicated endpoints for status transitions (submit, approve, send, etc.)',
    })
  }

  if (!canEditOfferFields(existing.status)) {
    return res.status(400).json({ error: 'Offer can only be edited in draft or negotiation' })
  }

  const annualCtc =
    req.body.annualCtc !== undefined
      ? Number(req.body.annualCtc)
      : req.body.baseSalary !== undefined
        ? Number(req.body.baseSalary)
        : getAnnualCtcFromOffer(existing)

  const letterMeta = req.body.letterMeta as Record<string, unknown> | undefined
  const prevMeta = parseLetterMetaJson(existing.letterMetaJson)
  const mergedMeta = letterMeta ? { ...prevMeta, ...letterMeta } : prevMeta

  const row = await prisma.offer.update({
    where: { id: req.params.id },
    data: {
      ...(annualCtc > 0 && {
        annualCtc,
        baseSalary: annualCtc,
        compensationJson: JSON.stringify(calculateCompensationBreakdown(annualCtc)),
      }),
      ...(letterMeta && {
        letterMetaJson: JSON.stringify(mergedMeta),
      }),
      ...(req.body.letterContent !== undefined && { letterContent: req.body.letterContent }),
      updatedAt: new Date(),
    },
  })

  await logActivity({
    entityType: 'OFFER',
    entityId: row.id,
    action: 'UPDATED',
    performedBy: req.auth!.userId,
    performerRole: req.auth!.role,
  })
  res.json(mapOffer(row))
})

router.post('/:id/submit', requireRoles(...OFFER_ROLES), async (req, res) => {
  const existing = await prisma.offer.findUnique({ where: { id: req.params.id } })
  if (!existing) return res.status(404).json({ error: 'Not found' })

  try {
    assertCanSubmitOffer(req.auth!, existing)
  } catch (e) {
    return res.status(400).json({ error: e instanceof Error ? e.message : 'Cannot submit' })
  }

  const record = buildOfferApprovalRecord('REQUESTED', req.auth!, 'HR')
  const row = await prisma.offer.update({
    where: { id: req.params.id },
    data: {
      status: 'PENDING_HR_APPROVAL',
      approvalStep: 'HR',
      approval: JSON.stringify(record.approval),
      approvalHistory: appendApprovalHistory(existing.approvalHistory, record.historyEntry),
      rejectionReason: null,
      history: appendOfferHistory(
        existing.history,
        'SUBMITTED_FOR_APPROVAL',
        'Submitted for HR approval',
        req.auth!.userId
      ),
      updatedAt: new Date(),
    },
  })

  await logActivity({
    entityType: 'OFFER',
    entityId: row.id,
    action: 'SUBMITTED_FOR_APPROVAL',
    performedBy: req.auth!.userId,
    performerRole: req.auth!.role,
  })
  notifyOfferSubmittedForApproval(row)
  res.json(mapOffer(row))
})

router.post('/:id/approve-hr', requireRoles(...OFFER_HR_APPROVERS), async (req, res) => {
  const existing = await prisma.offer.findUnique({ where: { id: req.params.id } })
  if (!existing) return res.status(404).json({ error: 'Not found' })
  const opts = parseOfferApprovalBody(req.body)

  try {
    assertCanApproveOfferHr(req.auth!, existing, opts)
  } catch (e) {
    return res.status(403).json({ error: e instanceof Error ? e.message : 'Not allowed' })
  }

  const nextStatus = nextStatusAfterHrApproval(existing)
  const record = buildOfferApprovalRecord('APPROVED', req.auth!, 'HR', opts)
  const row = await prisma.offer.update({
    where: { id: req.params.id },
    data: {
      status: nextStatus,
      approvalStep: nextStatus === 'PENDING_EXEC_APPROVAL' ? 'EXEC' : null,
      approval: JSON.stringify(record.approval),
      approvalHistory: appendApprovalHistory(existing.approvalHistory, record.historyEntry),
      history: appendOfferHistory(
        existing.history,
        'APPROVED',
        nextStatus === 'PENDING_EXEC_APPROVAL'
          ? 'HR approved — pending executive approval'
          : 'HR approved',
        req.auth!.userId
      ),
      updatedAt: new Date(),
    },
  })

  await logActivity({
    entityType: 'OFFER',
    entityId: row.id,
    action: 'APPROVED',
    performedBy: req.auth!.userId,
    performerRole: req.auth!.role,
    details: { step: 'HR', nextStatus },
  })

  if (nextStatus === 'PENDING_EXEC_APPROVAL') {
    notifyOfferPendingExecApproval(row)
  } else {
    notifyOfferApproved(row)
  }
  res.json(mapOffer(row))
})

router.post('/:id/approve-exec', requireRoles(...OFFER_EXEC_APPROVERS), async (req, res) => {
  const existing = await prisma.offer.findUnique({ where: { id: req.params.id } })
  if (!existing) return res.status(404).json({ error: 'Not found' })
  const opts = parseOfferApprovalBody(req.body)

  try {
    assertCanApproveOfferExec(req.auth!, existing, opts)
  } catch (e) {
    return res.status(403).json({ error: e instanceof Error ? e.message : 'Not allowed' })
  }

  const record = buildOfferApprovalRecord('APPROVED', req.auth!, 'EXEC', opts)
  const row = await prisma.offer.update({
    where: { id: req.params.id },
    data: {
      status: 'APPROVED',
      approvalStep: null,
      approval: JSON.stringify(record.approval),
      approvalHistory: appendApprovalHistory(existing.approvalHistory, record.historyEntry),
      history: appendOfferHistory(
        existing.history,
        'APPROVED',
        'Executive approval granted',
        req.auth!.userId
      ),
      updatedAt: new Date(),
    },
  })

  await logActivity({
    entityType: 'OFFER',
    entityId: row.id,
    action: 'APPROVED',
    performedBy: req.auth!.userId,
    performerRole: req.auth!.role,
    details: { step: 'EXEC' },
  })
  notifyOfferApproved(row)
  res.json(mapOffer(row))
})

router.post('/:id/reject', requireRoles(...OFFER_HR_APPROVERS, ...OFFER_EXEC_APPROVERS), async (req, res) => {
  const existing = await prisma.offer.findUnique({ where: { id: req.params.id } })
  if (!existing) return res.status(404).json({ error: 'Not found' })
  const opts = parseOfferApprovalBody(req.body)
  const step = existing.status === 'PENDING_EXEC_APPROVAL' ? 'EXEC' : 'HR'

  try {
    if (step === 'EXEC') {
      assertCanApproveOfferExec(req.auth!, existing, opts)
    } else {
      assertCanApproveOfferHr(req.auth!, existing, opts)
    }
  } catch (e) {
    return res.status(403).json({ error: e instanceof Error ? e.message : 'Not allowed' })
  }

  const record = buildOfferApprovalRecord('REJECTED', req.auth!, step, opts)
  const row = await prisma.offer.update({
    where: { id: req.params.id },
    data: {
      status: 'DRAFT',
      approvalStep: null,
      approval: JSON.stringify(record.approval),
      approvalHistory: appendApprovalHistory(existing.approvalHistory, record.historyEntry),
      rejectionReason: opts.reason ?? 'Rejected',
      history: appendOfferHistory(
        existing.history,
        'REJECTED',
        opts.reason ?? 'Offer rejected',
        req.auth!.userId
      ),
      updatedAt: new Date(),
    },
  })

  await logActivity({
    entityType: 'OFFER',
    entityId: row.id,
    action: 'REJECTED',
    performedBy: req.auth!.userId,
    performerRole: req.auth!.role,
    details: { step, reason: opts.reason },
  })
  notifyOfferRejected(row)
  res.json(mapOffer(row))
})

router.post('/:id/send', requireRoles(...OFFER_ROLES), async (req, res) => {
  const existing = await prisma.offer.findUnique({ where: { id: req.params.id } })
  if (!existing) return res.status(404).json({ error: 'Not found' })

  try {
    assertCanSendOffer(existing)
  } catch (e) {
    return res.status(400).json({ error: e instanceof Error ? e.message : 'Cannot send' })
  }

  const ctx = await loadOfferLetterContext(existing.id)
  if (!ctx) return res.status(404).json({ error: 'Not found' })

  const validUntil = new Date()
  validUntil.setDate(validUntil.getDate() + 7)

  const row = await prisma.offer.update({
    where: { id: existing.id },
    data: {
      status: 'SENT',
      sentAt: new Date(),
      validUntil,
      letterHtml: ctx.letterHtml,
      history: appendOfferHistory(
        existing.history,
        'SENT',
        'Offer sent to candidate',
        req.auth!.userId
      ),
      updatedAt: new Date(),
    },
  })

  const candidate = ctx.candidate
  if (candidate.email) {
    await sendOfferSentEmail({
      to: candidate.email,
      candidateName: candidate.name,
      annualCtc: ctx.annualCtc,
      portalOfferUrl: `${env.clientOrigin}/portal/offers/${row.id}`,
      validUntil: validUntil.toISOString(),
    })
  }

  await logActivity({
    entityType: 'OFFER',
    entityId: row.id,
    action: 'SENT',
    performedBy: req.auth!.userId,
    performerRole: req.auth!.role,
  })
  res.json(mapOffer(row))
})

router.post('/:id/withdraw', requireRoles(...OFFER_ROLES), async (req, res) => {
  const existing = await prisma.offer.findUnique({ where: { id: req.params.id } })
  if (!existing) return res.status(404).json({ error: 'Not found' })
  if (!['APPROVED', 'SENT'].includes(existing.status)) {
    return res.status(400).json({ error: 'Only approved or sent offers can be withdrawn' })
  }

  const row = await prisma.offer.update({
    where: { id: existing.id },
    data: {
      status: 'WITHDRAWN',
      history: appendOfferHistory(
        existing.history,
        'WITHDRAWN',
        'Offer withdrawn',
        req.auth!.userId
      ),
      updatedAt: new Date(),
    },
  })

  await logActivity({
    entityType: 'OFFER',
    entityId: row.id,
    action: 'WITHDRAWN',
    performedBy: req.auth!.userId,
    performerRole: req.auth!.role,
  })
  res.json(mapOffer(row))
})

router.post('/:id/negotiate', requireRoles(...OFFER_ROLES), async (req, res) => {
  const existing = await prisma.offer.findUnique({ where: { id: req.params.id } })
  if (!existing) return res.status(404).json({ error: 'Not found' })
  if (existing.status !== 'SENT') {
    return res.status(400).json({ error: 'Only sent offers can enter negotiation' })
  }

  const row = await prisma.offer.update({
    where: { id: existing.id },
    data: {
      status: 'NEGOTIATION',
      history: appendOfferHistory(
        existing.history,
        'NEGOTIATION_STARTED',
        'Offer moved to negotiation',
        req.auth!.userId
      ),
      updatedAt: new Date(),
    },
  })

  await logActivity({
    entityType: 'OFFER',
    entityId: row.id,
    action: 'NEGOTIATION_STARTED',
    performedBy: req.auth!.userId,
    performerRole: req.auth!.role,
  })
  res.json(mapOffer(row))
})

router.post('/:id/revise', requireRoles(...OFFER_ROLES), async (req, res) => {
  const existing = await prisma.offer.findUnique({ where: { id: req.params.id } })
  if (!existing) return res.status(404).json({ error: 'Not found' })
  if (existing.status !== 'NEGOTIATION') {
    return res.status(400).json({ error: 'Only offers in negotiation can be revised' })
  }

  const row = await prisma.offer.update({
    where: { id: existing.id },
    data: {
      status: 'DRAFT',
      approval: '{}',
      approvalStep: null,
      rejectionReason: null,
      history: appendOfferHistory(
        existing.history,
        'REVISED',
        'Offer revised — returned to draft',
        req.auth!.userId
      ),
      updatedAt: new Date(),
    },
  })

  await logActivity({
    entityType: 'OFFER',
    entityId: row.id,
    action: 'REVISED',
    performedBy: req.auth!.userId,
    performerRole: req.auth!.role,
  })
  res.json(mapOffer(row))
})

router.post('/:id/accept', requireRoles(...OFFER_ROLES), async (req, res) => {
  const existing = await prisma.offer.findUnique({ where: { id: req.params.id } })
  if (!existing) return res.status(404).json({ error: 'Not found' })
  if (existing.status !== 'SENT') {
    return res.status(400).json({ error: 'Only sent offers can be accepted' })
  }

  const row = await prisma.offer.update({
    where: { id: existing.id },
    data: {
      status: 'ACCEPTED',
      respondedAt: new Date(),
      respondedBy: req.auth!.userId,
      history: appendOfferHistory(
        existing.history,
        'ACCEPTED',
        'Offer accepted by staff',
        req.auth!.userId
      ),
      updatedAt: new Date(),
    },
  })

  notifyOfferStatusChange(row, 'ACCEPTED')
  await logActivity({
    entityType: 'OFFER',
    entityId: row.id,
    action: 'ACCEPTED',
    performedBy: req.auth!.userId,
    performerRole: req.auth!.role,
  })
  res.json(mapOffer(row))
})

router.post('/:id/decline', requireRoles(...OFFER_ROLES), async (req, res) => {
  const existing = await prisma.offer.findUnique({ where: { id: req.params.id } })
  if (!existing) return res.status(404).json({ error: 'Not found' })
  if (existing.status !== 'SENT') {
    return res.status(400).json({ error: 'Only sent offers can be declined' })
  }

  const row = await prisma.offer.update({
    where: { id: existing.id },
    data: {
      status: 'DECLINED',
      respondedAt: new Date(),
      respondedBy: req.auth!.userId,
      history: appendOfferHistory(
        existing.history,
        'DECLINED',
        'Offer declined by staff',
        req.auth!.userId
      ),
      updatedAt: new Date(),
    },
  })

  notifyOfferStatusChange(row, 'DECLINED')
  await logActivity({
    entityType: 'OFFER',
    entityId: row.id,
    action: 'DECLINED',
    performedBy: req.auth!.userId,
    performerRole: req.auth!.role,
  })
  res.json(mapOffer(row))
})

router.delete('/:id', requireRoles('ADMIN'), async (req, res) => {
  const existing = await prisma.offer.findUnique({ where: { id: req.params.id } })
  if (!existing) return res.status(404).json({ error: 'Not found' })

  await prisma.offer.delete({ where: { id: req.params.id } })

  await logActivity({
    entityType: 'OFFER',
    entityId: existing.id,
    action: 'DELETED',
    performedBy: req.auth!.userId,
    performerRole: req.auth!.role,
    details: {
      candidateId: existing.candidateId,
      requirementId: existing.requirementId,
      status: existing.status,
    },
  })

  res.status(204).send()
})

export default router
