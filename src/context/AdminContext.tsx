import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { useAuth } from '@clerk/clerk-react'

export interface AdminStatus {
  signedIn: boolean
  email?: string
  emailAllowed: boolean
  isAdmin: boolean
}

interface AdminContextType {
  status: AdminStatus
  loading: boolean
  refresh: () => Promise<void>
  unlock: (code: string) => Promise<{ ok: boolean; error?: string }>
  /** fetch() that attaches the Clerk session token + admin token for privileged calls. */
  adminFetch: (path: string, init?: RequestInit) => Promise<Response>
}

const DEFAULT_STATUS: AdminStatus = { signedIn: false, emailAllowed: false, isAdmin: false }
const ADMIN_TOKEN_KEY = 'dld_admin_token'

const AdminContext = createContext<AdminContextType | undefined>(undefined)

export function AdminProvider({ children }: { children: ReactNode }) {
  const { getToken, isSignedIn } = useAuth()
  const [status, setStatus] = useState<AdminStatus>(DEFAULT_STATUS)
  const [loading, setLoading] = useState(false)

  const adminFetch = useCallback(
    async (path: string, init: RequestInit = {}) => {
      const token = await getToken()
      const adminToken = sessionStorage.getItem(ADMIN_TOKEN_KEY) || ''
      const headers = new Headers(init.headers)
      if (token) headers.set('Authorization', `Bearer ${token}`)
      if (adminToken) headers.set('x-admin-token', adminToken)
      return fetch(path, { ...init, headers })
    },
    [getToken],
  )

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminFetch('/api/admin/status')
      if (res.ok) setStatus(await res.json())
    } catch {
      /* network error — leave prior status */
    } finally {
      setLoading(false)
    }
  }, [adminFetch])

  const unlock = useCallback(
    async (code: string): Promise<{ ok: boolean; error?: string }> => {
      try {
        const res = await adminFetch('/api/admin/unlock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        })
        if (res.ok) {
          const data = await res.json()
          if (data.adminToken) sessionStorage.setItem(ADMIN_TOKEN_KEY, data.adminToken)
          await refresh()
          return { ok: true }
        }
        const err = await res.json().catch(() => ({}))
        return { ok: false, error: err.error || 'Unlock failed' }
      } catch {
        return { ok: false, error: 'Network error' }
      }
    },
    [adminFetch, refresh],
  )

  useEffect(() => {
    if (isSignedIn) {
      void refresh()
    } else {
      sessionStorage.removeItem(ADMIN_TOKEN_KEY)
      setStatus(DEFAULT_STATUS)
    }
  }, [isSignedIn, refresh])

  return (
    <AdminContext.Provider value={{ status, loading, refresh, unlock, adminFetch }}>
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  const ctx = useContext(AdminContext)
  if (!ctx) throw new Error('useAdmin must be used within an AdminProvider')
  return ctx
}
