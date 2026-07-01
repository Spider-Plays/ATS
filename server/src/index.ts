import { databaseHostLabel } from './config/loadEnv.js'
import { app } from './app.js'
import { env } from './config/env.js'
import { assertPrismaClientModels, prisma } from './lib/prisma.js'
import { ensureCandidateMilestoneColumns } from './lib/ensureCandidateMilestoneColumns.js'
import { ensureReferralColumns } from './lib/ensureReferralColumns.js'
import { ensureOfferApprovalChainColumn } from './lib/ensureOfferApprovalChainColumn.js'
import { ensureBusinessRequirementTable } from './lib/ensureBusinessRequirementTable.js'
import { ensureRequirementAccountManagerColumn } from './lib/ensureRequirementAccountManagerColumn.js'
import { ensurePrimaryDevUsers } from './lib/ensurePrimaryDevUsers.js'
import { ensureRolePageAccessPatches } from './lib/ensureRolePageAccessPatches.js'
import { ensureAppSettingTable } from './lib/ensureAppSettingTable.js'
import { startInterviewReminderJob } from './lib/emailDispatch.js'
import { startCandidateScreeningJob } from './lib/candidateStatuses.js'

try {
  assertPrismaClientModels()
} catch (e) {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
}

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection (API still running):', reason)
})

async function prepareDatabase(): Promise<void> {
  await prisma.$queryRaw`SELECT 1`
  console.log('Database connected')
  await ensureCandidateMilestoneColumns()
  await ensureReferralColumns()
  await ensureAppSettingTable()
  await ensureOfferApprovalChainColumn()
  await ensureBusinessRequirementTable()
  await ensureRequirementAccountManagerColumn()
  await ensurePrimaryDevUsers()
  await ensureRolePageAccessPatches()
  startInterviewReminderJob()
  startCandidateScreeningJob()
}

async function start(): Promise<void> {
  try {
    await prepareDatabase()
  } catch (e) {
    console.warn(
      'Database not reachable or schema prep failed — some routes may error until Neon is awake:',
      e instanceof Error ? e.message : e
    )
  }

  const dbHost = databaseHostLabel()
  const envLabel = process.env.ATS_ENV === 'staging' ? 'QA staging' : 'default (.env)'
  const server = app.listen(env.port, () => {
    console.log(`API running at http://localhost:${env.port} [${envLabel}${dbHost ? ` → ${dbHost}` : ''}]`)
  })

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${env.port} is already in use. Stop the other process or change PORT in server/.env`)
      process.exit(1)
    }
    throw err
  })
}

start().catch((e) => {
  console.error('Failed to start API:', e instanceof Error ? e.message : e)
  process.exit(1)
})
