import { createClient } from '@insforge/sdk'
import { insforgeEnv } from '../config/insforge.js'

export async function resolveInsforgeUser(accessToken: string) {
  if (!insforgeEnv.isConfigured || !insforgeEnv.anonKey) {
    throw new Error('InsForge auth is not configured on the server')
  }

  const client = createClient({
    baseUrl: insforgeEnv.url,
    anonKey: insforgeEnv.anonKey,
    accessToken,
  })

  const { data, error } = await client.auth.getCurrentUser()
  if (error || !data?.user?.email) {
    return null
  }

  return data.user
}
