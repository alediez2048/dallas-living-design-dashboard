import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import './index.css'
import App from './App.tsx'
import { AdminProvider } from './context/AdminContext'
import { AdminGate } from './components/AdminGate'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined

// The dashboard is public. Clerk (and the admin gate) only mount when a
// publishable key is configured — so the public view still works without it.
const tree = PUBLISHABLE_KEY ? (
  <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
    <AdminProvider>
      <App />
      <AdminGate />
    </AdminProvider>
  </ClerkProvider>
) : (
  <App />
)

createRoot(document.getElementById('root')!).render(<StrictMode>{tree}</StrictMode>)
