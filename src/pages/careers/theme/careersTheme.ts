export type CareersThemeId = 'stitch' | 'igs'

export type CareersThemeConfig = {
  id: CareersThemeId
  label: string
  companyName: string
  tagline: string
  documentTitle: string
  websiteUrl?: string
}

export const CAREERS_THEME_STORAGE_KEY = 'careers_company_theme'

export const CAREERS_THEMES: Record<CareersThemeId, CareersThemeConfig> = {
  stitch: {
    id: 'stitch',
    label: 'Stitch ATS',
    companyName: 'Stitch ATS',
    tagline: 'Careers',
    documentTitle: 'Careers | Stitch ATS',
  },
  igs: {
    id: 'igs',
    label: 'IGS Global',
    companyName: 'IGS Engineering Quality',
    tagline: 'Careers',
    documentTitle: 'Careers | IGS Global',
    websiteUrl: 'https://www.igsglobal.com/',
  },
}

export const CAREERS_THEME_LIST = Object.values(CAREERS_THEMES)

export function isCareersThemeId(value: string | null): value is CareersThemeId {
  return value === 'stitch' || value === 'igs'
}
