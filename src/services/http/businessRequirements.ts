import { apiRequest } from '../../lib/apiClient'
import type { BusinessRequirement, BusinessStageKey, Requirement } from '../../types'

export const businessRequirementService = {
  list: () => apiRequest<BusinessRequirement[]>('/business-requirements'),

  getById: async (id: string): Promise<BusinessRequirement | undefined> => {
    try {
      return await apiRequest<BusinessRequirement>(`/business-requirements/${id}`)
    } catch {
      return undefined
    }
  },

  getActivityLogs: (id: string, limit = 50) =>
    apiRequest<import('../../types').ActivityLog[]>(
      `/business-requirements/${id}/activity-logs?limit=${limit}`
    ),

  create: (data: Record<string, unknown>) =>
    apiRequest<BusinessRequirement>('/business-requirements', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<BusinessRequirement>) =>
    apiRequest<BusinessRequirement>(`/business-requirements/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  updateStage: (id: string, businessStage: BusinessStageKey, description: string) =>
    apiRequest<BusinessRequirement>(`/business-requirements/${id}/stage`, {
      method: 'PATCH',
      body: JSON.stringify({ businessStage, description }),
    }),

  openToHiring: (id: string) =>
    apiRequest<{ businessRequirement: BusinessRequirement; requirement: Requirement }>(
      `/business-requirements/${id}/open-to-hiring`,
      { method: 'POST' }
    ),

  cancel: (id: string) =>
    apiRequest<BusinessRequirement>(`/business-requirements/${id}/cancel`, {
      method: 'POST',
    }),
}
