import { createClient } from '@insforge/sdk'

const baseUrl = import.meta.env.VITE_INSFORGE_URL as string | undefined
const anonKey = import.meta.env.VITE_INSFORGE_ANON_KEY as string | undefined

export const insforgeConfigured = Boolean(baseUrl && anonKey)

export const insforge = insforgeConfigured
  ? createClient({ baseUrl: baseUrl!, anonKey: anonKey! })
  : null
