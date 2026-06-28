/**
 * Dev quick-login buttons (Login page only).
 * Synced with server/src/config/devUsers.registry.json — run `npm run db:seed` in server/.
 */
import registry from '../../server/src/config/devUsers.registry.json'
import { DEV_LOGIN_PASSWORD } from './devCredentials'

export const DEV_LOGIN_ACCOUNTS = registry.map((u) => ({
  label: u.name,
  role: u.role,
  email: u.email,
  password: DEV_LOGIN_PASSWORD,
  primary: u.primary ?? false,
})) as readonly {
  label: string
  role: string
  email: string
  password: string
  primary: boolean
}[]
