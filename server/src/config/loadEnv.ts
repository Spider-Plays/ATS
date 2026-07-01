import dotenv from 'dotenv'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'url'

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const stagingPath = path.join(serverRoot, '.env.staging')
const defaultPath = path.join(serverRoot, '.env')
const stagingExists = fs.existsSync(stagingPath)
const explicitProduction = process.env.ATS_ENV === 'production'
const isDeployed = process.env.NODE_ENV === 'production'

// Local dev defaults to QA (.env.staging). Set ATS_ENV=production to use server/.env.
const useStaging =
  process.env.ATS_ENV === 'staging' ||
  (!explicitProduction && !isDeployed && stagingExists)

const envPath = useStaging && stagingExists ? stagingPath : defaultPath

dotenv.config({ path: envPath })

if (useStaging && stagingExists && process.env.ATS_ENV !== 'production') {
  process.env.ATS_ENV = 'staging'
}

if (process.env.ATS_ENV === 'staging' && !stagingExists) {
  console.warn(
    'ATS_ENV=staging but server/.env.staging is missing — falling back to server/.env (likely production).\n' +
      'Copy the Neon qa branch pooled URL into server/.env.staging, or run:\n' +
      '  $env:STAGING_DATABASE_URL="postgresql://..."; npm run env:qa'
  )
} else if (!explicitProduction && !isDeployed && !stagingExists) {
  console.warn(
    'Local dev: server/.env.staging is missing — using server/.env (production database).\n' +
      'Run: $env:STAGING_DATABASE_URL="postgresql://..."; npm run env:qa'
  )
}

export function databaseHostLabel(): string | null {
  const url = process.env.DATABASE_URL?.trim()
  if (!url) return null
  try {
    return new URL(url).hostname
  } catch {
    return '(invalid DATABASE_URL)'
  }
}
