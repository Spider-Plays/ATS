const TOKEN_KEY = 'stitch_auth_token'
const FETCH_TIMEOUT_MS = 90_000

/** In dev, always use same-origin `/api` so Vite proxies to localhost:4000. */
const API_BASE = import.meta.env.DEV
  ? ''
  : (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') || ''

export function apiUrl(path: string): string {
  return `${API_BASE}/api${path}`
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = path === '/auth/login' || path === '/auth/register-candidate' ? null : getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const res = await fetch(`${API_BASE}/api${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      const isLoginAttempt = path === '/auth/login' || path === '/auth/register-candidate'
      if (res.status === 401 && !isLoginAttempt) {
        clearToken()
        window.dispatchEvent(new Event('auth:session-expired'))
      }
      throw new ApiError(body.error || res.statusText, res.status)
    }

    if (res.status === 204) return undefined as T
    return res.json() as Promise<T>
  } catch (err) {
    if (err instanceof ApiError) throw err
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ApiError(
        'Request timed out. The API or database may still be waking up — try again in a moment.',
        408
      )
    }
    throw err
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function uploadFormData<T>(path: string, formData: FormData): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${API_BASE}/api${path}`, { method: 'POST', body: formData, headers })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    if (res.status === 401) {
      clearToken()
      window.dispatchEvent(new Event('auth:session-expired'))
    }
    throw new ApiError(body.error || res.statusText, res.status)
  }

  return res.json() as Promise<T>
}

export async function fetchResumeBlob(candidateId: string): Promise<Blob | null> {
  const token = getToken()
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${API_BASE}/api/candidates/${candidateId}/resume`, { headers })

  if (res.status === 404) return null
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    if (res.status === 401) {
      clearToken()
      window.dispatchEvent(new Event('auth:session-expired'))
    }
    throw new ApiError(body.error || res.statusText, res.status)
  }

  return res.blob()
}

export async function fetchApiBlob(path: string): Promise<Blob> {
  const token = getToken()
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(apiUrl(path), { headers })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    if (res.status === 401) {
      clearToken()
      window.dispatchEvent(new Event('auth:session-expired'))
    }
    throw new ApiError((body as { error?: string }).error || res.statusText, res.status)
  }
  return res.blob()
}
