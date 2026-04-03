'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'

interface AuthModalProps {
  onClose: () => void
}

export function AuthModal({ onClose }: AuthModalProps) {
  const { signInWithEmail, signUpWithEmail } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async () => {
    setError('')
    setLoading(true)
    try {
      const fn = mode === 'signin' ? signInWithEmail : signUpWithEmail
      const { error } = await fn(email, password)
      if (error) {
        setError(error.message)
      } else {
        if (mode === 'signup') {
          setSuccess(true)
        } else {
          onClose()
        }
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        {success ? (
          <div className="auth-success">
            <span className="success-icon">✓</span>
            <p>Check your email to confirm your account.</p>
          </div>
        ) : (
          <>
            <h2 className="modal-title">
              {mode === 'signin' ? 'Sign in' : 'Create account'}
            </h2>
            <p className="modal-subtitle">Save your query history across sessions</p>

            <div className="auth-form">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="auth-input"
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="auth-input"
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
              {error && <p className="auth-error">{error}</p>}
              <button
                onClick={handleSubmit}
                disabled={loading || !email || !password}
                className="auth-submit"
              >
                {loading ? 'Loading…' : mode === 'signin' ? 'Sign in' : 'Create account'}
              </button>
            </div>

            <div className="auth-toggle">
              {mode === 'signin' ? (
                <p>
                  No account?{' '}
                  <button onClick={() => setMode('signup')}>Sign up</button>
                </p>
              ) : (
                <p>
                  Have an account?{' '}
                  <button onClick={() => setMode('signin')}>Sign in</button>
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
