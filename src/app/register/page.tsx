'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/src/lib/supabase/client'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function cleanWhatsapp(value: string): string {
  return value.replace(/\D/g, '').slice(0, 8)
}

// ─── Composant champ input ────────────────────────────────────────────────────

function Field({
  label, icon, children,
}: {
  label: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div>
      <label
        className="block text-sm font-semibold mb-2"
        style={{ color: '#1A1C1E', fontFamily: 'var(--font-jakarta)' }}
      >
        {label}
      </label>
      <div
        className="flex items-center rounded-xl overflow-hidden transition-all"
        style={{ border: '1.5px solid #e5e7eb', backgroundColor: '#fff' }}
        onFocusCapture={e => {
          const el = e.currentTarget as HTMLElement
          el.style.borderColor = '#006A4E'
        }}
        onBlurCapture={e => {
          const el = e.currentTarget as HTMLElement
          el.style.borderColor = '#e5e7eb'
        }}
      >
        <div className="px-3 flex items-center justify-center flex-shrink-0" style={{ color: '#9ca3af' }}>
          {icon}
        </div>
        {children}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    nom: '',
    email: '',
    password: '',
    whatsapp: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setForm(prev => ({
      ...prev,
      [name]: name === 'whatsapp' ? cleanWhatsapp(value) : value,
    }))
  }

  async function handleSubmit() {
    setError(null)

    if (!form.nom.trim()) { setError('Entrez votre nom complet.'); return }
    if (!isValidEmail(form.email)) { setError('Adresse email invalide.'); return }
    if (form.password.length < 8) { setError('Le mot de passe doit faire au moins 8 caractères.'); return }
    if (form.whatsapp.length < 8) { setError('Numéro WhatsApp invalide.'); return }

    setLoading(true)

    // 1. Créer le compte Auth Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    })

    if (authError || !authData.user) {
      setError(authError?.message ?? 'Erreur lors de la création du compte.')
      setLoading(false)
      return
    }

    // 2. Insérer dans la table sellers
    const { error: insertError } = await supabase.from('sellers').insert({
      id: authData.user.id,
      nom: form.nom.trim(),
      email: form.email,
      whatsapp: `+228${form.whatsapp}`,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard/products/new')
  }

  return (
    <div className="min-h-screen bg-white flex flex-col px-5 pt-10 pb-10">

      {/* ── Logo + titre ── */}
      <div className="flex flex-col items-center mb-7">
        <img src="/PeerWize.svg" alt="PeerWize" className="h-10 w-10 rounded-xl mb-3" />
        <h1
          className="text-xl font-bold"
          style={{ color: '#1A1C1E', fontFamily: 'var(--font-jakarta)' }}
        >
          PeerWize
        </h1>
        <p
          className="text-sm mt-0.5"
          style={{ color: '#6b7280', fontFamily: 'var(--font-vietnam)' }}
        >
          Rejoignez l'économie de demain
        </p>
      </div>

      {/* ── Étape indicator ── */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span
            className="text-xs font-bold"
            style={{ color: '#006A4E', fontFamily: 'var(--font-vietnam)' }}
          >
            Étape 1 sur 2
          </span>
          <span
            className="text-xs font-medium"
            style={{ color: '#9ca3af', fontFamily: 'var(--font-vietnam)' }}
          >
            Détails personnels
          </span>
        </div>
        {/* Barre de progression */}
        <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: '#e5e7eb' }}>
          <div
            className="h-1.5 rounded-full transition-all"
            style={{ width: '50%', backgroundColor: '#006A4E' }}
          />
        </div>
      </div>

      {/* ── Formulaire ── */}
      <div className="mb-5">
        <h2
          className="text-base font-bold mb-5"
          style={{ color: '#1A1C1E', fontFamily: 'var(--font-jakarta)' }}
        >
          Informations du vendeur
        </h2>

        {error && (
          <div
            className="mb-5 px-4 py-3 rounded-xl text-sm"
            style={{ backgroundColor: '#fef2f2', color: '#D21034', border: '1px solid #fecaca' }}
          >
            {error}
          </div>
        )}

        <div className="space-y-4">

          {/* Nom */}
          <Field
            label="Nom complet"
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <circle cx="12" cy="8" r="4"/><path strokeLinecap="round" d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
              </svg>
            }
          >
            <input
              name="nom"
              type="text"
              value={form.nom}
              onChange={handleChange}
              placeholder="Ex: Jean Kouassi"
              className="flex-1 py-3.5 pr-4 text-sm bg-transparent focus:outline-none"
              style={{ color: '#1A1C1E', fontFamily: 'var(--font-vietnam)' }}
            />
          </Field>

          {/* Email */}
          <Field
            label="Adresse Email"
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
            }
          >
            <input
              name="email"
              type="email"
              inputMode="email"
              value={form.email}
              onChange={handleChange}
              placeholder="nom@exemple.tg"
              className="flex-1 py-3.5 pr-4 text-sm bg-transparent focus:outline-none"
              style={{ color: '#1A1C1E', fontFamily: 'var(--font-vietnam)' }}
            />
          </Field>

          {/* Mot de passe */}
          <Field
            label="Mot de passe"
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <rect x="3" y="11" width="18" height="11" rx="2"/><path strokeLinecap="round" d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
            }
          >
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="flex-1 py-3.5 pr-4 text-sm bg-transparent focus:outline-none"
              style={{ color: '#1A1C1E', fontFamily: 'var(--font-vietnam)' }}
            />
          </Field>

          {/* WhatsApp */}
          <div>
            <label
              className="block text-sm font-semibold mb-2"
              style={{ color: '#1A1C1E', fontFamily: 'var(--font-jakarta)' }}
            >
              Numéro WhatsApp
            </label>
            <div
              className="flex items-center rounded-xl overflow-hidden"
              style={{ border: '1.5px solid #e5e7eb' }}
              onFocusCapture={e => { (e.currentTarget as HTMLElement).style.borderColor = '#006A4E' }}
              onBlurCapture={e => { (e.currentTarget as HTMLElement).style.borderColor = '#e5e7eb' }}
            >
              {/* Icône téléphone */}
              <div className="px-3 flex items-center" style={{ color: '#9ca3af' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                </svg>
              </div>
              {/* Préfixe */}
              <div
                className="flex items-center gap-1 px-2 py-3.5"
                style={{ borderRight: '1.5px solid #e5e7eb', backgroundColor: '#f8f9fa' }}
              >
                <span className="text-base">🇹🇬</span>
                <span
                  className="text-sm font-semibold"
                  style={{ color: '#1A1C1E', fontFamily: 'var(--font-vietnam)' }}
                >
                  +228
                </span>
              </div>
              <input
                name="whatsapp"
                type="tel"
                inputMode="numeric"
                value={form.whatsapp}
                onChange={handleChange}
                placeholder="90 00 00 00"
                className="flex-1 px-3 py-3.5 text-sm bg-white focus:outline-none"
                style={{ color: '#1A1C1E', fontFamily: 'var(--font-vietnam)', letterSpacing: '0.05em' }}
              />
            </div>
          </div>

        </div>
      </div>

      {/* ── Bouton continuer ── */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-white text-sm font-bold mb-5 transition active:opacity-90"
        style={{
          backgroundColor: loading ? '#4a9a7e' : '#006A4E',
          fontFamily: 'var(--font-jakarta)',
        }}
      >
        {loading ? (
          <div
            className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: '#fff', borderTopColor: 'transparent' }}
          />
        ) : (
          <>
            Continuer
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </>
        )}
      </button>

      {/* ── Lien connexion ── */}
      <p
        className="text-sm text-center mb-5"
        style={{ color: '#6b7280', fontFamily: 'var(--font-vietnam)' }}
      >
        Déjà vendeur ?{' '}
        <Link
          href="/login"
          className="font-semibold"
          style={{ color: '#006A4E' }}
        >
          Se connecter
        </Link>
      </p>

      {/* ── Footer liens ── */}
      <div className="flex items-center justify-center gap-3 mt-auto">
        {['Aide', 'Conditions', 'Confidentialité'].map((item, i, arr) => (
          <span key={item} className="flex items-center gap-3">
            <span
              className="text-xs"
              style={{ color: '#9ca3af', fontFamily: 'var(--font-vietnam)' }}
            >
              {item}
            </span>
            {i < arr.length - 1 && (
              <span style={{ color: '#d1d5db', fontSize: 10 }}>•</span>
            )}
          </span>
        ))}
      </div>

    </div>
  )
}