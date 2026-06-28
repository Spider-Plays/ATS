import { apiRequest, apiUrl, getToken, fetchApiBlob } from '../../lib/apiClient'
import { Offer, OfferLetterMeta, CompensationBreakdown } from '../../types'

export type OfferCreateInput = {
  candidateId: string
  requirementId: string
  annualCtc: number
  letterMeta?: OfferLetterMeta
  createdBy: string
  status?: Offer['status']
  history?: Offer['history']
}

export const offerService = {
  getAll: () => apiRequest<Offer[]>('/offers'),

  getPending: (step?: 'hr' | 'exec') =>
    apiRequest<Offer[]>(`/offers/pending${step ? `?step=${step}` : ''}`),

  getById: async (id: string): Promise<Offer | undefined> => {
    try {
      return await apiRequest<Offer>(`/offers/${id}`)
    } catch {
      return undefined
    }
  },

  getByCandidateId: (candidateId: string) =>
    apiRequest<Offer[]>(`/offers/by-candidate/${candidateId}`),

  previewCompensation: (annualCtc: number) =>
    apiRequest<CompensationBreakdown>('/offers/preview-compensation', {
      method: 'POST',
      body: JSON.stringify({ annualCtc }),
    }),

  getLetterHtml: async (id: string) => {
    const token = getToken()
    const headers: Record<string, string> = {}
    if (token) headers.Authorization = `Bearer ${token}`
    const res = await fetch(apiUrl(`/offers/${id}/letter`), { headers })
    if (!res.ok) throw new Error('Failed to load letter')
    return res.text()
  },

  downloadLetterPdf: (id: string) => fetchApiBlob(`/offers/${id}/letter/pdf`),

  create: (data: OfferCreateInput) =>
    apiRequest<Offer>('/offers', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: Partial<Offer> & { letterMeta?: OfferLetterMeta }) =>
    apiRequest<Offer>(`/offers/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  submit: (id: string) =>
    apiRequest<Offer>(`/offers/${id}/submit`, { method: 'POST', body: '{}' }),

  approveHr: (id: string, options?: { onBehalfOfHrHead?: boolean }) =>
    apiRequest<Offer>(`/offers/${id}/approve-hr`, {
      method: 'POST',
      body: JSON.stringify(options ?? {}),
    }),

  approveExec: (id: string, options?: { onBehalfOfExec?: boolean }) =>
    apiRequest<Offer>(`/offers/${id}/approve-exec`, {
      method: 'POST',
      body: JSON.stringify(options ?? {}),
    }),

  reject: (id: string, body: { reason?: string; onBehalfOfHrHead?: boolean; onBehalfOfExec?: boolean }) =>
    apiRequest<Offer>(`/offers/${id}/reject`, { method: 'POST', body: JSON.stringify(body) }),

  send: (id: string) =>
    apiRequest<Offer>(`/offers/${id}/send`, { method: 'POST', body: '{}' }),

  withdraw: (id: string) =>
    apiRequest<Offer>(`/offers/${id}/withdraw`, { method: 'POST', body: '{}' }),

  negotiate: (id: string) =>
    apiRequest<Offer>(`/offers/${id}/negotiate`, { method: 'POST', body: '{}' }),

  revise: (id: string) =>
    apiRequest<Offer>(`/offers/${id}/revise`, { method: 'POST', body: '{}' }),

  accept: (id: string) =>
    apiRequest<Offer>(`/offers/${id}/accept`, { method: 'POST', body: '{}' }),

  decline: (id: string) =>
    apiRequest<Offer>(`/offers/${id}/decline`, { method: 'POST', body: '{}' }),

  remove: (id: string) => apiRequest<void>(`/offers/${id}`, { method: 'DELETE' }),
}
