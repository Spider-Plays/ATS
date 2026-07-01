export const APP_NAME = 'Stitch ATS'
export const APP_WORDMARK_PRIMARY = 'Stitch'
export const APP_WORDMARK_SUFFIX = 'ATS'

export function copyrightNotice(entity = APP_NAME): string {
  return `© ${new Date().getFullYear()} ${entity} | All Rights Reserved`
}
