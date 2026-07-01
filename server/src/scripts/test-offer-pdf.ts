import '../config/loadEnv.js'
import { prisma } from '../lib/prisma.js'
import { loadOfferLetterContext } from '../lib/offerActions.js'
import { renderHtmlToPdf, closePdfBrowser } from '../lib/offerPdf.js'

const email = process.argv[2] ?? 'candidate@stitch-ats.in'

async function main() {
  const candidate = await prisma.candidate.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
    orderBy: { updatedAt: 'desc' },
  })
  if (!candidate) {
    console.error('No candidate found')
    process.exit(1)
  }

  const offer = await prisma.offer.findFirst({
    where: { candidateId: candidate.id },
    orderBy: { createdAt: 'desc' },
  })
  if (!offer) {
    console.error('No offer found')
    process.exit(1)
  }

  const ctx = await loadOfferLetterContext(offer.id)
  console.log('offer id:', offer.id)
  console.log('html length:', ctx?.letterHtml?.length ?? 0)

  try {
    const pdf = await renderHtmlToPdf(ctx!.letterHtml)
    console.log('pdf bytes:', pdf.length)
  } catch (err) {
    console.error('PDF generation failed:', err)
    process.exit(1)
  }
}

main()
  .finally(async () => {
    await closePdfBrowser()
    await prisma.$disconnect()
  })
