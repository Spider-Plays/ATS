import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const neonUrl = process.env.NEON_DATABASE_URL?.trim()
if (!neonUrl) {
  console.error('Set NEON_DATABASE_URL')
  process.exit(1)
}

const envPath = path.join(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'), '.env')
const lines = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8').split(/\r?\n/) : []
let replaced = false
const next = lines
  .filter((line) => !/^INSFORGE_/.test(line))
  .map((line) => {
    if (/^DATABASE_URL=/.test(line)) {
      replaced = true
      return `DATABASE_URL="${neonUrl}"`
    }
    return line
  })
if (!replaced) next.unshift(`DATABASE_URL="${neonUrl}"`)
fs.writeFileSync(envPath, `${next.join('\n').replace(/\n+$/, '')}\n`, 'utf8')
console.log('Updated server/.env → Neon')
