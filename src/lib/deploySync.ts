import { clearToken } from './apiClient'

const CLIENT_BUILD_KEY = 'stitch_client_build'
const API_BUILD_KEY = 'stitch_api_build'
const RELOAD_ONCE_KEY = 'stitch_deploy_reload_once'

function clearAuthForNewDeploy() {
  clearToken()
  try {
    localStorage.removeItem('stitch_last_activity')
  } catch {
    /* ignore */
  }
}

/**
 * After a Cloudflare or Render deploy, drop stale bundles/tokens so login works
 * without users manually clearing site data.
 */
export async function syncDeployVersions(): Promise<void> {
  if (import.meta.env.DEV) return

  const embeddedClientId = (import.meta.env.VITE_APP_BUILD_ID as string | undefined)?.trim() || ''

  let remoteClientId = ''
  try {
    const res = await fetch(`/build-id.txt?_=${Date.now()}`, { cache: 'no-store' })
    if (res.ok) remoteClientId = (await res.text()).trim()
  } catch {
    /* offline or first visit */
  }

  const clientId = remoteClientId || embeddedClientId
  if (!clientId) return

  let apiId = ''
  try {
    const res = await fetch(`/api/health?_=${Date.now()}`, { cache: 'no-store' })
    if (res.ok) {
      const data = (await res.json()) as { buildId?: string }
      apiId = data.buildId?.trim() || ''
    }
  } catch {
    /* API waking up */
  }

  const storedClient = localStorage.getItem(CLIENT_BUILD_KEY)
  const storedApi = localStorage.getItem(API_BUILD_KEY)

  const clientChanged = Boolean(storedClient && storedClient !== clientId)
  const apiChanged = Boolean(apiId && storedApi && storedApi !== apiId)

  if (clientChanged) {
    clearAuthForNewDeploy()
    localStorage.setItem(CLIENT_BUILD_KEY, clientId)
    if (apiId) localStorage.setItem(API_BUILD_KEY, apiId)

    if (!sessionStorage.getItem(RELOAD_ONCE_KEY)) {
      sessionStorage.setItem(RELOAD_ONCE_KEY, '1')
      window.location.reload()
      await new Promise(() => {})
    }
    sessionStorage.removeItem(RELOAD_ONCE_KEY)
    return
  }

  if (apiChanged) {
    clearAuthForNewDeploy()
    localStorage.setItem(API_BUILD_KEY, apiId)
  }

  if (!storedClient) localStorage.setItem(CLIENT_BUILD_KEY, clientId)
  if (apiId && !storedApi) localStorage.setItem(API_BUILD_KEY, apiId)
}
