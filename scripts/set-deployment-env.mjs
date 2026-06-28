import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function parseSecretValue(raw) {
  const line = raw.split(/\r?\n/).find((l) => l.trim())?.trim() ?? ''
  if (line.includes('=')) {
    return line.split('=').slice(1).join('=').trim().replace(/^["']|["']$/g, '')
  }
  return line.replace(/^["']|["']$/g, '')
}

const apiBaseUrl = 'https://stitch-ats-api-6dd11de4-0043-4523-80ec-1b8755a5d51c.fly.dev'

const project = JSON.parse(readFileSync(path.join(root, '.insforge', 'project.json'), 'utf8'))
const anonKey = parseSecretValue(
  execSync('npx @insforge/cli secrets get ANON_KEY', { cwd: root, encoding: 'utf8' })
)

execSync(`npx @insforge/cli deployments env set VITE_INSFORGE_URL "${project.oss_host}"`, {
  cwd: root,
  stdio: 'inherit',
})
execSync(`npx @insforge/cli deployments env set VITE_INSFORGE_ANON_KEY "${anonKey}"`, {
  cwd: root,
  stdio: 'inherit',
})
execSync(`npx @insforge/cli deployments env set VITE_API_BASE_URL "${apiBaseUrl}"`, {
  cwd: root,
  stdio: 'inherit',
})

console.log('Deployment env vars set.')
