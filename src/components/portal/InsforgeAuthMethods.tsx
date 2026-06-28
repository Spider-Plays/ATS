import React, { useState } from 'react'
import { insforge, insforgeConfigured } from '@/lib/insforge'

export type InsforgeOAuthProvider = 'google' | 'github' | 'microsoft' | 'linkedin'

const PROVIDERS: { id: InsforgeOAuthProvider; label: string }[] = [
  { id: 'google', label: 'Google' },
  { id: 'github', label: 'GitHub' },
  { id: 'microsoft', label: 'Microsoft' },
  { id: 'linkedin', label: 'LinkedIn' },
]

type InsforgeAuthMethodsProps = {
  redirectPath: string
  oauthSessionKey: string
  disabled?: boolean
  onError: (message: string) => void
}

export function InsforgeAuthMethods({
  redirectPath,
  oauthSessionKey,
  disabled,
  onError,
}: InsforgeAuthMethodsProps) {
  const [loadingProvider, setLoadingProvider] = useState<InsforgeOAuthProvider | null>(null)

  if (!insforgeConfigured || !insforge) return null

  const startOAuth = async (provider: InsforgeOAuthProvider) => {
    setLoadingProvider(provider)
    onError('')
    try {
      const origin = window.location.origin.replace(/\/$/, '')
      sessionStorage.setItem(oauthSessionKey, '1')
      const { error } = await insforge.auth.signInWithOAuth(provider, {
        redirectTo: `${origin}${redirectPath}`,
      })
      if (error) {
        sessionStorage.removeItem(oauthSessionKey)
        onError(error.message || 'Could not start social sign-in')
        setLoadingProvider(null)
      }
    } catch {
      sessionStorage.removeItem(oauthSessionKey)
      onError('Could not start social sign-in')
      setLoadingProvider(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-slate-50 px-3 font-bold text-slate-500">Or continue with</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {PROVIDERS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            disabled={disabled || loadingProvider !== null}
            onClick={() => void startOAuth(id)}
            className="flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 hover:border-[#0f3d38]/30 hover:bg-slate-50 disabled:opacity-60"
          >
            {loadingProvider === id ? (
              <span className="size-4 border-2 border-slate-300 border-t-[#0f3d38] rounded-full animate-spin" />
            ) : (
              label
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
