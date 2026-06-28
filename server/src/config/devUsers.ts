/** Dev / demo accounts. Seeded via `npm run db:seed` and `npm run db:seed-demo`. */
import registry from './devUsers.registry.json' with { type: 'json' }

export const STITCH_EMAIL_DOMAIN = 'Stitch.com'

export const DEV_PASSWORD = 'password'

type DevUserRegistryEntry = (typeof registry)[number]

export type DevUserRole = DevUserRegistryEntry['role']

export const DEV_USERS = registry.map((u) => ({
  email: u.email,
  password: DEV_PASSWORD,
  name: u.name,
  role: u.role,
  ...('department' in u && u.department ? { department: u.department } : {}),
  ...(u.primary ? { primary: true as const } : {}),
})) as readonly {
  email: string
  password: string
  name: string
  role: DevUserRole
  department?: string
  primary?: true
}[]

export function devUsersForRole(role: DevUserRole): (typeof DEV_USERS)[number][] {
  return DEV_USERS.filter((u) => u.role === role)
}

export function devUserEmail(role: DevUserRole): string {
  const user =
    DEV_USERS.find((u) => u.role === role && u.primary) ?? DEV_USERS.find((u) => u.role === role)
  if (!user) throw new Error(`Unknown dev role: ${role}`)
  return user.email.toLowerCase()
}

export function devUserName(role: DevUserRole): string {
  const user =
    DEV_USERS.find((u) => u.role === role && u.primary) ?? DEV_USERS.find((u) => u.role === role)
  if (!user) throw new Error(`Unknown dev role: ${role}`)
  return user.name
}
