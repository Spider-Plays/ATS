import 'dotenv/config'
import { m365Config } from '../integrations/m365/config.js'

const isProduction = process.env.NODE_ENV === 'production'

function resolveJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim()
  if (isProduction) {
    if (!secret || secret.length < 32) {
      throw new Error(
        'JWT_SECRET must be set to a strong random string (32+ characters) in production.'
      )
    }
    return secret
  }
  return secret || 'dev-secret'
}

function parseClientOrigins(raw: string): string[] {
  return raw
    .split(',')
    .map((value) => value.trim().replace(/\/$/, ''))
    .filter(Boolean)
}

const DEFAULT_PRODUCTION_APP_URL = 'https://stitch-ats.in'

/** Single app URL for email links — not the full comma-separated CORS list. */
function resolvePrimaryClientOrigin(origins: string[]): string {
  if (origins.length === 0) return 'http://localhost:3000'
  if (origins.length === 1) return origins[0]

  const isLocal = (origin: string) =>
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)

  const httpsOrigins = origins.filter(
    (origin) => origin.startsWith('https://') && !isLocal(origin)
  )

  if (httpsOrigins.length > 0) {
    // Prefer the production custom domain over Cloudflare preview URLs.
    const customDomain = httpsOrigins.find(
      (origin) => !/\.pages\.dev$/.test(origin) && !/\.workers\.dev$/.test(origin)
    )
    return customDomain ?? httpsOrigins[0]
  }

  const local = origins.find(isLocal)
  return local ?? origins[0]
}

function isUsablePublicAppUrl(url: string): boolean {
  return (
    url.startsWith('https://') &&
    !/^https:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(url) &&
    !url.includes(',')
  )
}

function resolveClientOrigin(origins: string[]): string {
  const explicit = process.env.APP_URL?.trim().replace(/\/$/, '')
  if (explicit) return explicit

  const resolved = resolvePrimaryClientOrigin(origins)
  if (isProduction && !isUsablePublicAppUrl(resolved)) {
    return DEFAULT_PRODUCTION_APP_URL
  }
  return resolved
}

const clientOrigins = parseClientOrigins(process.env.CLIENT_ORIGIN || 'http://localhost:3000')

export const env = {
  isProduction,
  port: Number(process.env.PORT) || 4000,
  jwtSecret: resolveJwtSecret(),
  clientOrigin: resolveClientOrigin(clientOrigins),
  clientOrigins,
  resendApiKey: process.env.RESEND_API_KEY || '',
  emailFrom: process.env.EMAIL_FROM || 'Stitch ATS <onboarding@resend.dev>',
  appName: process.env.APP_NAME || 'Stitch ATS',
  offerExecApprovalThreshold: Number(process.env.OFFER_EXEC_APPROVAL_THRESHOLD) || 2500000,
  m365: m365Config,
}
