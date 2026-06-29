import React, { createContext, useContext, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { User } from '../types'
import { authApi } from '../services/http/auth'
import { getToken, clearToken, ApiError } from '../lib/apiClient'
import { clearSignInState, touchLastActivity } from '../lib/authStorage'
import { PageKey } from '@/permissions'
import { isExplicitLoginPath } from '@/lib/authPaths'

interface AuthContextType {
    user: User | null
    allowedPages: PageKey[]
    loading: boolean
    logout: () => Promise<void>
    login: (email: string, password: string) => Promise<{ user: User; allowedPages: PageKey[] }>
    refreshUser: () => Promise<void>
    setAllowedPages: (pages: PageKey[]) => void
}

export const AuthContext = createContext<AuthContextType>({
    user: null,
    allowedPages: [],
    loading: true,
    logout: async () => {},
    login: async () => {
        throw new Error('AuthProvider not mounted')
    },
    refreshUser: async () => {},
    setAllowedPages: () => {},
})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const location = useLocation()
    const [user, setUser] = useState<User | null>(null)
    const [allowedPages, setAllowedPages] = useState<PageKey[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let cancelled = false

        const bootstrap = async () => {
            const onLoginPage = isExplicitLoginPath(location.pathname)

            if (onLoginPage) {
                clearSignInState()
                if (!cancelled) {
                    setUser(null)
                    setAllowedPages([])
                    setLoading(false)
                }
                return
            }

            const token = getToken()
            if (!token) {
                if (!cancelled) {
                    setUser(null)
                    setAllowedPages([])
                    setLoading(false)
                }
                return
            }

            if (!cancelled) setLoading(true)

            try {
                const session = await authApi.me()
                if (!cancelled) {
                    setUser(session.user)
                    setAllowedPages(session.allowedPages)
                }
            } catch {
                clearToken()
                if (!cancelled) {
                    setUser(null)
                    setAllowedPages([])
                }
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        void bootstrap()

        return () => {
            cancelled = true
        }
    }, [location.pathname, location.search])

    useEffect(() => {
        const onSessionExpired = () => {
            clearToken()
            setUser(null)
            setAllowedPages([])
        }

        window.addEventListener('auth:session-expired', onSessionExpired)
        return () => window.removeEventListener('auth:session-expired', onSessionExpired)
    }, [])

    const login = async (email: string, password: string) => {
        try {
            const session = await authApi.login(email, password)
            touchLastActivity()
            setUser(session.user)
            setAllowedPages(session.allowedPages)
            return session
        } catch (e) {
            if (e instanceof ApiError) {
                if (e.status === 403) throw new Error('ACCOUNT_DISABLED')
                if (e.status === 401) throw new Error('INVALID_CREDENTIALS')
                if (e.status >= 500) throw new Error('SERVER_UNAVAILABLE')
                throw new Error(e.message || 'INVALID_CREDENTIALS')
            }
            if (e instanceof TypeError || (e instanceof Error && e.message === 'Failed to fetch')) {
                throw new Error('Cannot reach API')
            }
            throw new Error('INVALID_CREDENTIALS')
        }
    }

    const logout = async () => {
        await authApi.logout()
        setUser(null)
        setAllowedPages([])
    }

    const refreshUser = async () => {
        if (!getToken()) return
        const session = await authApi.me()
        setUser(session.user)
        setAllowedPages(session.allowedPages)
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                allowedPages,
                loading,
                logout,
                login,
                refreshUser,
                setAllowedPages,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}
