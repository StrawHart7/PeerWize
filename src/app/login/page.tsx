'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit() {
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })

    if (error) {
      setError('Email ou mot de passe incorrect.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex flex-col justify-center px-4 py-8" style={{ backgroundColor: '#1A1C1E' }}>

      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <div className="p-1.5 rounded" style={{ backgroundColor: '#2a2d30' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="1" y="1" width="6" height="6" rx="1" fill="#006A4E"/>
            <rect x="9" y="1" width="6" height="6" rx="1" fill="#006A4E"/>
            <rect x="1" y="9" width="6" height="6" rx="1" fill="#006A4E"/>
            <rect x="9" y="9" width="6" height="6" rx="1" fill="#FFCD00"/>
          </svg>
        </div>
        <span className="text-sm" style={{ color: '#9ca3af' }}>Connexion Vendeur</span>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl px-6 py-8">

        {/* Logo + titre */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mb-3"
            style={{ backgroundColor: '#006A4E' }}
          >
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path
                d="M14 4C8.477 4 4 8.477 4 14s4.477 10 10 10 10-4.477 10-10S19.523 4 14 4zm0 3c1.657 0 3 1.343 3 3s-1.343 3-3 3-3-1.343-3-3 1.343-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"
                fill="white"
              />
            </svg>
          </div>
          <h1
            className="text-xl font-bold"
            style={{ color: '#1A1C1E', fontFamily: 'var(--font-jakarta)' }}
          >
            PeerWize
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">Espace Vendeur</p>
        </div>

        {/* Erreur */}
        {error && (
          <div
            className="mb-5 px-4 py-3 rounded-xl text-sm border"
            style={{ backgroundColor: '#fef2f2', color: '#D21034', borderColor: '#fecaca' }}
          >
            {error}
          </div>
        )}

        <div className="space-y-4">

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#006A4E' }}>
              Email
            </label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="votre@email.com"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
              style={{ color: '#1A1C1E' }}
            />
          </div>

          {/* Mot de passe */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#006A4E' }}>
              Mot de passe
            </label>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ color: '#1A1C1E' }}
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
              >
                {showPassword ? (
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            <div className="flex justify-end mt-1.5">
              <button className="text-xs font-medium" style={{ color: '#006A4E' }}>
                Mot de passe oublié ?
              </button>
            </div>
          </div>

          {/* Bouton connexion */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-white text-sm font-semibold transition mt-2"
            style={{ backgroundColor: loading ? '#4a9a7e' : '#006A4E' }}
          >
            {loading ? 'Connexion...' : (
              <>
                Se connecter
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </button>

        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-6">
          Pas encore de compte ?{' '}
          <a href="/register" className="font-medium" style={{ color: '#D21034' }}>
            S'inscrire
          </a>
        </p>

      </div>

      {/* Bas de page */}
      <p className="text-center text-xs text-gray-500 mt-6">
        Commerce Togolais
      </p>

    </div>
  )
}