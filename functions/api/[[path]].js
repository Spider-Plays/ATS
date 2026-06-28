const DEFAULT_API_ORIGIN = 'https://stitch-ats.onrender.com'

/** Proxy /api/* to Render so the browser stays same-origin (no CORS). */
export async function onRequest(context) {
  const { request, env } = context
  const apiOrigin = (env.API_ORIGIN || DEFAULT_API_ORIGIN).replace(/\/$/, '')
  const url = new URL(request.url)
  const target = `${apiOrigin}${url.pathname}${url.search}`

  const headers = new Headers(request.headers)
  headers.set('Host', new URL(apiOrigin).host)

  return fetch(target, {
    method: request.method,
    headers,
    body: request.body,
    redirect: 'manual',
  })
}
