/** Roles that cannot use the employee referral portal API and UI */
export const REFERRAL_PORTAL_EXCLUDED_ROLES = ['CANDIDATE', 'VENDOR'] as const

export function isReferralPortalRole(role: string): boolean {
  return !(REFERRAL_PORTAL_EXCLUDED_ROLES as readonly string[]).includes(role)
}
