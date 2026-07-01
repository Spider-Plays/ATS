import { apiRequest, getToken } from '../../lib/apiClient'
import type { PortalOpenPosition } from './portal'

function stripClient(position: PortalOpenPosition): PortalOpenPosition {
  const { client: _client, ...rest } = position
  return rest
}

function stripClientList(positions: PortalOpenPosition[]): PortalOpenPosition[] {
  return positions.map(stripClient)
}

async function withPortalPositionsFallback(
  fn: () => Promise<PortalOpenPosition[]>,
  fallback: () => Promise<PortalOpenPosition[]>
): Promise<PortalOpenPosition[]> {
  try {
    return await fn()
  } catch (err) {
    if (getToken()) {
      try {
        return stripClientList(await fallback())
      } catch {
        throw err
      }
    }
    throw err
  }
}

async function withPortalPositionFallback(
  fn: () => Promise<PortalOpenPosition>,
  fallback: () => Promise<PortalOpenPosition>
): Promise<PortalOpenPosition> {
  try {
    return await fn()
  } catch (err) {
    if (getToken()) {
      try {
        return stripClient(await fallback())
      } catch {
        throw err
      }
    }
    throw err
  }
}

export const careersService = {
  getOpenPositions: () =>
    withPortalPositionsFallback(
      () => apiRequest<PortalOpenPosition[]>('/careers/positions'),
      () => apiRequest<PortalOpenPosition[]>('/portal/positions')
    ),
  getDepartments: async () => {
    try {
      return await apiRequest<string[]>('/careers/positions/departments')
    } catch (err) {
      if (!getToken()) throw err
      const positions = await apiRequest<PortalOpenPosition[]>('/portal/positions')
      return [...new Set(stripClientList(positions).map((p) => p.department))].sort()
    }
  },
  getPosition: (id: string) =>
    withPortalPositionFallback(
      () => apiRequest<PortalOpenPosition>(`/careers/positions/${id}`),
      () => apiRequest<PortalOpenPosition>(`/portal/positions/${id}`)
    ),
}
