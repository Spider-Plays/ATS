import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { requireAuth, requireActiveUser, requireRoles } from '../middleware/auth.js'
import { mapBusinessRequirement, mapRequirement, mapActivityLog } from '../utils/mappers.js'
import { logActivity } from '../services/activityLog.js'
import { generateJobCode } from '../lib/jobCode.js'
import { parseSkillList, serializeSkills } from '../lib/skills.js'
import {
  parseRequirementClientInput,
  resolveClientFromCatalog,
} from '../lib/clientCatalog.js'
import { ensureInterviewPlan } from '../lib/interviewPlan.js'
import {
  RequirementFieldError,
  pickBusinessRequirementExtrasForCreate,
  pickBusinessRequirementExtrasPatch,
} from '../lib/businessRequirementFields.js'
import {
  BUSINESS_MUTATE_ROLES,
  BUSINESS_VIEW_ROLES,
  BusinessRequirementAccessError,
  assertCanMutateBusinessRequirement,
  assertCanViewBusinessRequirement,
  buildBusinessRequirementListWhere,
} from '../lib/businessRequirementAccess.js'
import {
  businessStagePercentage,
  isBusinessStageKey,
} from '../lib/businessStages.js'
import { notifyBusinessRequirementStageChanged } from '../lib/emailDispatch.js'
import {
  enrichBusinessRequirementActivityLogDetails,
  parseBusinessStageHistory,
} from '../lib/businessRequirementStageHistory.js'
import { diffBusinessRequirementChanges } from '../lib/businessRequirementChangeLog.js'

const router = Router()
router.use(requireAuth, requireActiveUser)

function parseStageHistory(raw: string | null | undefined) {
  return parseBusinessStageHistory(raw)
}

router.get('/', requireRoles(...BUSINESS_MUTATE_ROLES), async (req, res) => {
  const listWhere = await buildBusinessRequirementListWhere(req.auth!)
  const rows = await prisma.businessRequirement.findMany({
    where: listWhere,
    orderBy: { updatedAt: 'desc' },
  })
  res.json(rows.map(mapBusinessRequirement))
})

router.post('/', requireRoles(...BUSINESS_MUTATE_ROLES), async (req, res) => {
  const body = req.body as Record<string, unknown>
  let extras
  try {
    extras = pickBusinessRequirementExtrasForCreate(body)
  } catch (e) {
    if (e instanceof RequirementFieldError) {
      return res.status(400).json({ error: e.message })
    }
    throw e
  }

  let clientName: string
  try {
    clientName = await resolveClientFromCatalog(parseRequirementClientInput(body.client))
  } catch (e) {
    return res.status(400).json({
      error: e instanceof Error ? e.message : 'Invalid client',
    })
  }

  const accountManager =
    typeof body.accountManager === 'string' && body.accountManager.trim()
      ? body.accountManager.trim()
      : req.auth!.userId
  const hiringManager =
    typeof body.hiringManager === 'string' && body.hiringManager.trim()
      ? body.hiringManager.trim()
      : req.auth!.userId

  const timestamp = new Date().toISOString()
  const initialStage = 'INITIAL_DISCUSSION'
  const initialPercentage = businessStagePercentage(initialStage)

  const row = await prisma.businessRequirement.create({
    data: {
      title: String(body.title),
      client: clientName,
      department: String(body.department),
      accountManager,
      hiringManager,
      businessStage: initialStage,
      stagePercentage: initialPercentage,
      status: 'ACTIVE',
      openings: Number(body.openings),
      priority: typeof body.priority === 'string' ? body.priority : 'MEDIUM',
      ...extras,
      description:
        typeof body.description === 'string'
          ? body.description
          : typeof body.jobDescription === 'string'
            ? body.jobDescription.slice(0, 2000)
            : null,
      jobDescription:
        typeof body.jobDescription === 'string'
          ? body.jobDescription
          : typeof body.description === 'string'
            ? body.description
            : null,
      primarySkills: serializeSkills(parseSkillList(body.primarySkills)),
      secondarySkills: serializeSkills(parseSkillList(body.secondarySkills)),
      createdBy: req.auth!.userId,
      createdByRole: req.auth!.role,
      stageHistory: JSON.stringify([
        {
          stage: initialStage,
          percentage: initialPercentage,
          by: req.auth!.userId,
          at: timestamp,
          role: req.auth!.role,
        },
      ]),
    },
  })

  await logActivity({
    entityType: 'BUSINESS_REQUIREMENT',
    entityId: row.id,
    action: 'CREATED',
    performedBy: req.auth!.userId,
    performerRole: req.auth!.role,
    details: { title: row.title, client: row.client },
  })

  res.status(201).json(mapBusinessRequirement(row))
})

/** Full activity history for anyone who can open this business requirement detail (same access as GET /:id). */
router.get('/:id/activity-logs', requireRoles(...BUSINESS_VIEW_ROLES), async (req, res) => {
  try {
    await assertCanViewBusinessRequirement(req.auth!, req.params.id)
  } catch (err) {
    if (err instanceof BusinessRequirementAccessError) {
      const status = err.message === 'Not found' ? 404 : 403
      return res.status(status).json({ error: err.message })
    }
    throw err
  }

  const limit = Math.min(Number(req.query.limit) || 50, 100)
  const [rows, bizRow] = await Promise.all([
    prisma.activityLog.findMany({
      where: { entityId: req.params.id, entityType: 'BUSINESS_REQUIREMENT' },
      orderBy: { timestamp: 'desc' },
      take: limit,
    }),
    prisma.businessRequirement.findUnique({
      where: { id: req.params.id },
      select: { stageHistory: true },
    }),
  ])
  const history = parseStageHistory(bizRow?.stageHistory)
  res.json(
    rows.map((row) => {
      const mapped = mapActivityLog(row)
      const enrichedDetails = enrichBusinessRequirementActivityLogDetails(row, history)
      if (enrichedDetails) {
        mapped.details = enrichedDetails
      }
      return mapped
    })
  )
})

router.get('/:id', requireRoles(...BUSINESS_VIEW_ROLES), async (req, res) => {
  try {
    await assertCanViewBusinessRequirement(req.auth!, req.params.id)
  } catch (err) {
    if (err instanceof BusinessRequirementAccessError) {
      const status = err.message === 'Not found' ? 404 : 403
      return res.status(status).json({ error: err.message })
    }
    throw err
  }
  const row = await prisma.businessRequirement.findUnique({ where: { id: req.params.id } })
  if (!row) return res.status(404).json({ error: 'Not found' })
  res.json(mapBusinessRequirement(row))
})

router.patch('/:id', requireRoles(...BUSINESS_MUTATE_ROLES), async (req, res) => {
  try {
    await assertCanMutateBusinessRequirement(req.auth!, req.params.id)
  } catch (err) {
    if (err instanceof BusinessRequirementAccessError) {
      const status = err.message === 'Not found' ? 404 : 403
      return res.status(status).json({ error: err.message })
    }
    throw err
  }

  const existing = await prisma.businessRequirement.findUnique({ where: { id: req.params.id } })
  if (!existing) return res.status(404).json({ error: 'Not found' })
  if (existing.status !== 'ACTIVE') {
    return res.status(400).json({ error: 'Only active business requirements can be edited' })
  }

  const data = { ...req.body } as Record<string, unknown>
  delete data._user
  delete data.businessStage
  delete data.stagePercentage
  delete data.status
  delete data.publishedRequirementId
  delete data.stageHistory

  try {
    Object.assign(data, pickBusinessRequirementExtrasPatch(data))
  } catch (e) {
    if (e instanceof RequirementFieldError) {
      return res.status(400).json({ error: e.message })
    }
    throw e
  }

  if (data.client !== undefined) {
    try {
      data.client = await resolveClientFromCatalog(parseRequirementClientInput(data.client))
    } catch (e) {
      return res.status(400).json({
        error: e instanceof Error ? e.message : 'Invalid client',
      })
    }
  }

  if (data.primarySkills !== undefined) {
    data.primarySkills = serializeSkills(parseSkillList(data.primarySkills))
  }
  if (data.secondarySkills !== undefined) {
    data.secondarySkills = serializeSkills(parseSkillList(data.secondarySkills))
  }

  const changes = await diffBusinessRequirementChanges(existing, data)

  const row = await prisma.businessRequirement.update({
    where: { id: req.params.id },
    data: data as Parameters<typeof prisma.businessRequirement.update>[0]['data'],
  })

  if (changes.length > 0) {
    await logActivity({
      entityType: 'BUSINESS_REQUIREMENT',
      entityId: row.id,
      action: 'UPDATED',
      performedBy: req.auth!.userId,
      performerRole: req.auth!.role,
      details: { title: row.title, changes },
    })
  }

  res.json(mapBusinessRequirement(row))
})

router.patch('/:id/stage', requireRoles(...BUSINESS_MUTATE_ROLES), async (req, res) => {
  try {
    await assertCanMutateBusinessRequirement(req.auth!, req.params.id)
  } catch (err) {
    if (err instanceof BusinessRequirementAccessError) {
      const status = err.message === 'Not found' ? 404 : 403
      return res.status(status).json({ error: err.message })
    }
    throw err
  }

  const existing = await prisma.businessRequirement.findUnique({ where: { id: req.params.id } })
  if (!existing) return res.status(404).json({ error: 'Not found' })
  if (existing.status !== 'ACTIVE') {
    return res.status(400).json({ error: 'Stage cannot be changed after opening to hiring' })
  }

  const stage = typeof req.body?.businessStage === 'string' ? req.body.businessStage : ''
  if (!isBusinessStageKey(stage)) {
    return res.status(400).json({ error: 'Invalid business stage' })
  }

  const description =
    typeof req.body?.description === 'string' ? req.body.description.trim() : ''
  if (!description) {
    return res.status(400).json({ error: 'Description is required when changing stage' })
  }
  if (description.length > 2000) {
    return res.status(400).json({ error: 'Description must be at most 2000 characters' })
  }

  const percentage = businessStagePercentage(stage)
  const timestamp = new Date().toISOString()
  const history = parseStageHistory(existing.stageHistory)
  history.push({
    stage,
    percentage,
    by: req.auth!.userId,
    at: timestamp,
    role: req.auth!.role,
    description,
  })

  const row = await prisma.businessRequirement.update({
    where: { id: req.params.id },
    data: {
      businessStage: stage,
      stagePercentage: percentage,
      stageHistory: JSON.stringify(history),
    },
  })

  const wasSowSigned = stage === 'SOW_SIGNED' && existing.businessStage !== 'SOW_SIGNED'
  const stageChanged = stage !== existing.businessStage

  if (wasSowSigned) {
    await logActivity({
      entityType: 'BUSINESS_REQUIREMENT',
      entityId: row.id,
      action: 'SOW_SIGNED',
      performedBy: req.auth!.userId,
      performerRole: req.auth!.role,
      timestamp,
      details: {
        title: row.title,
        client: row.client,
        stage,
        percentage,
        description,
      },
    })
  } else if (stageChanged) {
    await logActivity({
      entityType: 'BUSINESS_REQUIREMENT',
      entityId: row.id,
      action: 'STAGE_CHANGED',
      performedBy: req.auth!.userId,
      performerRole: req.auth!.role,
      timestamp,
      details: { title: row.title, stage, percentage, description },
    })
  }

  if (stageChanged) {
    notifyBusinessRequirementStageChanged({
      id: row.id,
      title: row.title,
      client: row.client,
      accountManager: row.accountManager,
      hiringManager: row.hiringManager,
      stage,
      description,
    })
  }

  res.json(mapBusinessRequirement(row))
})

router.post('/:id/open-to-hiring', requireRoles(...BUSINESS_MUTATE_ROLES), async (req, res) => {
  try {
    await assertCanMutateBusinessRequirement(req.auth!, req.params.id)
  } catch (err) {
    if (err instanceof BusinessRequirementAccessError) {
      const status = err.message === 'Not found' ? 404 : 403
      return res.status(status).json({ error: err.message })
    }
    throw err
  }

  const existing = await prisma.businessRequirement.findUnique({ where: { id: req.params.id } })
  if (!existing) return res.status(404).json({ error: 'Not found' })
  if (existing.status === 'OPEN_TO_HIRING') {
    return res.status(400).json({ error: 'Already opened to hiring' })
  }
  if (existing.status !== 'ACTIVE') {
    return res.status(400).json({ error: 'Business requirement is not active' })
  }
  if (existing.businessStage !== 'CONFIRMED') {
    return res.status(400).json({
      error: 'Business requirement must be at Confirmed stage before opening to hiring',
    })
  }

  const timestamp = new Date()
  const requirement = await prisma.requirement.create({
    data: {
      jobCode: await generateJobCode(),
      client: existing.client,
      title: existing.title,
      department: existing.department,
      hiringManager: existing.hiringManager,
      accountManager: existing.accountManager,
      status: 'PENDING_APPROVAL',
      openings: existing.openings,
      filled: 0,
      priority: existing.priority,
      location: existing.location,
      locationCity: existing.locationCity,
      isRemote: existing.isRemote,
      workMode: existing.workMode,
      employmentType: existing.employmentType,
      seniorityLevel: existing.seniorityLevel,
      experienceMinYears: existing.experienceMinYears,
      experienceMaxYears: existing.experienceMaxYears,
      salaryBand: existing.salaryBand,
      targetStartDate: existing.targetStartDate,
      hiringDeadline: existing.hiringDeadline,
      description: existing.description,
      jobDescription: existing.jobDescription,
      primarySkills: existing.primarySkills,
      secondarySkills: existing.secondarySkills,
      createdBy: req.auth!.userId,
      createdByRole: req.auth!.role,
      recruiters: '[]',
      approval: JSON.stringify({ decision: 'PENDING' }),
      approvalHistory: JSON.stringify([
        {
          action: 'REQUESTED',
          by: req.auth!.userId,
          at: timestamp.toISOString(),
          role: req.auth!.role,
        },
      ]),
      versions: '[]',
      currentVersion: 1,
      visibleToCandidates: false,
    },
  })

  await ensureInterviewPlan(requirement.id)

  const businessRow = await prisma.businessRequirement.update({
    where: { id: existing.id },
    data: {
      status: 'OPEN_TO_HIRING',
      publishedRequirementId: requirement.id,
    },
  })

  await logActivity({
    entityType: 'REQUIREMENT',
    entityId: requirement.id,
    action: 'CREATED',
    performedBy: req.auth!.userId,
    performerRole: req.auth!.role,
    details: { title: requirement.title, fromBusinessRequirementId: existing.id },
  })

  await logActivity({
    entityType: 'BUSINESS_REQUIREMENT',
    entityId: businessRow.id,
    action: 'OPENED_TO_HIRING',
    performedBy: req.auth!.userId,
    performerRole: req.auth!.role,
    details: {
      title: businessRow.title,
      requirementId: requirement.id,
    },
  })

  res.status(201).json({
    businessRequirement: mapBusinessRequirement(businessRow),
    requirement: mapRequirement(requirement),
  })
})

router.post('/:id/cancel', requireRoles(...BUSINESS_MUTATE_ROLES), async (req, res) => {
  try {
    await assertCanMutateBusinessRequirement(req.auth!, req.params.id)
  } catch (err) {
    if (err instanceof BusinessRequirementAccessError) {
      const status = err.message === 'Not found' ? 404 : 403
      return res.status(status).json({ error: err.message })
    }
    throw err
  }

  const existing = await prisma.businessRequirement.findUnique({ where: { id: req.params.id } })
  if (!existing) return res.status(404).json({ error: 'Not found' })
  if (existing.status === 'CANCELLED') {
    return res.status(400).json({ error: 'Already cancelled' })
  }
  if (existing.status === 'OPEN_TO_HIRING') {
    return res.status(400).json({ error: 'Cannot cancel after opening to hiring' })
  }

  const row = await prisma.businessRequirement.update({
    where: { id: req.params.id },
    data: { status: 'CANCELLED' },
  })

  await logActivity({
    entityType: 'BUSINESS_REQUIREMENT',
    entityId: row.id,
    action: 'CANCELLED',
    performedBy: req.auth!.userId,
    performerRole: req.auth!.role,
    details: { title: row.title },
  })

  res.json(mapBusinessRequirement(row))
})

export default router
