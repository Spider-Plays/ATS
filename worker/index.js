const DEFAULT_API_ORIGIN = 'https://stitch-ats.onrender.com'

const NO_CACHE_PATHS = new Set(['/', '/index.html', '/build-id.txt'])

function withNoCache(response) {
  const headers = new Headers(response.headers)
  headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
  headers.set('Pragma', 'no-cache')
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
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
      return upstream
    }

    const assetResponse = await env.ASSETS.fetch(request)
    if (NO_CACHE_PATHS.has(url.pathname)) {
      return withNoCache(assetResponse)
    }
    return assetResponse
  },
}
