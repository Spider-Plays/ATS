/**
 * Ensure candidate@stitch-ats.in has a SENT offer visible on the candidate portal.
 * Usage: npx tsx src/scripts/seed-portal-offer.ts [email]
 */
import '../config/loadEnv.js'
import { prisma } from '../lib/prisma.js'
import { loadOfferLetterContext } from '../lib/offerActions.js'

const CANDIDATE_EMAIL = (process.argv[2] ?? 'candidate@stitch-ats.in').toLowerCase()

async function main() {
  const candidate = await prisma.candidate.findFirst({
    where: { email: { equals: CANDIDATE_EMAIL, mode: 'insensitive' } },
    orderBy: { updatedAt: 'desc' },
  })

  if (!candidate) {
    console.error(`No candidate found for ${CANDIDATE_EMAIL}`)
    process.exit(1)
  }

  if (!candidate.requirementId) {
    console.error(`Candidate ${CANDIDATE_EMAIL} has no linked requirement. Apply to a job first.`)
    process.exit(1)
  }

  const recruiter = await prisma.user.findFirst({
    where: { role: 'RECRUITER', status: 'ACTIVE' },
    orderBy: { createdAt: 'asc' },
  })
  const createdBy = recruiter?.id ?? 'seed-portal-offer'

  const annualCtc = 2_800_000
  const validUntil = new Date()
  validUntil.setDate(validUntil.getDate() + 14)

  let offer = await prisma.offer.findFirst({
    where: { candidateId: candidate.id },
    orderBy: { createdAt: 'desc' },
  })

  const history = [
    { action: 'CREATED', at: new Date().toISOString(), by: createdBy },
    { action: 'SENT', at: new Date().toISOString(), by: createdBy },
  ]

  if (offer) {
    offer = await prisma.offer.update({
      where: { id: offer.id },
      data: {
        status: 'SENT',
        baseSalary: annualCtc,
        annualCtc,
        bonus: 200_000,
        sentAt: new Date(),
        validUntil,
        respondedAt: null,
        respondedBy: null,
        history: JSON.stringify(history),
        updatedAt: new Date(),
      },
    })
    console.log(`Updated existing offer ${offer.id} to SENT`)
  } else {
    offer = await prisma.offer.create({
      data: {
        candidateId: candidate.id,
        requirementId: candidate.requirementId,
        baseSalary: annualCtc,
        annualCtc,
        bonus: 200_000,
        status: 'SENT',
        sentAt: new Date(),
        validUntil,
        createdBy,
        history: JSON.stringify(history),
      },
    })
    console.log(`Created offer ${offer.id} with status SENT`)
  }

  const ctx = await loadOfferLetterContext(offer.id)
  if (ctx?.letterHtml) {
    await prisma.offer.update({
      where: { id: offer.id },
      data: { letterHtml: ctx.letterHtml },
    })
  }

  if (candidate.status !== 'OFFER' && candidate.status !== 'HIRED') {
    await prisma.candidate.update({
      where: { id: candidate.id },
      data: { status: 'OFFER' },
    })
    console.log(`Set candidate pipeline status to OFFER`)
  }

  console.log('')
  console.log(`Candidate: ${candidate.name} <${candidate.email}>`)
  console.log(`Requirement: ${candidate.requirementId}`)
  console.log(`Portal: /candidate/offers/${offer.id}`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
