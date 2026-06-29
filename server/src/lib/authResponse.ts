import type { Response } from 'express'

/** Auth responses must never be cached by browsers or intermediaries. */
export function applyNoStoreAuth(res: Response): void {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Expires', '0')
}

/**
 * Tell the browser to wipe localStorage/sessionStorage for this origin.
 * Used when a session is invalid so users are not stuck after API deploys.
 */
export function applyStaleSessionReset(res: Response): void {
  applyNoStoreAuth(res)
  res.setHeader('Clear-Site-Data', '"storage"')
}

export function sendAuthUnauthorized(res: Response, message = 'Unauthorized'): Response {
  applyStaleSessionReset(res)
  return res.status(401).json({ error: message })
}
