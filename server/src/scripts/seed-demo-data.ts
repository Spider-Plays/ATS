import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma.js'
import { env } from '../config/env.js'
import { DEV_USERS, DEV_PASSWORD, devUserEmail, devUserName } from '../config/devUsers.js'
import {
  DEMO_CANDIDATES,
  DEMO_PORTAL_USERS,
  DEMO_REQUIREMENTS,
  DEMO_VENDOR_CODE,
} from '../config/demoData.js'
import { serializeSkills } from '../lib/skills.js'
import { saveResumeFile } from '../lib/resumeStorage.js'
import {
  buildCandidateResumePayload,
  extractResumeText,
} from '../lib/resumeParse.js'
import { demoResumeFileName, renderDemoCandidateResumePdf } from '../lib/demoResumePdf.js'
import { closePdfBrowser } from '../lib/offerPdf.js'
import { computeMatchScore } from '../lib/profileMatching.js'
import { findCandidateByEmail } from '../lib/candidateDuplicate.js'
import { ensureInterviewPlan } from '../lib/interviewPlan.js'
import { removeLegacyDevUsers } from '../lib/legacyDevUsers.js'
import { migrateRequirementJobCodes } from '../lib/jobCode.js'
import type { DemoCandidateSeed } from '../config/demoData.js'

const FRESH = process.argv.includes('--fresh')
const FORCE = process.argv.includes('--force')

type InterviewProgress = NonNullable<DemoCandidateSeed['interviewProgress']>

async function ensureStageInterview(
  candidate: { id: string; requirementId: string | null },
  stage: { id: string; interviewType: string; defaultDuration: number },
  opts: { scheduledAt: Date; status: 'SCHEDULED' | 'COMPLETED'; interviewerId: string }
) {
  const existing = await prisma.interview.findFirst({
    where: { candidateId: candidate.id, planStageId: stage.id },
  })
  if (existing) return existing

  const interview = await prisma.interview.create({
    data: {
      candidateId: candidate.id,
      requirementId: candidate.requirementId!,
      planStageId: stage.id,
      scheduledAt: opts.scheduledAt,
      interviewerIds: JSON.stringify([opts.interviewerId]),
      type: stage.interviewType,
      status: opts.status,
      duration: stage.defaultDuration,
      meetingLink: 'https://meet.google.com/demo-stitch-ats',
    },
  })

  if (opts.status === 'COMPLETED') {
    await prisma.feedback.create({
      data: {
        interviewId: interview.id,
        interviewerId: opts.interviewerId,
        candidateId: candidate.id,
        rating: 4,
        technicalRating: 4,
        communicationRating: 4,
        comments:
          'Strong candidate — solid technical depth and clear communication. Recommend proceeding to the next round.',
        recommendation: 'HIRE',
      },
    })
  }
  return interview
}

async function seedInterviewsForCandidate(
  candidate: { id: string; email: string; requirementId: string | null },
  progress: InterviewProgress,
  interviewerId: string
) {
  if (!candidate.requirementId) return
  const existing = await prisma.interview.findFirst({ where: { candidateId: candidate.id } })
  if (existing) return

  const plan = await ensureInterviewPlan(candidate.requirementId)
  const stages = plan.stages
  if (stages.length === 0) return

  const day = 24 * 60 * 60 * 1000
  const now = Date.now()

  if (progress === 'l1-scheduled') {
    await ensureStageInterview(candidate, stages[0], {
      scheduledAt: new Date(now + 3 * day),
      status: 'SCHEDULED',
      interviewerId,
    })
    return
  }

  if (progress === 'l1-done-l2-scheduled') {
    await ensureStageInterview(candidate, stages[0], {
      scheduledAt: new Date(now - 5 * day),
      status: 'COMPLETED',
      interviewerId,
    })
    if (stages[1]) {
      await ensureStageInterview(candidate, stages[1], {
        scheduledAt: new Date(now + 2 * day),
        status: 'SCHEDULED',
        interviewerId,
      })
    }
    return
  }

  for (let i = 0; i < Math.min(stages.length, 3); i++) {
    await ensureStageInterview(candidate, stages[i], {
      scheduledAt: new Date(now - (10 - i * 3) * day),
      status: 'COMPLETED',
      interviewerId,
    })
  }
}

async function seedInterviewRounds(
  candidateSeeds: Map<string, DemoCandidateSeed>,
  userByEmail: Map<string, string>
) {
  const interviewerId =
    userByEmail.get(devUserEmail('INTERVIEWER')) ?? userByEmail.get(devUserEmail('ADMIN'))!
  if (!interviewerId) return

  const candidates = await prisma.candidate.findMany({
    where: { requirementId: { not: null } },
  })

  for (const c of candidates) {
    const seed = candidateSeeds.get(c.email.toLowerCase())
    const progress = seed?.interviewProgress
    if (progress) {
      await seedInterviewsForCandidate(c, progress, interviewerId)
      continue
    }
    if (c.status === 'INTERVIEW') {
      await seedInterviewsForCandidate(c, 'l1-scheduled', interviewerId)
    }
  }
}

async function seedOffers(candidateSeeds: Map<string, DemoCandidateSeed>, recruiterId: string) {
  const candidates = await prisma.candidate.findMany({
    where: {
      status: { in: ['OFFER', 'HIRED', 'JOINED'] },
      requirementId: { not: null },
    },
  })

  for (const c of candidates) {
    const existing = await prisma.offer.findFirst({ where: { candidateId: c.id } })
    if (existing) continue

    const seed = candidateSeeds.get(c.email.toLowerCase())
    const offerStatus =
      seed?.offerStatus ?? (c.status === 'OFFER' ? 'PENDING' : 'ACCEPTED')

    const role = (c.role ?? '').toLowerCase()
    const baseSalary = role.includes('design')
      ? 2_200_000
      : role.includes('devops') || role.includes('sre') || role.includes('platform')
        ? 2_600_000
        : role.includes('product manager')
          ? 3_000_000
          : 2_800_000

    const history: { action: string; at: string; by: string }[] = [
      { action: 'CREATED', at: new Date().toISOString(), by: recruiterId },
    ]
    if (offerStatus === 'SENT' || offerStatus === 'ACCEPTED') {
      history.push({ action: 'SENT', at: new Date().toISOString(), by: recruiterId })
    }
    if (offerStatus === 'ACCEPTED') {
      history.push({ action: 'ACCEPTED', at: new Date().toISOString(), by: c.id })
    }

    await prisma.offer.create({
      data: {
        candidateId: c.id,
        requirementId: c.requirementId!,
        baseSalary,
        bonus: 200_000,
        status: offerStatus,
        createdBy: recruiterId,
        history: JSON.stringify(history),
      },
    })
  }
}

async function syncRequirementFilledCounts(reqByCode: Map<string, { id: string }>) {
  for (const [, req] of reqByCode) {
    const filled = await prisma.candidate.count({
      where: { requirementId: req.id, status: { in: ['HIRED', 'JOINED'] } },
    })
    await prisma.requirement.update({ where: { id: req.id }, data: { filled } })
  }
}

async function clearHiringData() {
  console.log('Clearing existing hiring data...')
  await prisma.$transaction([
    prisma.activityLog.deleteMany(),
    prisma.feedback.deleteMany(),
    prisma.offer.deleteMany(),
    prisma.interview.deleteMany(),
    prisma.interviewPlan.deleteMany(),
    prisma.candidate.deleteMany(),
    prisma.vendorRequirement.deleteMany(),
    prisma.requirement.deleteMany(),
  ])
}

async function upsertUser(u: {
  email: string
  password: string
  name: string
  role: string
  department?: string
  vendorId?: string
}) {
  const passwordHash = await bcrypt.hash(u.password, 10)
  return prisma.user.upsert({
    where: { email: u.email.toLowerCase() },
    update: {
      name: u.name,
      role: u.role,
      department: u.department,
      passwordHash,
      status: 'ACTIVE',
      ...(u.vendorId !== undefined && { vendorId: u.vendorId }),
    },
    create: {
      email: u.email.toLowerCase(),
      passwordHash,
      name: u.name,
      role: u.role,
      department: u.department,
      status: 'ACTIVE',
      permissions: '[]',
      themePreference: 'system',
      authProvider: 'local',
      ...(u.vendorId !== undefined && { vendorId: u.vendorId }),
    },
  })
}

async function attachResume(
  candidateId: string,
  data: {
    name: string
    email: string
    role: string
    location?: string | null
    snippet: string
    primarySkills?: string[]
    secondarySkills?: string[]
  }
) {
  const textPayload = buildCandidateResumePayload(data.snippet)
  const primarySkills =
    data.primarySkills?.length
      ? serializeSkills(data.primarySkills)
      : textPayload.primarySkills
  const secondarySkills =
    data.secondarySkills?.length
      ? serializeSkills(data.secondarySkills)
      : textPayload.secondarySkills

  const fileName = demoResumeFileName(data.name)
  let resumeText = textPayload.resumeText

  try {
    const buffer = await renderDemoCandidateResumePdf({
      name: data.name,
      email: data.email,
      role: data.role,
      location: data.location,
      summary: data.snippet,
      primarySkills: data.primarySkills,
      secondarySkills: data.secondarySkills,
    })

    try {
      const parsed = await extractResumeText(buffer, 'application/pdf', fileName)
      const merged = [data.snippet, parsed].filter(Boolean).join('\n\n')
      const mergedPayload = buildCandidateResumePayload(merged)
      resumeText = mergedPayload.resumeText
    } catch {
      // keep snippet-based resume text
    }

    await saveResumeFile(candidateId, 'application/pdf', buffer, fileName)
    await prisma.candidate.update({
      where: { id: candidateId },
      data: {
        resumeFileName: fileName,
        resumeMimeType: 'application/pdf',
        resumeUrl: null,
        resumeStorageKey: null,
        resumeText,
        primarySkills: data.primarySkills?.length ? primarySkills : textPayload.primarySkills,
        secondarySkills: data.secondarySkills?.length ? secondarySkills : textPayload.secondarySkills,
      },
    })
  } catch (err) {
    console.warn(`Could not generate resume PDF for ${data.email}:`, err)
    await prisma.candidate.update({
      where: { id: candidateId },
      data: {
        resumeFileName: fileName,
        resumeMimeType: 'application/pdf',
        resumeUrl: null,
        resumeText,
        primarySkills,
        secondarySkills,
      },
    })
  }
}

async function main() {
  if (env.isProduction && !FORCE) {
    console.error('Refusing to seed demo data in production. Pass --force to override.')
    process.exit(1)
  }

  if (FRESH) await clearHiringData()

  const legacyCleanup = await removeLegacyDevUsers(prisma)
  const legacyRemoved =
    legacyCleanup.merged + legacyCleanup.deleted + legacyCleanup.patternDeleted
  if (legacyRemoved > 0) {
    console.log(
      `Removed ${legacyRemoved} legacy user(s) (merged ${legacyCleanup.merged}, deleted ${legacyCleanup.deleted + legacyCleanup.patternDeleted}).`
    )
  }

  console.log('Seeding demo users...')
  const vendor = await prisma.vendor.upsert({
    where: { code: DEMO_VENDOR_CODE },
    update: {
      name: 'Demo Staffing Co',
      status: 'ACTIVE',
      email: 'staffing@stitch-ats.in',
      contactName: 'Raghavendra Murthy',
    },
    create: {
      name: 'Demo Staffing Co',
      code: DEMO_VENDOR_CODE,
      email: 'staffing@stitch-ats.in',
      status: 'ACTIVE',
      contactName: 'Raghavendra Murthy',
      phone: '+91 98765 43210',
    },
  })

  const userByEmail = new Map<string, string>()

  for (const u of DEV_USERS) {
    const row = await upsertUser({
      ...u,
      vendorId: u.role === 'VENDOR' ? vendor.id : undefined,
    })
    userByEmail.set(row.email, row.id)
  }

  for (const u of DEMO_PORTAL_USERS) {
    const row = await upsertUser({
      email: u.email,
      password: u.password,
      name: u.name,
      role: 'CANDIDATE',
    })
    userByEmail.set(row.email, row.id)
  }

  const recruiterId =
    userByEmail.get(devUserEmail('RECRUITER')) ?? userByEmail.get(devUserEmail('ADMIN'))!

  const jobCodeMigration = await migrateRequirementJobCodes()
  if (jobCodeMigration.updated > 0) {
    console.log(`Migrated ${jobCodeMigration.updated} requirement job code(s) to REQ format.`)
  }

  console.log('Seeding requirements...')
  const reqByCode = new Map<string, { id: string; title: string }>()

  for (const r of DEMO_REQUIREMENTS) {
    const timestamp = new Date()
    const row = await prisma.requirement.upsert({
      where: { jobCode: r.jobCode },
      update: {
        title: r.title,
        department: r.department,
        hiringManager: r.hiringManager,
        client: r.client,
        location: r.location,
        priority: r.priority,
        openings: r.openings,
        filled: r.filled,
        status: r.status,
        description: r.description,
        jobDescription: r.jobDescription,
        primarySkills: serializeSkills([...r.primarySkills]),
        secondarySkills: serializeSkills([...r.secondarySkills]),
        visibleToCandidates: r.visibleToCandidates,
        visibleToVendors: r.visibleToVendors,
        approval:
          r.status === 'LIVE'
            ? JSON.stringify({ decision: 'APPROVED' })
            : JSON.stringify({ decision: 'PENDING' }),
      },
      create: {
        jobCode: r.jobCode,
        title: r.title,
        department: r.department,
        hiringManager: r.hiringManager,
        client: r.client,
        location: r.location,
        priority: r.priority,
        openings: r.openings,
        filled: r.filled,
        status: r.status,
        description: r.description,
        jobDescription: r.jobDescription,
        primarySkills: serializeSkills([...r.primarySkills]),
        secondarySkills: serializeSkills([...r.secondarySkills]),
        visibleToCandidates: r.visibleToCandidates,
        visibleToVendors: r.visibleToVendors,
        createdBy: recruiterId,
        createdByRole: 'RECRUITER',
        recruiters: JSON.stringify([recruiterId]),
        approval:
          r.status === 'LIVE'
            ? JSON.stringify({ decision: 'APPROVED' })
            : JSON.stringify({ decision: 'PENDING' }),
        approvalHistory: JSON.stringify([
          {
            action: r.status === 'LIVE' ? 'APPROVED' : 'REQUESTED',
            by: recruiterId,
            at: timestamp.toISOString(),
            role: 'RECRUITER',
          },
        ]),
        versions: '[]',
        currentVersion: 1,
      },
    })
    reqByCode.set(r.jobCode, { id: row.id, title: row.title })
    await ensureInterviewPlan(row.id)

    if (r.visibleToVendors) {
      await prisma.vendorRequirement.upsert({
        where: {
          vendorId_requirementId: {
            vendorId: vendor.id,
            requirementId: row.id,
          },
        },
        update: {},
        create: {
          vendorId: vendor.id,
          requirementId: row.id,
          assignedBy: recruiterId,
        },
      })
    }
  }

  const vendorUserId = userByEmail.get(devUserEmail('VENDOR'))

  async function upsertCandidate(
    data: {
      email: string
      name: string
      role: string
      status: string
      source: string
      jobCode?: string | null
      phone?: string
      location?: string
      totalExperience?: string
      currentCompany?: string
      primarySkills?: string[]
      secondarySkills?: string[]
      resumeSnippet: string
      vendorId?: string
      submittedByUserId?: string
      createdBy?: string
    },
  ) {
    const requirement = data.jobCode ? reqByCode.get(data.jobCode) : undefined
    const skillsPayload = buildCandidateResumePayload(data.resumeSnippet)

    const payload = {
      name: data.name,
      role: data.role,
      status: data.status,
      source: data.source,
      requirementId: requirement?.id ?? null,
      jobTitle: requirement?.title ?? data.role,
      phone: data.phone ?? null,
      location: data.location ?? null,
      totalExperience: data.totalExperience ?? null,
      currentCompany: data.currentCompany ?? null,
      primarySkills: data.primarySkills
        ? serializeSkills(data.primarySkills)
        : skillsPayload.primarySkills,
      secondarySkills: data.secondarySkills
        ? serializeSkills(data.secondarySkills)
        : skillsPayload.secondarySkills,
      resumeText: skillsPayload.resumeText,
      vendorId: data.vendorId ?? null,
      submittedByUserId: data.submittedByUserId ?? null,
      createdBy: data.createdBy ?? null,
    }

    const existing = await findCandidateByEmail(data.email)
    const row = existing
      ? await prisma.candidate.update({
          where: { id: existing.id },
          data: payload,
        })
      : await prisma.candidate.create({
          data: {
            email: data.email.toLowerCase(),
            matchScore: 0,
            ...payload,
          },
        })

    const fullReq = requirement
      ? await prisma.requirement.findUnique({ where: { id: requirement.id } })
      : null

    if (fullReq) {
      const { score } = computeMatchScore(row, fullReq, data.resumeSnippet)
      await prisma.candidate.update({
        where: { id: row.id },
        data: { matchScore: score },
      })
    }

    await attachResume(row.id, {
      name: data.name,
      email: data.email,
      role: data.role,
      location: data.location,
      snippet: data.resumeSnippet,
      primarySkills: data.primarySkills,
      secondarySkills: data.secondarySkills,
    })
    return row
  }

  console.log('Seeding candidates...')
  const candidateSeeds = new Map<string, DemoCandidateSeed>()
  for (const c of DEMO_CANDIDATES) {
    candidateSeeds.set(c.email.toLowerCase(), c)
    await upsertCandidate(
      {
        ...c,
        vendorId: c.vendorSubmitted ? vendor.id : undefined,
        submittedByUserId: c.vendorSubmitted ? vendorUserId : undefined,
        createdBy: c.vendorSubmitted ? vendorUserId : recruiterId,
      }
    )
  }

  console.log('Seeding portal self-applications...')
  for (const p of DEMO_PORTAL_USERS) {
    if (!p.applyToJobCode) continue
    const requirement = reqByCode.get(p.applyToJobCode)
    if (!requirement) continue

    const snippet = `${p.name} — applied via candidate portal. Motivated applicant for ${requirement.title}.`
    const portalSeed: DemoCandidateSeed = {
      email: p.email,
      name: p.name,
      role: requirement.title,
      status: 'APPLIED',
      source: 'Candidate Portal',
      jobCode: p.applyToJobCode,
      phone: '+91 90000 00000',
      location: 'India',
      resumeSnippet: snippet,
    }
    candidateSeeds.set(p.email.toLowerCase(), portalSeed)
    await upsertCandidate(
      {
        email: p.email,
        name: p.name,
        role: requirement.title,
        status: 'APPLIED',
        source: 'Candidate Portal',
        jobCode: p.applyToJobCode,
        phone: '+91 90000 00000',
        location: 'India',
        resumeSnippet: snippet,
      }
    )
  }

  // Ensure dev-candidate portal account is linked (self-applied)
  const devCandUser = userByEmail.get(devUserEmail('CANDIDATE'))
  if (devCandUser) {
    const req = reqByCode.get('REQ28062026001')
    if (req) {
      await upsertCandidate(
        {
          email: devUserEmail('CANDIDATE'),
          name: devUserName('CANDIDATE'),
          role: req.title,
          status: 'APPLIED',
          source: 'Candidate Portal',
          jobCode: 'REQ28062026001',
          resumeSnippet:
            `${devUserName('CANDIDATE')} — self-applied via portal for Senior Software Engineer. TypeScript, React, Node.js.`,
        }
      )
    }
  }

  // Interview rounds + feedback from demo metadata
  await seedInterviewRounds(candidateSeeds, userByEmail)

  // Offers for OFFER / HIRED / JOINED candidates
  await seedOffers(candidateSeeds, recruiterId)

  await syncRequirementFilledCounts(reqByCode)

  const counts = await Promise.all([
    prisma.user.count(),
    prisma.requirement.count(),
    prisma.candidate.count(),
    prisma.candidate.count({ where: { source: 'Candidate Portal' } }),
    prisma.candidate.count({ where: { vendorId: { not: null } } }),
  ])

  console.log('\nDemo data ready:')
  console.log(`  Users: ${counts[0]} (password: ${DEV_PASSWORD})`)
  console.log(`  Requirements: ${counts[1]}`)
  console.log(`  Candidates: ${counts[2]} (${counts[3]} self-applied, ${counts[4]} vendor)`)
  console.log('  Portal browse-only: karan.joshi@stitch-ats.in, meera.shah@stitch-ats.in')
  console.log('  Re-run with --fresh to replace hiring data.\n')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await closePdfBrowser()
    await prisma.$disconnect()
  })
