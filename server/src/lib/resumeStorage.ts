import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import { insforgeEnv } from '../config/insforge.js'
import { getInsforgeAdmin, RESUME_BUCKET } from './insforge.js'

export const RESUME_UPLOAD_DIR =
  process.env.RESUME_UPLOAD_DIR || path.join(os.tmpdir(), 'stitch-ats-resumes')

const ALLOWED_MIME = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

const ALLOWED_EXT = new Set(['.pdf', '.doc', '.docx'])

const EXT_BY_MIME: Record<string, string> = {
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
}

const MIME_BY_EXT: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
}

export type StoredResume = {
  mime: string
  filePath?: string
  storageKey?: string
  url?: string
}

export function isAllowedResumeFile(mime: string, filename: string): boolean {
  const ext = path.extname(filename).toLowerCase()
  if (ALLOWED_EXT.has(ext)) return true
  return ALLOWED_MIME.has(mime)
}

export function resolveResumeMime(mime: string, filename: string): string {
  if (mime && mime !== 'application/octet-stream' && ALLOWED_MIME.has(mime)) return mime
  const ext = path.extname(filename).toLowerCase()
  return MIME_BY_EXT[ext] || mime
}

export function resumeExtension(mime: string, filename?: string): string {
  if (EXT_BY_MIME[mime]) return EXT_BY_MIME[mime]
  if (filename) {
    const ext = path.extname(filename).toLowerCase()
    if (ALLOWED_EXT.has(ext)) return ext
  }
  return '.bin'
}

async function ensureResumeDir(): Promise<void> {
  await fs.mkdir(RESUME_UPLOAD_DIR, { recursive: true })
}

function resumeFilePath(candidateId: string, mime: string, filename?: string): string {
  return path.join(RESUME_UPLOAD_DIR, `${candidateId}${resumeExtension(mime, filename)}`)
}

function resumeObjectKey(candidateId: string, mime: string, filename?: string): string {
  return `candidates/${candidateId}${resumeExtension(mime, filename)}`
}

export async function saveResumeFile(
  candidateId: string,
  mime: string,
  buffer: Buffer,
  filename?: string,
  existingStorageKey?: string | null
): Promise<StoredResume> {
  const resolvedMime = resolveResumeMime(mime, filename || '')
  await deleteResumeFile(candidateId, existingStorageKey)

  if (insforgeEnv.useStorage) {
    const admin = getInsforgeAdmin()
    const key = resumeObjectKey(candidateId, resolvedMime, filename)
    const blob = new Blob([buffer], { type: resolvedMime })
    const { data, error } = await admin.storage.from(RESUME_BUCKET).upload(key, blob)
    if (error) throw new Error(error.message || 'Failed to upload resume to InsForge storage')
    return { mime: resolvedMime, storageKey: data?.key || key, url: data?.url }
  }

  await ensureResumeDir()
  const filePath = resumeFilePath(candidateId, resolvedMime, filename)
  await fs.writeFile(filePath, buffer)
  return { mime: resolvedMime, filePath }
}

export async function deleteResumeFile(
  candidateId: string,
  storageKey?: string | null
): Promise<void> {
  if (insforgeEnv.useStorage) {
    const admin = getInsforgeAdmin()
    const key = storageKey || resumeObjectKey(candidateId, 'application/pdf')
    await admin.storage.from(RESUME_BUCKET).remove(key).catch(() => undefined)
    return
  }

  await ensureResumeDir()
  const files = await fs.readdir(RESUME_UPLOAD_DIR).catch(() => [] as string[])
  const prefix = `${candidateId}.`
  await Promise.all(
    files
      .filter((f) => f.startsWith(prefix))
      .map((f) => fs.unlink(path.join(RESUME_UPLOAD_DIR, f)).catch(() => undefined))
  )
}

export async function findResumeFile(
  candidateId: string,
  storageKey?: string | null
): Promise<StoredResume | null> {
  if (insforgeEnv.useStorage) {
    if (!storageKey) return null
    const ext = path.extname(storageKey).toLowerCase()
    return { mime: MIME_BY_EXT[ext] || 'application/octet-stream', storageKey }
  }

  await ensureResumeDir()
  const files = await fs.readdir(RESUME_UPLOAD_DIR).catch(() => [] as string[])
  const match = files.find((f) => f.startsWith(`${candidateId}.`))
  if (!match) return null
  const ext = path.extname(match).toLowerCase()
  const mime = MIME_BY_EXT[ext] || 'application/octet-stream'
  return { filePath: path.join(RESUME_UPLOAD_DIR, match), mime }
}

export async function readResumeBuffer(stored: StoredResume): Promise<Buffer> {
  if (stored.storageKey) {
    const admin = getInsforgeAdmin()
    const { data, error } = await admin.storage.from(RESUME_BUCKET).download(stored.storageKey)
    if (error || !data) throw new Error(error?.message || 'Failed to download resume')
    return Buffer.from(await data.arrayBuffer())
  }
  if (!stored.filePath) throw new Error('Resume file path missing')
  return fs.readFile(stored.filePath)
}
