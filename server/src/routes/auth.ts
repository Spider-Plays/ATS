import { Router, type Request } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { env } from '../config/env.js'
import { mapUser } from '../utils/mappers.js'
import { getAllowedPagesForRole } from '../lib/pageAccess.js'
import { requireAuth, requireActiveUser } from '../middleware/auth.js'
import { authRateLimiter } from '../middleware/rateLimit.js'
import { sendPasswordResetEmail } from '../services/email.js'
import { recordUserLogin } from '../lib/recordLogin.js'
import { insforgeEnv } from '../config/insforge.js'
import { resolveInsforgeUser } from '../lib/insforgeAuth.js'
import { ensureInsforgeAuthUser } from '../lib/insforgeUsers.js'

const router = Router()

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const registerCandidateSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

const provisionCandidateSchema = z.object({
  accessToken: z.string().min(1),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
})

async function issueAppSession(userId: string, email: string, role: string, req: Request) {
  await recordUserLogin(userId, req)
  const token = jwt.sign({ userId, email, role }, env.jwtSecret, { expiresIn: '7d' })
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error('User not found')
  const allowedPages = await getAllowedPagesForRole(role)
  return { token, user: mapUser(user), allowedPages }
}

function deriveCandidateName(
  email: string,
  profileName: string | undefined,
  firstName?: string,
  lastName?: string
): string {
  const fromForm = [firstName, lastName].filter(Boolean).join(' ').trim()
  if (fromForm) return fromForm
  const fromProfile = profileName?.trim()
  if (fromProfile) return fromProfile
  return email.split('@')[0] || 'Candidate'
}

router.post('/provision-candidate', authRateLimiter, async (req, res, next) => {
  try {
    if (!insforgeEnv.authEnabled) {
      return res.status(503).json({ error: 'InsForge auth is not configured on the server' })
    }

    const parsed = provisionCandidateSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        error: parsed.error.errors[0]?.message || 'Invalid registration data',
      })
    }

    const insforgeUser = await resolveInsforgeUser(parsed.data.accessToken)
    if (!insforgeUser?.email) {
      return res.status(401).json({ error: 'Invalid InsForge session' })
    }

    const email = insforgeUser.email.toLowerCase()
    const profileName =
      typeof insforgeUser.profile === 'object' && insforgeUser.profile !== null
        ? (insforgeUser.profile as { name?: string }).name
        : undefined

    let user = await prisma.user.findUnique({ where: { email } })
    let created = false

    if (!user) {
      created = true
      const name = deriveCandidateName(email, profileName, parsed.data.firstName, parsed.data.lastName)
      const passwordHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10)
      user = await prisma.user.create({
        data: {
          email,
          name,
          passwordHash,
          role: 'CANDIDATE',
          status: 'ACTIVE',
          department: 'Candidate',
        },
      })
    } else if (user.role !== 'CANDIDATE') {
      return res.status(409).json({
        error: 'This email is already registered with a different account type.',
      })
    } else if (user.status === 'DISABLED') {
      return res.status(403).json({ error: 'Account disabled' })
    }

    const session = await issueAppSession(user.id, user.email, user.role, req)
    res.status(created ? 201 : 200).json(session)
  } catch (err) {
    next(err)
  }
})

router.post('/register-candidate', authRateLimiter, async (req, res, next) => {
  try {
    const parsed = registerCandidateSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        error: parsed.error.errors[0]?.message || 'Invalid registration data',
      })
    }

    const email = parsed.data.email.toLowerCase()
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' })
    }

    const name = `${parsed.data.firstName.trim()} ${parsed.data.lastName.trim()}`.trim()
    const passwordHash = await bcrypt.hash(parsed.data.password, 10)
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: 'CANDIDATE',
        status: 'ACTIVE',
        department: 'Candidate',
      },
    })

    await ensureInsforgeAuthUser(email, parsed.data.password, name)

    const session = await issueAppSession(user.id, user.email, user.role, req)
    res.status(201).json(session)
  } catch (err) {
    next(err)
  }
})

router.post('/exchange', authRateLimiter, async (req, res, next) => {
  try {
    if (!insforgeEnv.authEnabled) {
      return res.status(503).json({ error: 'InsForge auth is not configured on the server' })
    }

    const { accessToken } = z.object({ accessToken: z.string().min(1) }).parse(req.body)
    const insforgeUser = await resolveInsforgeUser(accessToken)
    if (!insforgeUser?.email) {
      return res.status(401).json({ error: 'Invalid InsForge session' })
    }

    const user = await prisma.user.findUnique({
      where: { email: insforgeUser.email.toLowerCase() },
    })
    if (!user) {
      return res.status(403).json({
        error: 'No ATS profile exists for this account. Contact your administrator.',
      })
    }
    if (user.status === 'DISABLED') {
      return res.status(403).json({ error: 'Account disabled' })
    }

    const session = await issueAppSession(user.id, user.email, user.role, req)
    res.json(session)
  } catch (err) {
    next(err)
  }
})

router.post('/login', authRateLimiter, async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Invalid credentials' })

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
    })
    if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }
    if (user.status === 'DISABLED') {
      return res.status(403).json({ error: 'Account disabled' })
    }

    const session = await issueAppSession(user.id, user.email, user.role, req)
    res.json(session)
  } catch (err) {
    next(err)
  }
})

router.get('/me', requireAuth, requireActiveUser, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.auth!.userId } })
  if (!user) return res.status(404).json({ error: 'User not found' })
  const allowedPages = await getAllowedPagesForRole(user.role)
  res.json({ ...mapUser(user), allowedPages })
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
})

router.post('/change-password', requireAuth, requireActiveUser, async (req, res) => {
  const parsed = changePasswordSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0]?.message || 'Invalid input' })
  }

  const { currentPassword, newPassword } = parsed.data
  if (currentPassword === newPassword) {
    return res.status(400).json({ error: 'New password must be different from your current password' })
  }

  const user = await prisma.user.findUnique({ where: { id: req.auth!.userId } })
  if (!user) return res.status(404).json({ error: 'User not found' })

  const valid = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!valid) return res.status(401).json({ error: 'Current password is incorrect' })

  const passwordHash = await bcrypt.hash(newPassword, 10)
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      mustChangePassword: false,
      passwordResetToken: null,
      passwordResetExpires: null,
    },
  })

  const token = jwt.sign(
    { userId: updated.id, email: updated.email, role: updated.role },
    env.jwtSecret,
    { expiresIn: '7d' }
  )

  const allowedPages = await getAllowedPagesForRole(updated.role)
  res.json({ token, user: mapUser(updated), allowedPages })
})

router.post('/forgot-password', authRateLimiter, async (req, res) => {
  const { email } = z.object({ email: z.string().email() }).parse(req.body)
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  })

  if (user && user.status === 'ACTIVE') {
    const token = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 60 * 60 * 1000)
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken: token, passwordResetExpires: expires },
    })
    const loginPath =
      user.role === 'CANDIDATE' ? '/portal/login' : '/login'
    const resetUrl = `${env.clientOrigin.replace(/\/$/, '')}${loginPath}?reset=${token}`
    await sendPasswordResetEmail({ to: user.email, name: user.name, resetUrl })
  }

  res.json({ ok: true, message: 'If that email exists, a reset link was sent.' })
})

router.post('/reset-password', authRateLimiter, async (req, res) => {
  const { token, newPassword } = z
    .object({
      token: z.string().min(1),
      newPassword: z.string().min(8),
    })
    .parse(req.body)

  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: token,
      passwordResetExpires: { gt: new Date() },
    },
  })
  if (!user) return res.status(400).json({ error: 'Invalid or expired reset link' })

  const passwordHash = await bcrypt.hash(newPassword, 10)
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      mustChangePassword: false,
      passwordResetToken: null,
      passwordResetExpires: null,
    },
  })

  res.json({ ok: true, message: 'Password updated. You can sign in now.' })
})

export default router
