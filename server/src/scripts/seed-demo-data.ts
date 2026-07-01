import '../config/loadEnv.js'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma.js'
import { env } from '../config/env.js'
import { DEV_USERS, DEV_PASSWORD, devUserEmail, devUserName } from '../config/devUsers.js'
import {
  DEMO_BUSINESS_REQUIREMENTS,
  DEMO_CANDIDATES,
  DEMO_PORTAL_USERS,
  DEMO_REQUIREMENTS,
  DEMO_VENDOR_CODE,
  DEMO_VENDOR_NAME,
  type DemoPortalUserSeed,
  type DemoRequirementSeed,
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
import { logActivity } from '../services/activityLog.js'
import { businessStagePercentage } from '../lib/businessStages.js'
import type { DemoCandidateSeed } from '../config/demoData.js'

const FRESH = process.argv.includes('--fresh')
const FORCE = process.argv.includes('--force')

function requirementExtras(r: DemoRequirementSeed, timestamp: Date) {
  return {
    accountManager: r.accountManager ?? null,
    locationCity: r.locationCity ?? null,
    workMode: r.workMode ?? null,
    employmentType: r.employmentType ?? null,
    seniorityLevel: r.seniorityLevel ?? null,
    experienceMinYears: r.experienceMinYears ?? null,
    experienceMaxYears: r.experienceMaxYears ?? null,
    salaryBand: r.salaryBand ?? null,
    isRemote: r.workMode === 'REMOTE',
    liveAt: r.status === 'LIVE' ? timestamp : null,
  }
}

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
      status: { in: ['OFFER', 'HIRED'] },
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
      where: { requirementId: req.id, status: 'HIRED' },
    })
    await prisma.requirement.update({ where: { id: req.id }, data: { filled } })
  }
}

async function ensurePortalApplicationLog(
  candidateId: string,
  userId: string,
  requirement: { id: string; jobCode: string | null; title: string },
  userName: string
) {
  const logs = await prisma.activityLog.findMany({
    where: {
      entityType: 'CANDIDATE',
      entityId: candidateId,
      action: 'APPLIED',
    },
  })
  const already = logs.some((l) => {
    try {
      const d = JSON.parse(l.details || '{}') as { requirementId?: string }
      return d.requirementId === requirement.id
    } catch {
      return false
    }
  })
  if (already) return

  await logActivity({
    entityType: 'CANDIDATE',
    entityId: candidateId,
    action: 'APPLIED',
    performedBy: userId,
    performerName: userName,
    performerRole: 'CANDIDATE',
    details: {
      requirementId: requirement.id,
      jobCode: requirement.jobCode,
      title: requirement.title,
      via: 'seed',
    },
  })
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
    prisma.businessRequirement.deleteMany(),
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

  if (FRESH && !FORCE) {
    const host = process.env.DATABASE_URL ?? ''
    const looksProduction =
      host.includes('weathered-math') ||
      process.env.RENDER === 'true' ||
      process.env.NODE_ENV === 'production'
    if (looksProduction) {
      console.error(
        'Refusing --fresh wipe on a production database.\n' +
          'Use a local or QA staging DATABASE_URL, or pass --force if you truly intend to wipe this DB.'
      )
      process.exit(1)
    }
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
      name: DEMO_VENDOR_NAME,
      status: 'ACTIVE',
      email: 'staffing@stitch-ats.in',
      contactName: 'Raghavendra Murthy',
      phone: '+91 80 4123 8900',
    },
    create: {
      name: DEMO_VENDOR_NAME,
      code: DEMO_VENDOR_CODE,
      email: 'staffing@stitch-ats.in',
      status: 'ACTIVE',
      contactName: 'Raghavendra Murthy',
      phone: '+91 80 4123 8900',
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
        ...requirementExtras(r, timestamp),
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
        ...requirementExtras(r, timestamp),
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

  console.log('Seeding business requirements...')
  for (const br of DEMO_BUSINESS_REQUIREMENTS) {
    const accountManagerId = userByEmail.get(devUserEmail(br.accountManagerRole))!
    const hiringManagerId = userByEmail.get(devUserEmail(br.hiringManagerRole))!
    const stage = br.businessStage
    const percentage = businessStagePercentage(stage)
    const timestamp = new Date().toISOString()

    const payload = {
      title: br.title,
      client: br.client,
      department: br.department,
      accountManager: accountManagerId,
      hiringManager: hiringManagerId,
      businessStage: stage,
      stagePercentage: percentage,
      status: 'ACTIVE' as const,
      openings: br.openings,
      priority: br.priority,
      location: br.location,
      locationCity: br.locationCity ?? null,
      workMode: br.workMode,
      employmentType: br.employmentType,
      seniorityLevel: br.seniorityLevel,
      experienceMinYears: br.experienceMinYears,
      experienceMaxYears: br.experienceMaxYears,
      salaryBand: br.salaryBand,
      isRemote: br.workMode === 'REMOTE',
      description: br.description,
      jobDescription: br.jobDescription,
      primarySkills: serializeSkills([...br.primarySkills]),
      secondarySkills: serializeSkills([...br.secondarySkills]),
      createdBy: recruiterId,
      createdByRole: 'RECRUITER',
      stageHistory: JSON.stringify([
        { stage, percentage, by: recruiterId, at: timestamp, role: 'RECRUITER' },
      ]),
    }

    const existing = await prisma.businessRequirement.findFirst({
      where: { title: br.title, client: br.client },
    })
    if (existing) {
      await prisma.businessRequirement.update({ where: { id: existing.id }, data: payload })
    } else {
      await prisma.businessRequirement.create({ data: payload })
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
      currentCTC?: string
      expectedCTC?: string
      noticePeriod?: string
      pan?: string
      linkedIn?: string
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
      currentCTC: data.currentCTC ?? null,
      expectedCTC: data.expectedCTC ?? null,
      noticePeriod: data.noticePeriod ?? null,
      pan: data.pan?.trim().toUpperCase() ?? null,
      linkedIn: data.linkedIn ?? null,
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

  async function seedPortalUser(p: DemoPortalUserSeed) {
    const requirement = p.applyToJobCode ? reqByCode.get(p.applyToJobCode) : undefined
    const snippet =
      p.resumeSnippet ??
      (requirement
        ? `${p.name} — applied via candidate portal for ${requirement.title}.`
        : `${p.name} — candidate portal profile.`)

    const portalSeed: DemoCandidateSeed = {
      email: p.email,
      name: p.name,
      role: requirement?.title ?? 'Candidate',
      status: p.status ?? (p.applyToJobCode ? 'SUBMITTED' : 'ADDED'),
      source: p.applyToJobCode ? 'Candidate Portal' : 'Candidate Portal',
      jobCode: p.applyToJobCode,
      phone: p.phone,
      location: p.location,
      totalExperience: p.totalExperience,
      currentCompany: p.currentCompany,
      primarySkills: p.primarySkills,
      secondarySkills: p.secondarySkills,
      resumeSnippet: snippet,
      interviewProgress: p.interviewProgress,
    }
    candidateSeeds.set(p.email.toLowerCase(), portalSeed)

    const row = await upsertCandidate({
      email: p.email,
      name: p.name,
      role: requirement?.title ?? p.name,
      status: portalSeed.status,
      source: 'Candidate Portal',
      jobCode: p.applyToJobCode,
      phone: p.phone,
      location: p.location,
      totalExperience: p.totalExperience,
      currentCompany: p.currentCompany,
      currentCTC: p.currentCTC,
      expectedCTC: p.expectedCTC,
      noticePeriod: p.noticePeriod,
      pan: p.pan,
      linkedIn: p.linkedIn,
      primarySkills: p.primarySkills,
      secondarySkills: p.secondarySkills,
      resumeSnippet: snippet,
    })

    const userId = userByEmail.get(p.email.toLowerCase())
    if (userId && requirement) {
      const fullReq = await prisma.requirement.findUnique({
        where: { id: requirement.id },
        select: { id: true, jobCode: true, title: true },
      })
      if (fullReq) {
        await ensurePortalApplicationLog(row.id, userId, fullReq, p.name)
      }
    }
  }

  console.log('Seeding portal accounts (profiles, resumes, applications)...')
  for (const p of DEMO_PORTAL_USERS) {
    await seedPortalUser(p)
  }

  // Interview rounds + feedback from demo metadata
  await seedInterviewRounds(candidateSeeds, userByEmail)

  // Offers for OFFER / HIRED candidates
  await seedOffers(candidateSeeds, recruiterId)

  await syncRequirementFilledCounts(reqByCode)

  const counts = await Promise.all([
    prisma.user.count(),
    prisma.requirement.count(),
    prisma.businessRequirement.count(),
    prisma.candidate.count(),
    prisma.candidate.count({ where: { source: 'Candidate Portal' } }),
    prisma.candidate.count({ where: { vendorId: { not: null } } }),
  ])

  console.log('\nDemo data ready:')
  console.log(`  Users: ${counts[0]} (password: ${DEV_PASSWORD})`)
  console.log(`  Requirements: ${counts[1]}`)
  console.log(`  Business requirements: ${counts[2]}`)
  console.log(`  Candidates: ${counts[3]} (${counts[4]} self-applied, ${counts[5]} vendor)`)
  console.log('  Candidate portal logins (password: password):')
  for (const p of DEMO_PORTAL_USERS) {
    const applied = p.applyToJobCode ? ` → ${p.applyToJobCode}` : ' (profile only, no application)'
    console.log(`    ${p.email}${applied}`)
  }
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
