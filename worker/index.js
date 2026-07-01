const DEFAULT_API_ORIGIN = 'https://stitch-ats.onrender.com'

const NO_CACHE_PATHS = new Set(['/', '/index.html', '/build-id.txt'])

const LOGIN_PATHS = new Set(['/login', '/candidate/login', '/portal/login', '/referral-portal/login'])

function withHeaders(response, extra) {
  const headers = new Headers(response.headers)
  for (const [key, value] of Object.entries(extra)) {
    headers.set(key, value)
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

function withNoCache(response) {
  return withHeaders(response, {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Pragma: 'no-cache',
  })
}

/** Wipe stale localStorage when opening a sign-in page (phones + desktop). */
function withLoginPageReset(response) {
  return withHeaders(response, {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Pragma: 'no-cache',
    'Clear-Site-Data': '"storage"',
  })
}

/** Serve Vite build from ASSETS; proxy /api/* to Render (same-origin, no CORS). */
export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (url.pathname.startsWith('/api/')) {
      const apiOrigin = (env.API_ORIGIN || DEFAULT_API_ORIGIN).replace(/\/$/, '')
      const target = `${apiOrigin}${url.pathname}${url.search}`
      const headers = new Headers(request.headers)
      headers.set('Host', new URL(apiOrigin).host)

      const upstream = await fetch(target, {
        method: request.method,
        headers,
        body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
        redirect: 'manual',
      })

      if (url.pathname === '/api/health') {
        return withNoCache(upstream)
      }

      if (upstream.status === 401 && url.pathname.startsWith('/api/auth/')) {
        const reset = new Headers(upstream.headers)
        reset.set('Clear-Site-Data', '"storage"')
        reset.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
        return new Response(upstream.body, { status: upstream.status, headers: reset })
      }

      return upstream
    }

    const assetResponse = await env.ASSETS.fetch(request)

    if (LOGIN_PATHS.has(url.pathname)) {
      return withLoginPageReset(assetResponse)
    }

    if (NO_CACHE_PATHS.has(url.pathname)) {
      return withNoCache(assetResponse)
    }

    return assetResponse
  },
}
