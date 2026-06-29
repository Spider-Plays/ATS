/**
 * Seed minimal data required for QA / UAT (see docs/qa/TESTER_SETUP.md).
 * Run via `npm run db:reset-qa` (clears DB first).
 */
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma.js'
import { env } from '../config/env.js'
import { DEV_USERS } from '../config/devUsers.js'
import {
  QA_CATALOGS,
  QA_DRAFT_REQUIREMENT,
  QA_FEATURE_TAGS,
  QA_LIVE_REQUIREMENT,
  QA_PENDING_REQUIREMENT,
  QA_VENDOR_CODE,
  DEV_PASSWORD,
} from '../config/qaData.js'
import { serializeSkills } from '../lib/skills.js'
import { ensureInterviewPlan } from '../lib/interviewPlan.js'
import { ensureInterviewPanelCatalog, updateInterviewPanelLevel } from '../lib/interviewPanelCatalog.js'
import { ensureUserReferralCode } from '../lib/referralCode.js'

const FORCE = process.argv.includes('--force')

const PRIMARY_USERS = DEV_USERS.filter((u) => u.primary)

async function upsertUser(u: {
  email: string
  password: string
  name: string
  role: string
  department?: string
  vendorId?: string
  permissions?: string
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
      mustChangePassword: false,
      permissions: u.permissions ?? '[]',
      ...(u.vendorId !== undefined && { vendorId: u.vendorId }),
    },
    create: {
      email: u.email.toLowerCase(),
      passwordHash,
      name: u.name,
      role: u.role,
      department: u.department,
      status: 'ACTIVE',
      permissions: u.permissions ?? '[]',
      themePreference: 'system',
      authProvider: 'local',
      mustChangePassword: false,
      ...(u.vendorId !== undefined && { vendorId: u.vendorId }),
    },
  })
}

async function seedCatalogs() {
  for (const name of QA_CATALOGS.departments) {
    await prisma.departmentCatalog.upsert({
      where: { name },
      update: {},
      create: { name },
    })
  }
  for (const name of QA_CATALOGS.clients) {
    await prisma.clientCatalog.upsert({
      where: { name },
      update: {},
      create: { name },
    })
  }
  for (const name of QA_CATALOGS.skills) {
    await prisma.skillCatalog.upsert({
      where: { name },
      update: {},
      create: { name },
    })
  }
}

async function seedInterviewPanels(interviewerId: string) {
  await ensureInterviewPanelCatalog()
  const levels = await prisma.interviewPanelLevel.findMany({ orderBy: { order: 'asc' } })
  for (const level of levels) {
    await updateInterviewPanelLevel(level.id, [interviewerId])
  }
}

type ReqSeed = typeof QA_LIVE_REQUIREMENT

async function createRequirement(
  r: ReqSeed,
  createdBy: string,
  recruiterId: string
) {
  const timestamp = new Date().toISOString()
  const approval =
    r.status === 'LIVE'
      ? JSON.stringify({ decision: 'APPROVED' })
      : r.status === 'PENDING_APPROVAL'
        ? JSON.stringify({ decision: 'PENDING' })
        : null

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
      filled: 0,
      status: r.status,
      description: r.description,
      jobDescription: r.jobDescription,
      primarySkills: serializeSkills([...r.primarySkills]),
      secondarySkills: serializeSkills([...r.secondarySkills]),
      visibleToCandidates: r.visibleToCandidates,
      visibleToVendors: r.visibleToVendors,
      visibleToReferrals: r.visibleToReferrals,
      recruiters: JSON.stringify([recruiterId]),
      approval,
      liveAt: r.status === 'LIVE' ? new Date() : null,
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
      filled: 0,
      status: r.status,
      description: r.description,
      jobDescription: r.jobDescription,
      primarySkills: serializeSkills([...r.primarySkills]),
      secondarySkills: serializeSkills([...r.secondarySkills]),
      visibleToCandidates: r.visibleToCandidates,
      visibleToVendors: r.visibleToVendors,
      visibleToReferrals: r.visibleToReferrals,
      createdBy,
      createdByRole: 'HIRING_MANAGER',
      recruiters: JSON.stringify([recruiterId]),
      approval,
      approvalHistory: JSON.stringify([
        {
          action: r.status === 'LIVE' ? 'APPROVED' : r.status === 'PENDING_APPROVAL' ? 'REQUESTED' : 'CREATED',
          by: createdBy,
          at: timestamp,
          role: 'HIRING_MANAGER',
        },
      ]),
      versions: '[]',
      currentVersion: 1,
      liveAt: r.status === 'LIVE' ? new Date() : null,
    },
  })

  await ensureInterviewPlan(row.id)
  return row
}

export async function seedQaData() {
  if (env.isProduction && !FORCE) {
    console.error('Refusing to seed QA data in production. Pass --force to override.')
    process.exit(1)
  }

  console.log('Seeding QA test data...')

  const vendor = await prisma.vendor.upsert({
    where: { code: QA_VENDOR_CODE },
    update: {
      name: 'QA Staffing Co',
      status: 'ACTIVE',
      email: 'qa-vendor@stitch-ats.in',
      contactName: 'QA Vendor Contact',
    },
    create: {
      name: 'QA Staffing Co',
      code: QA_VENDOR_CODE,
      email: 'qa-vendor@stitch-ats.in',
      status: 'ACTIVE',
      contactName: 'QA Vendor Contact',
      phone: '+91 90000 00001',
    },
  })

  const featureTagsJson = JSON.stringify([...QA_FEATURE_TAGS])
  const userByEmail = new Map<string, string>()

  for (const u of PRIMARY_USERS) {
    const permissions =
      u.role === 'RECRUITER' || u.role === 'HR_HEAD' || u.role === 'HR_MANAGER'
        ? featureTagsJson
        : '[]'

    const row = await upsertUser({
      email: u.email,
      password: u.password,
      name: u.name,
      role: u.role,
      department: u.department,
      vendorId: u.role === 'VENDOR' ? vendor.id : undefined,
      permissions,
    })
    userByEmail.set(row.email, row.id)
  }

  const hiringManagerId = userByEmail.get(
    PRIMARY_USERS.find((u) => u.role === 'HIRING_MANAGER')!.email.toLowerCase()
  )!
  const recruiterId = userByEmail.get(
    PRIMARY_USERS.find((u) => u.role === 'RECRUITER')!.email.toLowerCase()
  )!
  const interviewerId = userByEmail.get(
    PRIMARY_USERS.find((u) => u.role === 'INTERVIEWER')!.email.toLowerCase()
  )!
  const employeeId = userByEmail.get(
    PRIMARY_USERS.find((u) => u.role === 'EMPLOYEE')!.email.toLowerCase()
  )

  if (employeeId) {
    await ensureUserReferralCode(employeeId)
  }

  console.log('  Catalogs...')
  await seedCatalogs()

  console.log('  Interview panels...')
  await seedInterviewPanels(interviewerId)

  console.log('  Requirements...')
  const liveReq = await createRequirement(QA_LIVE_REQUIREMENT, hiringManagerId, recruiterId)
  await createRequirement(QA_PENDING_REQUIREMENT, hiringManagerId, recruiterId)
  await createRequirement(QA_DRAFT_REQUIREMENT, hiringManagerId, recruiterId)

  await prisma.vendorRequirement.upsert({
    where: {
      vendorId_requirementId: { vendorId: vendor.id, requirementId: liveReq.id },
    },
    update: {},
    create: {
      vendorId: vendor.id,
      requirementId: liveReq.id,
      assignedBy: recruiterId,
    },
  })

  const counts = {
    users: await prisma.user.count(),
    requirements: await prisma.requirement.count(),
    candidates: await prisma.candidate.count(),
    vendors: await prisma.vendor.count(),
    departments: await prisma.departmentCatalog.count(),
    skills: await prisma.skillCatalog.count(),
  }

  console.log('\nQA seed complete.')
  console.log(`  Users:         ${counts.users} (primary account per role)`)
  console.log(`  Requirements:  ${counts.requirements} (LIVE + PENDING + DRAFT)`)
  console.log(`  Candidates:    ${counts.candidates} (create during tests with [QA] prefix)`)
  console.log(`  Vendors:       ${counts.vendors} (assigned to LIVE job)`)
  console.log(`  Catalogs:      ${counts.departments} depts, ${counts.skills} skills`)
  console.log(`\nPassword for all accounts: ${DEV_PASSWORD}`)
  console.log('\nPrimary logins:')
  for (const u of PRIMARY_USERS) {
    console.log(`  ${u.role.padEnd(16)} ${u.email}`)
  }
}

// Allow running standalone: npm run db:seed-qa
const isMain = process.argv[1]?.replace(/\\/g, '/').endsWith('seed-qa-data.ts')
if (isMain) {
  seedQaData()
    .catch((e) => {
      console.error(e)
      process.exit(1)
    })
    .finally(() => prisma.$disconnect())
}
