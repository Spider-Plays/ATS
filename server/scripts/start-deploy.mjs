import { execSync } from 'node:child_process'

/** QA Render/Neon must not run destructive prisma db push (e.g. main schema vs qa DB). */
function isQaStagingDeploy() {
  if (process.env.ATS_ENV === 'staging') return true
  const signals = [process.env.APP_URL ?? '', process.env.CLIENT_ORIGIN ?? '']
  return signals.some((value) => value.includes('qa.stitch-ats.in'))
}

function run(command) {
  execSync(command, { stdio: 'inherit', env: process.env })
}

if (isQaStagingDeploy()) {
  console.log(
    '[start:deploy] QA staging detected — skipping prisma db push (additive schema via runtime ensure* scripts)'
  )
} else {
  console.log('[start:deploy] Running prisma db push…')
  run('npx prisma db push')
  run('npx prisma generate')
}

run('node dist/index.js')
