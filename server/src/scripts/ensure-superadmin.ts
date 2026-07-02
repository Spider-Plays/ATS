import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma.js'
import { DEV_PASSWORD, devUserEmail, devUserName } from '../config/devUsers.js'

/**
 * Idempotently provisions the primary Super Admin login.
 *
 * Unlike `db:seed` (which refuses to run in production and creates the full demo
 * roster), this script only ensures a single SUPER_ADMIN account exists, so it is
 * safe to run against any environment — including production — to guarantee the
 * team always has a working super-admin login.
 *
 * Defaults come from `devUsers.registry.json` (superadmin@stitch-ats.in / password)
 * and can be overridden via env vars.
 */
async function main() {
  const email = (process.env.SUPERADMIN_EMAIL?.trim() || devUserEmail('SUPER_ADMIN')).toLowerCase()
  const password = process.env.SUPERADMIN_PASSWORD?.trim() || DEV_PASSWORD
  const name = process.env.SUPERADMIN_NAME?.trim() || devUserName('SUPER_ADMIN')

  const passwordHash = await bcrypt.hash(password, 10)

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      role: 'SUPER_ADMIN',
      passwordHash,
      status: 'ACTIVE',
      mustChangePassword: false,
      passwordResetToken: null,
      passwordResetExpires: null,
    },
    create: {
      email,
      passwordHash,
      name,
      role: 'SUPER_ADMIN',
      department: 'Operations',
      status: 'ACTIVE',
      permissions: '[]',
      themePreference: 'system',
      authProvider: 'local',
      mustChangePassword: false,
    },
  })

  console.log(`SUPER_ADMIN ready: ${user.email}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
