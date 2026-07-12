'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/src/lib/supabase/client'

// ─── Types ────────────────────────────────────────────────────────────────────

type Product = {
  id: string
  nom: string
  prix_fcfa: number
  photo_url: string | null
  slug: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatFCFA(amount: number): string {
  return amount.toLocaleString('fr-FR').replace(/\s/g, '.') + ' FCFA'
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OrderFormPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string
  const supabase = createClient()

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [nom, setNom] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [quantite, setQuantite] = useState(1)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('products')
        .select('id, nom, prix_fcfa, photo_url, slug')
        .eq('slug', slug)
        .eq('actif', true)
        .single()

      if (!data) { router.push('/'); return }
      setProduct(data)
      setLoading(false)
    }
    load()
  }, [slug])

  function decrement() {
    setQuantite(q => Math.max(1, q - 1))
  }

  function increment() {
    setQuantite(q => q + 1)
  }

  // Nettoyage numéro WhatsApp — garde uniquement les chiffres
  function handleWhatsapp(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 8)
    setWhatsapp(digits)
  }

  async function handleSubmit() {
    setError(null)

    if (!nom.trim()) { setError('Veuillez entrer votre nom complet.'); return }
    if (whatsapp.length < 8) { setError('Numéro WhatsApp invalide.'); return }
    if (!product) return

    setSubmitting(true)

    const fullWhatsapp = `+228${whatsapp}`
    const montant_total = product.prix_fcfa * quantite

    const { data: order, error: insertError } = await supabase
      .from('orders')
      .insert({
        product_id: product.id,
        client_nom: nom.trim(),
        client_whatsapp: fullWhatsapp,
        quantite,
        montant_total,
        statut: 'en_attente',
      })
      .select('id')
      .single()

    if (insertError || !order) {
      setError('Une erreur est survenue. Réessayez.')
      setSubmitting(false)
      return
    }

    router.push(`/p/${slug}/pay?order=${order.id}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: '#006A4E', borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  if (!product) return null

  const total = product.prix_fcfa * quantite

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid #f3f4f6' }}
      >
        <Link
          href={`/p/${slug}`}
          className="p-2 rounded-full hover:bg-gray-100 transition"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A1C1E" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>

        <div className="flex items-center gap-1.5">
          <img src="/PeerWize.svg" alt="PeerWize" className="h-5 w-5 rounded" />
          <span
            className="text-sm font-bold"
            style={{ color: '#1A1C1E', fontFamily: 'var(--font-jakarta)' }}
          >
            PeerWize
          </span>
        </div>

        {/* Icône panier décorative */}
        <div className="p-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-10 2a2 2 0 100 4 2 2 0 000-4z" />
          </svg>
        </div>
      </div>

      {/* ── Contenu scrollable ── */}
      <div className="flex-1 px-5 pt-5 pb-36 overflow-y-auto">

        {/* Carte produit résumé */}
        <div
          className="flex items-center gap-3 rounded-2xl px-4 py-3 mb-6"
          style={{ backgroundColor: '#f0f9f5' }}
        >
          {product.photo_url ? (
            <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
              <img
                src={product.photo_url}
                alt={product.nom}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: '#d1fae5' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  stroke="#006A4E"
                />
              </svg>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-bold truncate"
              style={{ color: '#1A1C1E', fontFamily: 'var(--font-jakarta)' }}
            >
              {product.nom}
            </p>
            <div
              className="inline-block mt-1 px-2 py-0.5 rounded-md"
              style={{ backgroundColor: '#FFCD00' }}
            >
              <span
                className="text-xs font-bold"
                style={{ color: '#1A1C1E', fontFamily: 'var(--font-jakarta)' }}
              >
                {formatFCFA(product.prix_fcfa)}
              </span>
            </div>
          </div>
        </div>

        {/* Erreur */}
        {error && (
          <div
            className="mb-5 px-4 py-3 rounded-xl text-sm"
            style={{ backgroundColor: '#fef2f2', color: '#D21034', border: '1px solid #fecaca' }}
          >
            {error}
          </div>
        )}

        {/* Champ Nom */}
        <div className="mb-5">
          <label
            className="block text-sm font-semibold mb-2"
            style={{ color: '#1A1C1E', fontFamily: 'var(--font-jakarta)' }}
          >
            Nom complet
          </label>
          <input
            type="text"
            value={nom}
            onChange={e => setNom(e.target.value)}
            placeholder="Ex: Jean Koffi"
            className="w-full rounded-xl px-4 py-3.5 text-sm focus:outline-none transition"
            style={{
              color: '#1A1C1E',
              backgroundColor: '#fff',
              border: '1.5px solid #e5e7eb',
              fontFamily: 'var(--font-vietnam)',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = '#006A4E' }}
            onBlur={e => { e.currentTarget.style.borderColor = '#e5e7eb' }}
          />
        </div>

        {/* Champ WhatsApp */}
        <div className="mb-5">
          <label
            className="block text-sm font-semibold mb-2"
            style={{ color: '#1A1C1E', fontFamily: 'var(--font-jakarta)' }}
          >
            Numéro WhatsApp
          </label>
          <div
            className="flex items-center rounded-xl overflow-hidden transition"
            style={{ border: '1.5px solid #e5e7eb' }}
            onFocus={() => {}}
          >
            {/* Préfixe +228 */}
            <div
              className="flex items-center gap-1.5 px-3 py-3.5 flex-shrink-0"
              style={{ backgroundColor: '#f8f9fa', borderRight: '1.5px solid #e5e7eb' }}
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
              type="tel"
              inputMode="numeric"
              value={whatsapp}
              onChange={e => handleWhatsapp(e.target.value)}
              placeholder="00 00 00 00"
              className="flex-1 px-3 py-3.5 text-sm focus:outline-none bg-white"
              style={{
                color: '#1A1C1E',
                fontFamily: 'var(--font-vietnam)',
                letterSpacing: '0.05em',
              }}
              onFocus={e => {
                const wrapper = e.currentTarget.closest('div') as HTMLElement
                if (wrapper) wrapper.style.borderColor = '#006A4E'
              }}
              onBlur={e => {
                const wrapper = e.currentTarget.closest('div') as HTMLElement
                if (wrapper) wrapper.style.borderColor = '#e5e7eb'
              }}
            />
          </div>
        </div>

        {/* Quantité */}
        <div className="mb-6">
          <label
            className="block text-sm font-semibold mb-2"
            style={{ color: '#1A1C1E', fontFamily: 'var(--font-jakarta)' }}
          >
            Quantité
          </label>
          <div className="flex items-center gap-0 rounded-xl overflow-hidden" style={{ border: '1.5px solid #e5e7eb', width: 'fit-content' }}>
            <button
              onClick={decrement}
              className="flex items-center justify-center transition active:bg-gray-200"
              style={{ width: 52, height: 52, backgroundColor: '#f8f9fa' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A1C1E" strokeWidth={2.2}>
                <path strokeLinecap="round" d="M5 12h14" />
              </svg>
            </button>
            <div
              className="flex items-center justify-center"
              style={{ width: 64, height: 52, borderLeft: '1.5px solid #e5e7eb', borderRight: '1.5px solid #e5e7eb' }}
            >
              <span
                className="text-lg font-bold"
                style={{ color: '#1A1C1E', fontFamily: 'var(--font-jakarta)' }}
              >
                {quantite}
              </span>
            </div>
            <button
              onClick={increment}
              className="flex items-center justify-center transition active:bg-gray-200"
              style={{ width: 52, height: 52, backgroundColor: '#f8f9fa' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A1C1E" strokeWidth={2.2}>
                <path strokeLinecap="round" d="M12 5v14M5 12h14" />
              </svg>
            </button>
          </div>
        </div>

        {/* Badge sécurité */}
        <div className="flex items-center justify-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              stroke="#006A4E" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
            />
          </svg>
          <span
            className="text-xs"
            style={{ color: '#9ca3af', fontFamily: 'var(--font-vietnam)' }}
          >
            Transaction sécurisée via PeerWize
          </span>
        </div>

      </div>

      {/* ── Barre total + CTA fixe ── */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-white px-5 py-4"
        style={{ borderTop: '1px solid #f3f4f6' }}
      >
        <div className="flex items-center justify-between mb-3">
          <span
            className="text-sm text-gray-500"
            style={{ fontFamily: 'var(--font-vietnam)' }}
          >
            Total à payer
          </span>
          <span
            className="text-xl font-bold"
            style={{ color: '#1A1C1E', fontFamily: 'var(--font-jakarta)' }}
          >
            {formatFCFA(total)}
          </span>
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-white text-sm font-bold transition active:opacity-90"
          style={{
            backgroundColor: submitting ? '#4a9a7e' : '#006A4E',
            fontFamily: 'var(--font-jakarta)',
          }}
        >
          {submitting ? (
            <div
              className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: '#fff', borderTopColor: 'transparent' }}
            />
          ) : (
            <>
              Choisir le paiement
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </>
          )}
        </button>
      </div>

    </div>
  )
}