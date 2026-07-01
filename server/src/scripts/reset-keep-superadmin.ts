/**
 * Remove all application data and users except one SUPER_ADMIN account.
 *
 * Usage (PowerShell):
 *   $env:CONFIRM_PRODUCTION_RESET="yes"
 *   npm run db:reset-keep-superadmin --prefix server
 *
 * Optional:
 *   $env:KEEP_SUPER_ADMIN_EMAIL="superadmin@stitch-ats.in"
 */
import { prisma } from '../lib/prisma.js'
import { databaseHostLabel } from '../config/loadEnv.js'

const CONFIRM = process.env.CONFIRM_PRODUCTION_RESET?.trim().toLowerCase()
const keepEmail = (
  process.env.KEEP_SUPER_ADMIN_EMAIL?.trim().toLowerCase() || 'superadmin@stitch-ats.in'
)

async function main() {
  if (CONFIRM !== 'yes') {
    console.error(
      'Refusing to run without confirmation.\n' +
        'Set CONFIRM_PRODUCTION_RESET=yes to proceed.\n' +
        `Target DB: ${databaseHostLabel() ?? '(unknown)'}`
    )
    process.exit(1)
  }

  const keepUser =
    (await prisma.user.findFirst({
      where: { email: keepEmail, role: 'SUPER_ADMIN' },
    })) ??
    (await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' },
      orderBy: { createdAt: 'asc' },
    }))

  if (!keepUser) {
    console.error(
      `No SUPER_ADMIN user found (looked for ${keepEmail}). Aborting — bootstrap an admin first.`
    )
    process.exit(1)
  }

  console.log(`Keeping SUPER_ADMIN: ${keepUser.email} (${keepUser.name})`)
  console.log(`Database: ${databaseHostLabel() ?? '(unknown)'}`)
  console.log('Removing all other data...')

  await prisma.$transaction([
    prisma.activityLog.deleteMany(),
    prisma.feedback.deleteMany(),
    prisma.offer.deleteMany(),
    prisma.interview.deleteMany(),
    prisma.interviewPlanStage.deleteMany(),
    prisma.interviewPlan.deleteMany(),
    prisma.candidate.deleteMany(),
    prisma.vendorRequirement.deleteMany(),
    prisma.loginHistory.deleteMany(),
    prisma.vendor.deleteMany(),
    prisma.skillCatalog.deleteMany(),
    prisma.departmentCatalog.deleteMany(),
    prisma.clientCatalog.deleteMany(),
    prisma.interviewPanelLevel.deleteMany(),
    prisma.requirement.deleteMany(),
    prisma.rolePageAccess.deleteMany(),
    prisma.user.deleteMany({ where: { id: { not: keepUser.id } } }),
  ])

  await prisma.user.update({
    where: { id: keepUser.id },
    data: {
      status: 'ACTIVE',
      vendorId: null,
      mustChangePassword: false,
      passwordResetToken: null,
      passwordResetExpires: null,
    },
  })

  const [users, requirements, candidates] = await Promise.all([
    prisma.user.count(),
    prisma.requirement.count(),
    prisma.candidate.count(),
  ])

  console.log('\nReset complete.')
  console.log(`  Users remaining: ${users} (${keepUser.email})`)
  console.log(`  Requirements: ${requirements}`)
  console.log(`  Candidates: ${candidates}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
