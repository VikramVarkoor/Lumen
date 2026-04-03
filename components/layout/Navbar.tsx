'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/useAuth'
import { AuthModal } from '../ui/AuthModal'

export function Navbar() {
  const { user, signOut } = useAuth()
  const [showAuth, setShowAuth] = useState(false)

  return (
    <>
      <nav className="navbar">
        <Link href="/" className="nav-logo">
          <span className="logo-mark">✦</span>
          <span className="logo-text">Lumen</span>
        </Link>

        <div className="nav-links">
          {user && (
            <Link href="/history" className="nav-link">
              History
            </Link>
          )}
          {user ? (
            <button onClick={signOut} className="nav-btn ghost">
              Sign out
            </button>
          ) : (
            <button onClick={() => setShowAuth(true)} className="nav-btn primary">
              Sign in
            </button>
          )}
        </div>
      </nav>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  )
}
