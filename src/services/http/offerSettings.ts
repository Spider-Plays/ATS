import { apiRequest, apiUrl, getToken } from '../../lib/apiClient'
import type { CompensationBreakdown, CompensationConfig, OfferLetterTemplate } from '../../types'

export const offerSettingsService = {
  getCompensationConfig: () =>
    apiRequest<CompensationConfig>('/offer-settings/compensation'),

  updateCompensationConfig: (config: CompensationConfig) =>
    apiRequest<CompensationConfig>('/offer-settings/compensation', {
      method: 'PUT',
      body: JSON.stringify(config),
    }),

  previewCompensation: (annualCtc: number, config?: CompensationConfig) =>
    apiRequest<CompensationBreakdown>('/offer-settings/compensation/preview', {
      method: 'POST',
      body: JSON.stringify({ annualCtc, config }),
    }),

  getLetterTemplate: () =>
    apiRequest<OfferLetterTemplate>('/offer-settings/letter-template'),

  updateLetterTemplate: (template: OfferLetterTemplate) =>
    apiRequest<OfferLetterTemplate>('/offer-settings/letter-template', {
      method: 'PUT',
      body: JSON.stringify(template),
    }),

  resetLetterTemplate: () =>
    apiRequest<OfferLetterTemplate>('/offer-settings/letter-template/reset', {
      method: 'POST',
      body: '{}',
    }),

  previewLetterTemplate: async (template?: OfferLetterTemplate, annualCtc?: number) => {
    const token = getToken()
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (token) headers.Authorization = `Bearer ${token}`
    const res = await fetch(apiUrl('/offer-settings/letter-template/preview'), {
      method: 'POST',
      headers,
      body: JSON.stringify({ template, annualCtc }),
    })
    if (!res.ok) throw new Error('Failed to preview letter')
    return res.text()
  },
}
