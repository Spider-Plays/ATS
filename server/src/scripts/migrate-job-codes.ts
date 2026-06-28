import { prisma } from '../lib/prisma.js'
import { migrateRequirementJobCodes } from '../lib/jobCode.js'

async function main() {
  const result = await migrateRequirementJobCodes()
  console.log('Requirement job code migration complete:')
  console.log(`  Total: ${result.total}`)
  console.log(`  Updated: ${result.updated}`)
  console.log(`  Already standard: ${result.unchanged}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
