import dotenv from 'dotenv'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'url'

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const useStaging = process.env.ATS_ENV === 'staging'
const stagingPath = path.join(serverRoot, '.env.staging')
const defaultPath = path.join(serverRoot, '.env')

const envPath =
  useStaging && fs.existsSync(stagingPath) ? stagingPath : defaultPath

dotenv.config({ path: envPath })

if (useStaging && !fs.existsSync(stagingPath)) {
  console.warn(
    'ATS_ENV=staging but server/.env.staging is missing — falling back to server/.env (likely production).\n' +
      'Copy the Neon qa branch pooled URL into server/.env.staging, or run:\n' +
      '  $env:STAGING_DATABASE_URL="postgresql://..."; npm run env:qa'
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
