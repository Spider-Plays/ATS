import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import {
  mapPublicCareersPosition,
  portalPositionsWhere,
  portalRequirementVisible,
} from '../lib/portalPositions.js'
import { careersRateLimiter } from '../middleware/rateLimit.js'

const router = Router()
router.use(careersRateLimiter)

router.get('/positions', async (_req, res) => {
  const rows = await prisma.requirement.findMany({
    where: portalPositionsWhere(),
    orderBy: { updatedAt: 'desc' },
  })
  res.json(rows.map(mapPublicCareersPosition))
})

router.get('/positions/departments', async (_req, res) => {
  const rows = await prisma.requirement.findMany({
    where: portalPositionsWhere(),
    select: { department: true },
    distinct: ['department'],
    orderBy: { department: 'asc' },
  })
  res.json(rows.map((r) => r.department))
})

router.get('/positions/:id', async (req, res) => {
  const row = await prisma.requirement.findUnique({ where: { id: req.params.id } })
  if (!row || !portalRequirementVisible(row)) {
    return res.status(404).json({ error: 'Position not found or not available' })
  }
  res.json(mapPublicCareersPosition(row))
})

export default router
