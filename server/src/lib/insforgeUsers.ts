import { createClient } from '@insforge/sdk'
import { insforgeEnv } from '../config/insforge.js'

export async function ensureInsforgeAuthUser(
  email: string,
  password: string,
  name: string
): Promise<void> {
  if (!insforgeEnv.authEnabled) return

  const client = createClient({
    baseUrl: insforgeEnv.url,
    anonKey: insforgeEnv.anonKey,
  })

  const { error } = await client.auth.signUp({
    email: email.toLowerCase(),
    password,
    name,
  })

  if (!error) return

  const message = error.message?.toLowerCase() ?? ''
  if (message.includes('already') || message.includes('exists') || error.statusCode === 409) {
    return
  }

  console.warn(`InsForge signUp skipped for ${email}: ${error.message}`)
}
