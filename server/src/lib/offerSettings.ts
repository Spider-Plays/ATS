import { prisma } from './prisma.js'
import {
  DEFAULT_COMPENSATION_CONFIG,
  type CompensationConfig,
} from './offerCompensation.js'
import {
  DEFAULT_OFFER_LETTER_TEMPLATE,
  mergeOfferLetterTemplate,
  type OfferLetterTemplate,
} from './offerLetterTemplate.js'
import { ensureAppSettingTable } from './ensureAppSettingTable.js'

export const COMPENSATION_CONFIG_KEY = 'compensation_config'
export const OFFER_LETTER_TEMPLATE_KEY = 'offer_letter_template'

let tableReady = false

async function ensureTable(): Promise<void> {
  if (tableReady) return
  await ensureAppSettingTable()
  tableReady = true
}

function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback
  try {
    return { ...fallback, ...JSON.parse(raw) } as T
  } catch {
    return fallback
  }
}

async function readSetting(key: string): Promise<string | null> {
  await ensureTable()
  const rows = await prisma.$queryRaw<{ value: string }[]>`
    SELECT value FROM "AppSetting" WHERE key = ${key} LIMIT 1
  `
  return rows[0]?.value ?? null
}

async function writeSetting(key: string, value: string, updatedBy: string): Promise<void> {
  await ensureTable()
  await prisma.$executeRaw`
    INSERT INTO "AppSetting" (key, value, "updatedBy", "updatedAt")
    VALUES (${key}, ${value}, ${updatedBy}, NOW())
    ON CONFLICT (key) DO UPDATE SET
      value = EXCLUDED.value,
      "updatedBy" = EXCLUDED."updatedBy",
      "updatedAt" = NOW()
  `
}

export async function getCompensationConfig(): Promise<CompensationConfig> {
  const raw = await readSetting(COMPENSATION_CONFIG_KEY)
  return parseJson(raw, { ...DEFAULT_COMPENSATION_CONFIG })
}

export async function setCompensationConfig(
  config: CompensationConfig,
  updatedBy: string
): Promise<CompensationConfig> {
  const merged = parseJson(JSON.stringify(config), { ...DEFAULT_COMPENSATION_CONFIG })
  await writeSetting(COMPENSATION_CONFIG_KEY, JSON.stringify(merged), updatedBy)
  return merged
}

export async function getOfferLetterTemplate(): Promise<OfferLetterTemplate> {
  const raw = await readSetting(OFFER_LETTER_TEMPLATE_KEY)
  if (!raw) {
    return mergeOfferLetterTemplate(null)
  }
  try {
    return mergeOfferLetterTemplate(JSON.parse(raw) as Partial<OfferLetterTemplate>)
  } catch {
    return mergeOfferLetterTemplate(null)
  }
}

export async function setOfferLetterTemplate(
  template: OfferLetterTemplate,
  updatedBy: string
): Promise<OfferLetterTemplate> {
  const merged = mergeOfferLetterTemplate(template)
  await writeSetting(OFFER_LETTER_TEMPLATE_KEY, JSON.stringify(merged), updatedBy)
  return merged
}
