import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma.js'
import { DEV_PASSWORD } from '../config/devUsers.js'

async function main() {
  const passwordHash = await bcrypt.hash(DEV_PASSWORD, 10)
  const result = await prisma.user.updateMany({
    data: {
      passwordHash,
      mustChangePassword: false,
      passwordResetToken: null,
      passwordResetExpires: null,
    },
  })
  console.log(`Reset password to "${DEV_PASSWORD}" for ${result.count} user(s).`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
