import { apiRequest, setToken, clearToken, ApiError } from '../../lib/apiClient'
import { insforge, insforgeConfigured } from '../../lib/insforge'
import { User } from '../../types'
import { PageKey } from '@/permissions'
import type { InsforgeOAuthProvider } from '@/components/portal/InsforgeAuthMethods'

export type AuthSession = {
  user: User
  allowedPages: PageKey[]
}

export type RegisterCandidateResult =
  | AuthSession
  | { status: 'verify_email'; email: string; verifyEmailMethod?: string }

export const CANDIDATE_OAUTH_SIGNUP_KEY = 'candidate_insforge_oauth_signup'
export const CANDIDATE_OAUTH_LOGIN_KEY = 'candidate_insforge_oauth_login'

async function exchangeInsforgeSession(accessToken: string): Promise<AuthSession> {
  const data = await apiRequest<{ token: string; user: User; allowedPages: PageKey[] }>(
    '/auth/exchange',
    {
      method: 'POST',
      body: JSON.stringify({ accessToken }),
    }
  )
  setToken(data.token)
  return { user: data.user, allowedPages: data.allowedPages ?? [] }
}

async function provisionCandidateSession(
  accessToken: string,
  names?: { firstName?: string; lastName?: string }
): Promise<AuthSession> {
  const data = await apiRequest<{ token: string; user: User; allowedPages: PageKey[] }>(
    '/auth/provision-candidate',
    {
      method: 'POST',
      body: JSON.stringify({ accessToken, ...names }),
    }
  )
  setToken(data.token)
  return { user: data.user, allowedPages: data.allowedPages ?? [] }
}

export async function resolveInsforgeAccessToken(): Promise<string> {
  if (!insforge) throw new Error('InsForge auth is not configured')

  await insforge.auth.getCurrentUser()
  const { data, error } = await insforge.auth.refreshSession()
  if (error || !data?.accessToken) {
    throw new Error(error?.message ?? 'No InsForge session found')
  }
  return data.accessToken
}

function portalOriginPath(path: string): string {
  const origin = window.location.origin.replace(/\/$/, '')
  return `${origin}${path}`
}

export const authApi = {
  login: async (email: string, password: string): Promise<AuthSession> => {
    if (insforgeConfigured && insforge) {
      const { data, error } = await insforge.auth.signInWithPassword({ email, password })
      if (!error && data?.accessToken) {
        try {
          return await exchangeInsforgeSession(data.accessToken)
        } catch {
          // ATS profile missing — fall through to legacy login
        }
      }
    }

    const data = await apiRequest<{ token: string; user: User; allowedPages: PageKey[] }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) }
    )
    setToken(data.token)
    return { user: data.user, allowedPages: data.allowedPages ?? [] }
  },

  me: async (): Promise<AuthSession> => {
    const data = await apiRequest<User & { allowedPages?: PageKey[] }>('/auth/me')
    const { allowedPages, ...user } = data
    return { user: user as User, allowedPages: allowedPages ?? [] }
  },

  logout: async () => {
    if (insforgeConfigured && insforge) {
      await insforge.auth.signOut().catch(() => undefined)
    }
    clearToken()
  },

  forgotPassword: (email: string) => {
    if (insforgeConfigured && insforge) {
      const origin = window.location.origin.replace(/\/$/, '')
      return insforge.auth
        .sendResetPasswordEmail({ email, redirectTo: `${origin}/login` })
        .then(({ error }) => {
          if (error) throw new Error(error.message)
          return { ok: true, message: 'If that email exists, a reset link was sent.' }
        })
    }
    return apiRequest<{ ok: boolean; message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  },

  resetPassword: (token: string, newPassword: string) => {
    if (insforgeConfigured && insforge) {
      return insforge.auth.resetPassword({ newPassword, otp: token }).then(({ error }) => {
        if (error) throw new Error(error.message)
        return { ok: true, message: 'Password updated. You can sign in now.' }
      })
    }
    return apiRequest<{ ok: boolean; message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    })
  },

  registerCandidate: async (input: {
    firstName: string
    lastName: string
    email: string
    password: string
  }): Promise<RegisterCandidateResult> => {
    if (insforgeConfigured && insforge) {
      const name = `${input.firstName.trim()} ${input.lastName.trim()}`.trim()
      const { data, error } = await insforge.auth.signUp({
        email: input.email,
        password: input.password,
        name,
        redirectTo: portalOriginPath('/portal/signup'),
      })

      if (error) {
        throw new Error(error.message || 'Registration failed')
      }

      if (data?.requireEmailVerification) {
        return {
          status: 'verify_email',
          email: input.email,
          verifyEmailMethod: data.verifyEmailMethod,
        }
      }

      if (data?.accessToken) {
        return provisionCandidateSession(data.accessToken, {
          firstName: input.firstName,
          lastName: input.lastName,
        })
      }
    }

    const data = await apiRequest<{ token: string; user: User; allowedPages: PageKey[] }>(
      '/auth/register-candidate',
      { method: 'POST', body: JSON.stringify(input) }
    )
    setToken(data.token)
    return { user: data.user, allowedPages: data.allowedPages ?? [] }
  },

  verifyCandidateEmail: async (
    email: string,
    otp: string,
    names: { firstName: string; lastName: string }
  ): Promise<AuthSession> => {
    if (!insforge) throw new Error('InsForge auth is not configured')

    const { data, error } = await insforge.auth.verifyEmail({ email, otp })
    if (error) throw new Error(error.message || 'Verification failed')
    if (!data?.accessToken) throw new Error('Verification succeeded but no session was returned')

    return provisionCandidateSession(data.accessToken, names)
  },

  completeCandidateOAuthSignup: async (
    names?: { firstName?: string; lastName?: string }
  ): Promise<AuthSession> => {
    const accessToken = await resolveInsforgeAccessToken()
    return provisionCandidateSession(accessToken, names)
  },

  completeCandidateOAuthLogin: async (): Promise<AuthSession> => {
    const accessToken = await resolveInsforgeAccessToken()
    try {
      return await exchangeInsforgeSession(accessToken)
    } catch (err) {
      const noProfile =
        err instanceof ApiError &&
        err.status === 403 &&
        err.message.toLowerCase().includes('no ats profile')
      if (noProfile) {
        return provisionCandidateSession(accessToken)
      }
      throw err
    }
  },

  signInCandidateWithOAuth: async (
    provider: InsforgeOAuthProvider,
    redirectPath = '/portal/login'
  ): Promise<void> => {
    if (!insforge) throw new Error('InsForge auth is not configured')

    const { error } = await insforge.auth.signInWithOAuth(provider, {
      redirectTo: portalOriginPath(redirectPath),
    })
    if (error) throw new Error(error.message || 'Could not start social sign-in')
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<AuthSession> => {
    const data = await apiRequest<{ token: string; user: User; allowedPages?: PageKey[] }>(
      '/auth/change-password',
      {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      }
    )
    setToken(data.token)
    return { user: data.user, allowedPages: data.allowedPages ?? [] }
  },
}
