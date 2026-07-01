import { create } from 'zustand'

const STORAGE_KEY = 'ats-notification-read-ids'

type ReadIdsByUser = Record<string, string[]>

function loadReadIds(): ReadIdsByUser {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as ReadIdsByUser
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function saveReadIds(state: ReadIdsByUser) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore quota / private mode
  }
}

interface NotificationStore {
  readIdsByUser: ReadIdsByUser
  isRead: (userId: string | undefined | null, id: string) => boolean
  markAsRead: (userId: string | undefined | null, id: string) => void
  markAllAsRead: (userId: string | undefined | null, ids: string[]) => void
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  readIdsByUser: loadReadIds(),

  isRead: (userId, id) => {
    if (!userId) return false
    return (get().readIdsByUser[userId] ?? []).includes(id)
  },

  markAsRead: (userId, id) => {
    if (!userId) return
    const current = new Set(get().readIdsByUser[userId] ?? [])
    if (current.has(id)) return
    current.add(id)
    const readIdsByUser = { ...get().readIdsByUser, [userId]: [...current] }
    saveReadIds(readIdsByUser)
    set({ readIdsByUser })
  },

  markAllAsRead: (userId, ids) => {
    if (!userId || ids.length === 0) return
    const current = new Set(get().readIdsByUser[userId] ?? [])
    ids.forEach((id) => current.add(id))
    const readIdsByUser = { ...get().readIdsByUser, [userId]: [...current] }
    saveReadIds(readIdsByUser)
    set({ readIdsByUser })
  },
}))
