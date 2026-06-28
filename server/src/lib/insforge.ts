import { createAdminClient } from '@insforge/sdk'
import { insforgeEnv } from '../config/insforge.js'

let adminClient: ReturnType<typeof createAdminClient> | null = null

export function getInsforgeAdmin() {
  if (!insforgeEnv.isConfigured) {
    throw new Error('InsForge is not configured (set INSFORGE_URL and INSFORGE_API_KEY)')
  }
  if (!adminClient) {
    adminClient = createAdminClient({
      baseUrl: insforgeEnv.url,
      apiKey: insforgeEnv.apiKey,
    })
  }
  return adminClient
}

export const RESUME_BUCKET = 'resumes'
