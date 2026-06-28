import 'dotenv/config'

const insforgeUrl = process.env.INSFORGE_URL?.trim() || ''
const insforgeApiKey = process.env.INSFORGE_API_KEY?.trim() || ''
const insforgeAnonKey = process.env.INSFORGE_ANON_KEY?.trim() || ''

export const insforgeEnv = {
  url: insforgeUrl,
  apiKey: insforgeApiKey,
  anonKey: insforgeAnonKey,
  isConfigured: Boolean(insforgeUrl && insforgeApiKey),
  useStorage: Boolean(insforgeUrl && insforgeApiKey),
  authEnabled: Boolean(insforgeUrl && insforgeApiKey && insforgeAnonKey),
}
