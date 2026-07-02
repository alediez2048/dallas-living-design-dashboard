import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import './index.css'
import App from './App.tsx'
import { DataProvider } from './context/DataContext'
import { AdminProvider } from './context/AdminContext'
import { AdminGate } from './components/AdminGate'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined

// The dashboard is public. Clerk (and the admin gate) only mount when a
// publishable key is configured — so the public view still works without it.
// DataProvider wraps both App and the admin panel so the AI chat can read
// the currently-loaded project data.
const tree = PUBLISHABLE_KEY ? (
  <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
    <DataProvider>
      <AdminProvider>
        <App />
        <AdminGate />
      </AdminProvider>
    </DataProvider>
  </ClerkProvider>
) : (
  <DataProvider>
    <App />
  </DataProvider>
)

createRoot(document.getElementById('root')!).render(<StrictMode>{tree}</StrictMode>)
