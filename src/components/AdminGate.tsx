import { useState } from 'react'
import { useClerk, useUser } from '@clerk/clerk-react'
import { Lock, ShieldCheck, X, LogOut, KeyRound } from 'lucide-react'
import { useAdmin } from '../context/AdminContext'

/**
 * Fixed admin control (bottom-left). Public users never need it; it drives the
 * admin flow: sign in (Clerk) → verify allow-listed email → enter admin code.
 * The AI chat editor (Phase 2+) mounts once `status.isAdmin` is true.
 */
export function AdminGate() {
  const { openSignIn, signOut } = useClerk()
  const { isSignedIn, user } = useUser()
  const { status, unlock, loading } = useAdmin()

  const [open, setOpen] = useState(false)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const email = user?.primaryEmailAddress?.emailAddress ?? status.email

  const handleTrigger = () => {
    if (!isSignedIn) {
      openSignIn()
    } else {
      setError(null)
      setOpen(true)
    }
  }

  const submitCode = async () => {
    if (!code.trim()) return
    setBusy(true)
    setError(null)
    const result = await unlock(code.trim())
    setBusy(false)
    if (result.ok) {
      setCode('')
      setOpen(false)
    } else {
      setError(result.error ?? 'Invalid code')
    }
  }

  return (
    <>
      <button
        onClick={handleTrigger}
        className={`fixed bottom-4 left-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium shadow-lg backdrop-blur-md transition-all ${
          status.isAdmin
            ? 'bg-emerald-600 text-white hover:bg-emerald-500'
            : 'bg-gray-900/80 text-gray-200 hover:bg-gray-800 dark:bg-white/10 dark:hover:bg-white/20'
        }`}
        title={status.isAdmin ? 'Admin mode active' : 'Admin access'}
      >
        {status.isAdmin ? <ShieldCheck size={14} /> : <Lock size={14} />}
        {status.isAdmin ? 'Admin' : isSignedIn ? 'Admin access' : 'Admin sign in'}
      </button>

      {open && isSignedIn && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-white/10 shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                Admin Access
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 truncate">
              Signed in as <span className="font-medium text-gray-700 dark:text-gray-200">{email}</span>
            </p>

            {/* State: email not on the allowlist */}
            {!status.emailAllowed && !loading && (
              <div className="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-4 text-sm text-red-700 dark:text-red-300">
                This account isn’t authorized for admin access. Contact the dashboard owner to be added
                to the admin allowlist.
              </div>
            )}

            {/* State: allow-listed, needs admin code */}
            {status.emailAllowed && !status.isAdmin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Enter admin code
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    autoFocus
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && submitCode()}
                    placeholder="XXXX-XXXX"
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
                <button
                  onClick={submitCode}
                  disabled={busy || !code.trim()}
                  className="mt-4 w-full py-2.5 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {busy ? 'Verifying…' : 'Unlock admin mode'}
                </button>
              </div>
            )}

            {/* State: fully unlocked admin */}
            {status.isAdmin && (
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 p-4 text-sm text-emerald-800 dark:text-emerald-300">
                <p className="font-semibold mb-1">Admin mode active ✓</p>
                <p className="text-emerald-700/80 dark:text-emerald-300/80">
                  The AI chat editor arrives in the next phase. You’ll be able to request changes to the
                  dashboard here.
                </p>
              </div>
            )}

            <button
              onClick={() => {
                setOpen(false)
                void signOut()
              }}
              className="mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </>
  )
}
