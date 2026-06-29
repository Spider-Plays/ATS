/** Paths where an existing session must not be restored — user must sign in explicitly. */
export function isExplicitLoginPath(pathname: string): boolean {
  return (
    pathname === '/login' ||
    pathname === '/portal/login' ||
    pathname === '/referral-portal/login'
  )
}
