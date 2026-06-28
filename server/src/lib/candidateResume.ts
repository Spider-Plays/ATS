import { renderDemoCandidateResumePdf } from './demoResumePdf.js'
import {
  type CandidateResumeRow,
  readCandidateResumeFromDisk,
  readCandidateResumeFromUrl,
  saveResumeFile,
} from './resumeStorage.js'

function parseSkillList(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : []
  } catch {
    return []
  }
}

export async function loadCandidateResume(
  candidate: CandidateResumeRow
): Promise<{ buffer: Buffer; mime: string; fileName: string } | null> {
  if (!candidate.resumeFileName?.trim()) return null

  const fileName = candidate.resumeFileName
  const mime = candidate.resumeMimeType || 'application/pdf'

  const fromDisk = await readCandidateResumeFromDisk(candidate)
  if (fromDisk) {
    return { buffer: fromDisk.buffer, mime: candidate.resumeMimeType || fromDisk.mime, fileName }
  }

  if (candidate.resumeUrl) {
    const fromUrl = await readCandidateResumeFromUrl(candidate.resumeUrl, candidate.resumeMimeType)
    if (fromUrl) {
      return { buffer: fromUrl.buffer, mime: candidate.resumeMimeType || fromUrl.mime, fileName }
    }
  }

  if (!candidate.resumeText?.trim()) return null

  const buffer = await renderDemoCandidateResumePdf({
    name: candidate.name,
    email: candidate.email,
    role: candidate.role,
    location: candidate.location,
    summary: candidate.resumeText,
    primarySkills: parseSkillList(candidate.primarySkills),
    secondarySkills: parseSkillList(candidate.secondarySkills),
  })

  await saveResumeFile(candidate.id, mime, buffer, fileName, candidate.resumeStorageKey)

  return { buffer, mime, fileName }
}
