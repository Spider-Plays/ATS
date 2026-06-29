const DEFAULT_API_ORIGIN = 'https://stitch-ats.onrender.com'

/** Serve Vite build from ASSETS; proxy /api/* to Render (same-origin, no CORS). */
export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (url.pathname.startsWith('/api/')) {
      const apiOrigin = (env.API_ORIGIN || DEFAULT_API_ORIGIN).replace(/\/$/, '')
      const target = `${apiOrigin}${url.pathname}${url.search}`
      const headers = new Headers(request.headers)
      headers.set('Host', new URL(apiOrigin).host)

      return fetch(target, {
        method: request.method,
        headers,
        body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
        redirect: 'manual',
      })
    }

    return env.ASSETS.fetch(request)
  },
}
