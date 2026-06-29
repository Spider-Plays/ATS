#!/usr/bin/env node
/**
 * Smoke-check QA staging isolation (frontend proxy + staging API).
 *
 * Usage:
 *   npm run verify:qa-staging
 *   QA_ORIGIN=https://qa.stitch-ats.in STAGING_API_ORIGIN=https://stitch-ats-api-staging.onrender.com npm run verify:qa-staging
 */
const QA_ORIGIN = (process.env.QA_ORIGIN || 'https://qa.stitch-ats.in').replace(/\/$/, '')
const STAGING_API_ORIGIN = (
  process.env.STAGING_API_ORIGIN || 'https://ats-0dtj.onrender.com'
).replace(/\/$/, '')
const PROD_API_ORIGIN = (process.env.PROD_API_ORIGIN || 'https://stitch-ats.onrender.com').replace(
  /\/$/,
  ''
)

const checks = []

async function check(name, fn) {
  try {
    await fn()
    checks.push({ name, ok: true })
    console.log(`✓ ${name}`)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    checks.push({ name, ok: false, message })
    console.log(`✗ ${name}: ${message}`)
  }
}

async function fetchJson(url, init) {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(60_000) })
  const text = await res.text()
  let body
  try {
    body = JSON.parse(text)
  } catch {
    body = text.slice(0, 200)
  }
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText} — ${typeof body === 'string' ? body : JSON.stringify(body)}`)
  }
  return body
}

await check('QA frontend loads', async () => {
  const res = await fetch(QA_ORIGIN, { signal: AbortSignal.timeout(60_000) })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  const html = await res.text()
  if (!html.includes('root') && !html.includes('Stitch')) {
    throw new Error('Unexpected HTML (not the SPA shell)')
  }
})

await check('QA /api/health via Pages proxy', async () => {
  const body = await fetchJson(`${QA_ORIGIN}/api/health`)
  if (!body?.ok || body?.database !== 'connected') {
    throw new Error(`Unexpected health payload: ${JSON.stringify(body)}`)
  }
})

await check('Staging API direct health', async () => {
  const body = await fetchJson(`${STAGING_API_ORIGIN}/api/health`)
  if (!body?.ok || body?.database !== 'connected') {
    throw new Error(`Unexpected health payload: ${JSON.stringify(body)}`)
  }
})

await check('Production API still healthy (unchanged)', async () => {
  const body = await fetchJson(`${PROD_API_ORIGIN}/api/health`)
  if (!body?.ok || body?.database !== 'connected') {
    throw new Error(`Unexpected health payload: ${JSON.stringify(body)}`)
  }
})

const failed = checks.filter((c) => !c.ok)
console.log(`\n${checks.length - failed.length}/${checks.length} checks passed`)
if (failed.length) {
  console.log('\nFailed checks usually mean dashboard setup is incomplete:')
  console.log('  - Neon staging branch + Render stitch-ats-api-staging')
  console.log('  - Cloudflare Pages Preview API_ORIGIN → staging API')
  console.log('  - Custom domain qa.stitch-ats.in on Preview environment')
  process.exit(1)
}
