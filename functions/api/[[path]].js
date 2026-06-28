const API_ORIGIN = 'https://stitch-ats.onrender.com'

/** Proxy /api/* to Render so the browser stays same-origin (no CORS). */
export async function onRequest(context) {
  const { request } = context
  const url = new URL(request.url)
  const target = `${API_ORIGIN}${url.pathname}${url.search}`

  const headers = new Headers(request.headers)
  headers.set('Host', new URL(API_ORIGIN).host)

  return fetch(target, {
    method: request.method,
    headers,
    body: request.body,
    redirect: 'manual',
  })
}
