/**
 * Copy all Prisma-managed data from SOURCE_DATABASE_URL (InsForge) to NEON_DATABASE_URL.
 *
 * Usage (PowerShell):
 *   $env:NEON_DATABASE_URL="postgresql://...@ep-xxx-pooler....neon.tech/neondb?sslmode=require"
 *   npm run db:migrate-to-neon --prefix server
 *
 * Optional: SOURCE_DATABASE_URL overrides server/.env DATABASE_URL for the export source.
 */
import 'dotenv/config'
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PrismaClient } from '@prisma/client'

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const envPath = path.join(serverRoot, '.env')

const sourceUrl = process.env.SOURCE_DATABASE_URL?.trim() || process.env.DATABASE_URL?.trim()
const targetUrl = process.env.NEON_DATABASE_URL?.trim()

function maskUrl(url: string): string {
  try {
    const u = new URL(url)
    if (u.password) u.password = '****'
    return u.toString()
  } catch {
    return '(invalid url)'
  }
}

function assertPostgres(url: string, label: string): void {
  if (!url.startsWith('postgresql://') && !url.startsWith('postgres://')) {
    throw new Error(`${label} must be a PostgreSQL connection string.`)
  }
}

function updateEnvDatabaseUrl(neonUrl: string): void {
  if (!fs.existsSync(envPath)) {
    console.warn(`No ${envPath} — create one with DATABASE_URL set to your Neon URL.`)
    return
  }

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/)
  let replaced = false
  const next = lines.map((line) => {
    if (/^DATABASE_URL=/.test(line)) {
      replaced = true
      return `DATABASE_URL="${neonUrl}"`
    }
    if (/^INSFORGE_/.test(line)) return null
    return line
  }).filter((line): line is string => line !== null)

  if (!replaced) next.unshift(`DATABASE_URL="${neonUrl}"`)
  fs.writeFileSync(envPath, `${next.join('\n').replace(/\n+$/, '')}\n`, 'utf8')
  console.log(`Updated ${envPath} → DATABASE_URL now points at Neon.`)
}

async function clearTarget(db: PrismaClient): Promise<void> {
  console.log('Clearing target database…')
  await db.$transaction([
    db.activityLog.deleteMany(),
    db.feedback.deleteMany(),
    db.offer.deleteMany(),
    db.interview.deleteMany(),
    db.interviewPlanStage.deleteMany(),
    db.interviewPlan.deleteMany(),
    db.candidate.deleteMany(),
    db.vendorRequirement.deleteMany(),
    db.loginHistory.deleteMany(),
    db.user.deleteMany(),
    db.vendor.deleteMany(),
    db.skillCatalog.deleteMany(),
    db.departmentCatalog.deleteMany(),
    db.clientCatalog.deleteMany(),
    db.interviewPanelLevel.deleteMany(),
    db.requirement.deleteMany(),
    db.rolePageAccess.deleteMany(),
  ])
}

async function copyRows<T extends Record<string, unknown>>(
  label: string,
  rows: T[],
  insert: (batch: T[]) => Promise<{ count: number }>
): Promise<void> {
  if (rows.length === 0) {
    console.log(`  ${label}: 0 rows`)
    return
  }
  const batchSize = 500
  let copied = 0
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize)
    const result = await insert(batch)
    copied += result.count
  }
  console.log(`  ${label}: ${copied} row(s)`)
}

async function main() {
  if (!sourceUrl) {
    throw new Error('Set SOURCE_DATABASE_URL or DATABASE_URL in server/.env (current InsForge source).')
  }
  if (!targetUrl) {
    throw new Error(
      'Set NEON_DATABASE_URL to your Neon pooled connection string.\n' +
        'Neon Console → Project → Connect → copy the pooled URL.'
    )
  }

  assertPostgres(sourceUrl, 'SOURCE_DATABASE_URL')
  assertPostgres(targetUrl, 'NEON_DATABASE_URL')

  if (sourceUrl === targetUrl) {
    throw new Error('Source and target DATABASE_URL are the same — refusing to migrate.')
  }

  console.log('Source:', maskUrl(sourceUrl))
  console.log('Target:', maskUrl(targetUrl))

  console.log('\nApplying Prisma schema to Neon (reset)…')
  execSync('npx prisma db push --skip-generate --accept-data-loss --force-reset', {
    cwd: serverRoot,
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: targetUrl },
  })
  try {
    execSync('npx prisma generate', { cwd: serverRoot, stdio: 'inherit' })
  } catch {
    console.warn('prisma generate failed (client may still be usable) — continuing import…')
  }

  const source = new PrismaClient({ datasources: { db: { url: sourceUrl } } })
  const target = new PrismaClient({ datasources: { db: { url: targetUrl } } })

  try {
    const sourceUsers = await source.user.count()
    console.log(`\nSource has ${sourceUsers} user(s). Exporting…`)

    // Schema was reset above; target tables are empty.

    const [
      rolePageAccess,
      skills,
      departments,
      clients,
      panelLevels,
      vendors,
      users,
      loginHistory,
      vendorRequirements,
      requirements,
      candidates,
      interviewPlans,
      interviewPlanStages,
      interviews,
      feedback,
      offers,
      activityLogs,
    ] = await Promise.all([
      source.rolePageAccess.findMany(),
      source.skillCatalog.findMany(),
      source.departmentCatalog.findMany(),
      source.clientCatalog.findMany(),
      source.interviewPanelLevel.findMany(),
      source.vendor.findMany(),
      source.user.findMany(),
      source.loginHistory.findMany(),
      source.vendorRequirement.findMany(),
      source.requirement.findMany(),
      source.candidate.findMany(),
      source.interviewPlan.findMany(),
      source.interviewPlanStage.findMany(),
      source.interview.findMany(),
      source.feedback.findMany(),
      source.offer.findMany(),
      source.activityLog.findMany(),
    ])

    console.log('Importing into Neon…')
    await copyRows('RolePageAccess', rolePageAccess, (b) => target.rolePageAccess.createMany({ data: b }))
    await copyRows('SkillCatalog', skills, (b) => target.skillCatalog.createMany({ data: b }))
    await copyRows('DepartmentCatalog', departments, (b) => target.departmentCatalog.createMany({ data: b }))
    await copyRows('ClientCatalog', clients, (b) => target.clientCatalog.createMany({ data: b }))
    await copyRows('InterviewPanelLevel', panelLevels, (b) => target.interviewPanelLevel.createMany({ data: b }))
    await copyRows('Vendor', vendors, (b) => target.vendor.createMany({ data: b }))
    await copyRows('User', users, (b) => target.user.createMany({ data: b }))
    await copyRows('LoginHistory', loginHistory, (b) => target.loginHistory.createMany({ data: b }))
    await copyRows('VendorRequirement', vendorRequirements, (b) => target.vendorRequirement.createMany({ data: b }))
    await copyRows('Requirement', requirements, (b) => target.requirement.createMany({ data: b }))
    await copyRows('Candidate', candidates, (b) => target.candidate.createMany({ data: b }))
    await copyRows('InterviewPlan', interviewPlans, (b) => target.interviewPlan.createMany({ data: b }))
    await copyRows('InterviewPlanStage', interviewPlanStages, (b) => target.interviewPlanStage.createMany({ data: b }))
    await copyRows('Interview', interviews, (b) => target.interview.createMany({ data: b }))
    await copyRows('Feedback', feedback, (b) => target.feedback.createMany({ data: b }))
    await copyRows('Offer', offers, (b) => target.offer.createMany({ data: b }))
    await copyRows('ActivityLog', activityLogs, (b) => target.activityLog.createMany({ data: b }))

    const targetUsers = await target.user.count()
    console.log(`\nDone. Neon now has ${targetUsers} user(s).`)
    updateEnvDatabaseUrl(targetUrl)
    console.log('\nNext: set the same DATABASE_URL on Render → stitch-ats-api → Environment, then redeploy.')
  } finally {
    await source.$disconnect()
    await target.$disconnect()
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
