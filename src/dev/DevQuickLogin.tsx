import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { DEV_LOGIN_ACCOUNTS } from './devLoginAccounts'
import { DEV_LOGIN_PASSWORD } from './devCredentials'
import { resolveDevLoginRedirect } from './resolveDevLoginRedirect'
import { ApiError } from '../lib/apiClient'
import { isReferralPortalRole, INTERNAL_STAFF_ROLES, type PageKey } from '@/permissions'
import type { User } from '../types'
import clsx from 'clsx'

export type DevQuickLoginSession = {
  user: User
  allowedPages: PageKey[]
}

type DevQuickLoginProps = {
  onError: (message: string) => void
  /** Prefer this: SPA navigation after login (avoids reload races). */
  onLoggedIn?: (session: DevQuickLoginSession) => void
  /** @deprecated Use onLoggedIn */
  onSuccess?: () => void
  /** Show only accounts for this role (e.g. candidate portal login). */
  filterRole?: string
  /** Show all staff + employee accounts (excludes candidate and vendor). */
  referralPortalOnly?: boolean
  /** Show one primary account per role (canonical demo emails). */
  primaryOnly?: boolean
  /** Team login only — hide candidate, vendor, and employee portal accounts. */
  staffOnly?: boolean
}

export function DevQuickLogin({
  onError,
  onLoggedIn,
  onSuccess,
  filterRole,
  referralPortalOnly,
  primaryOnly,
  staffOnly,
}: DevQuickLoginProps) {
  const navigate = useNavigate()
  const staffRoleSet = new Set<string>(INTERNAL_STAFF_ROLES)
  const accounts = DEV_LOGIN_ACCOUNTS.filter((account) => {
    if (filterRole && account.role !== filterRole) return false
    if (referralPortalOnly && !isReferralPortalRole(account.role)) return false
    if (staffOnly && !staffRoleSet.has(account.role)) return false
    if (primaryOnly && !account.primary) return false
    return true
  })
  const { login } = useAuth()
  const [loadingEmail, setLoadingEmail] = useState<string | null>(null)

  const handleQuickLogin = async (email: string, password: string, role: string) => {
    setLoadingEmail(email)
    onError('')
    try {
      const session = await login(email, password)
      const path = resolveDevLoginRedirect(session, role)

      if (onLoggedIn) {
        onLoggedIn(session)
      } else if (onSuccess) {
        onSuccess()
      } else {
        navigate(path, { replace: true })
      }
    } catch (err: unknown) {
      const code = err instanceof Error ? err.message : ''
      if (err instanceof ApiError) {
        if (err.status === 503 || err.message.toLowerCase().includes('database')) {
          onError(
            'Database unavailable. Wake your Neon project at console.neon.tech, then run: npm run db:seed --prefix server'
          )
        } else if (err.status === 401) {
          onError(
            'Invalid credentials — run: npm run db:seed --prefix server'
          )
        } else if (err.status === 0 || err.message.includes('fetch')) {
          onError(
            'Cannot reach API. Run npm run dev from the project root (client + server). Clear VITE_API_BASE_URL in .env if set, then restart.'
          )
        } else {
          onError(err.message)
        }
      } else if (
        code === 'SERVER_UNAVAILABLE' ||
        code === 'Cannot reach API' ||
        code.includes('Failed to fetch')
      ) {
        onError(
          'Cannot reach API. Run npm run dev from the project root — you need both the Vite app (port 3000) and API (port 4000).'
        )
      } else if (code === 'INVALID_CREDENTIALS') {
        onError('Invalid credentials — run: npm run db:seed --prefix server')
      } else if (code === 'ACCOUNT_DISABLED') {
        onError('This account has been disabled.')
      } else {
        onError(
          'Login failed — run npm run db:seed --prefix server (retry if Neon was sleeping).'
        )
      }
    } finally {
      setLoadingEmail(null)
    }
  }

  if (accounts.length === 0) {
    return null
  }

  return (
    <div className="rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50/80 dark:bg-amber-950/30 p-4 space-y-3">
      <div className="flex items-start gap-2">
        <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 !text-lg shrink-0">
          developer_mode
        </span>
        <div>
          <p className="text-xs font-black text-amber-900 dark:text-amber-200 uppercase tracking-wider">
            Dev quick login
          </p>
          <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 mt-0.5">
            Password for all: <span className="font-mono font-bold">{DEV_LOGIN_PASSWORD}</span> — seed with{' '}
            <span className="font-mono">npm run db:seed --prefix server</span>
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-0.5">
        {accounts.map((account) => (
          <button
            key={account.email}
            type="button"
            disabled={loadingEmail !== null}
            onClick={() =>
              handleQuickLogin(account.email, account.password, account.role)
            }
            className={clsx(
              'px-2.5 py-2 rounded-lg text-left border transition-all',
              'border-amber-300/60 dark:border-amber-700/60',
              'bg-white/80 dark:bg-white/5 text-amber-950 dark:text-amber-100',
              'hover:bg-amber-100 dark:hover:bg-amber-900/40',
              'disabled:opacity-50',
              loadingEmail === account.email && 'animate-pulse'
            )}
          >
            <span className="block text-[10px] font-bold uppercase tracking-wide text-amber-700/90 dark:text-amber-300/90">
              {account.role.replace(/_/g, ' ')}
            </span>
            <span className="block text-xs font-bold truncate">{account.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
