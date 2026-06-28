import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AlertCircle } from 'lucide-react'
import {
  authApi,
  CANDIDATE_OAUTH_SIGNUP_KEY,
  RegisterCandidateResult,
} from '@/services/http/auth'
import { ApiError } from '@/lib/apiClient'
import { insforgeConfigured } from '@/lib/insforge'
import { useAuth } from '@/hooks/useAuth'
import { CandidateAuthShell } from '@/components/portal/CandidateAuthShell'
import { InsforgeAuthMethods } from '@/components/portal/InsforgeAuthMethods'
import './signup.css'

const schema = z
  .object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Enter a valid email'),
    password: z.string().min(8, 'At least 8 characters'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type FormValues = z.infer<typeof schema>

function isAuthSession(result: RegisterCandidateResult): result is Extract<
  RegisterCandidateResult,
  { user: unknown }
> {
  return 'user' in result
}

const CandidateSignup = () => {
  const navigate = useNavigate()
  const { refreshUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [verifyEmail, setVerifyEmail] = useState<string | null>(null)
  const [verifyOtp, setVerifyOtp] = useState('')
  const [pendingNames, setPendingNames] = useState<{ firstName: string; lastName: string } | null>(
    null
  )

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const finishSignup = async (result: RegisterCandidateResult) => {
    if (!isAuthSession(result)) return
    await refreshUser()
    navigate('/portal/onboarding', { replace: true })
  }

  useEffect(() => {
    if (!insforgeConfigured) return
    if (!sessionStorage.getItem(CANDIDATE_OAUTH_SIGNUP_KEY)) return

    void (async () => {
      setLoading(true)
      setAuthError(null)
      try {
        const session = await authApi.completeCandidateOAuthSignup()
        sessionStorage.removeItem(CANDIDATE_OAUTH_SIGNUP_KEY)
        await finishSignup(session)
      } catch (err: unknown) {
        sessionStorage.removeItem(CANDIDATE_OAUTH_SIGNUP_KEY)
        setAuthError(
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : 'Social sign-up could not be completed'
        )
      } finally {
        setLoading(false)
      }
    })()
  }, [navigate, refreshUser])

  const onSubmit = async (data: FormValues) => {
    setLoading(true)
    setAuthError(null)
    try {
      const result = await authApi.registerCandidate({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
      })

      if (!isAuthSession(result)) {
        setVerifyEmail(result.email)
        setPendingNames({ firstName: data.firstName, lastName: data.lastName })
        return
      }

      await finishSignup(result)
    } catch (err: unknown) {
      setAuthError(err instanceof ApiError ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const onVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!verifyEmail || !pendingNames) return

    setLoading(true)
    setAuthError(null)
    try {
      const session = await authApi.verifyCandidateEmail(verifyEmail, verifyOtp, pendingNames)
      await finishSignup(session)
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <CandidateAuthShell
      title={verifyEmail ? 'Verify your email' : 'Create your account'}
      subtitle={
        verifyEmail
          ? 'Enter the 6-digit code we sent to your email to finish creating your account.'
          : 'Register once, complete your profile, and apply to open roles.'
      }
      footer={
        <p className="text-center text-sm text-slate-600">
          Already registered?{' '}
          <Link to="/portal/login" className="font-bold text-[#0f3d38] hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      {authError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 text-sm">
          <AlertCircle size={18} className="shrink-0" />
          {authError}
        </div>
      )}

      {verifyEmail ? (
        <form onSubmit={onVerifyEmail} className="space-y-4">
          <p className="text-sm text-slate-600">
            Code sent to <span className="font-bold text-slate-800">{verifyEmail}</span>
          </p>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Verification code</label>
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              required
              value={verifyOtp}
              onChange={(e) => setVerifyOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 font-medium tracking-[0.3em] text-center"
              placeholder="000000"
            />
          </div>
          <button
            type="submit"
            disabled={loading || verifyOtp.length !== 6}
            className="w-full py-3.5 bg-[#0f3d38] text-white rounded-xl font-bold text-sm hover:bg-[#0c322e] flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <span className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Verify and continue'
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setVerifyEmail(null)
              setVerifyOtp('')
              setPendingNames(null)
              setAuthError(null)
            }}
            className="w-full text-sm font-bold text-slate-500 hover:text-[#0f3d38]"
          >
            Back to registration
          </button>
        </form>
      ) : (
        <>
          <InsforgeAuthMethods
            redirectPath="/portal/signup"
            oauthSessionKey={CANDIDATE_OAUTH_SIGNUP_KEY}
            disabled={loading}
            onError={setAuthError}
          />

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">First name</label>
                <input
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 font-medium"
                  {...register('firstName')}
                />
                {errors.firstName && (
                  <p className="text-xs text-red-600 font-medium">{errors.firstName.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Last name</label>
                <input
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 font-medium"
                  {...register('lastName')}
                />
                {errors.lastName && (
                  <p className="text-xs text-red-600 font-medium">{errors.lastName.message}</p>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Email</label>
              <input
                type="email"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 font-medium"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-red-600 font-medium">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Password</label>
              <input
                type="password"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 font-medium"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-xs text-red-600 font-medium">{errors.password.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Confirm password</label>
              <input
                type="password"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 font-medium"
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-red-600 font-medium">{errors.confirmPassword.message}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#0f3d38] text-white rounded-xl font-bold text-sm hover:bg-[#0c322e] flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Create account with email
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </>
              )}
            </button>
          </form>
        </>
      )}
    </CandidateAuthShell>
  )
}

export default CandidateSignup
