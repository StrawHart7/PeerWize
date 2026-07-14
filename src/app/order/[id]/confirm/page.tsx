'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { notFound } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/client'
import { useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

type Order = {
  id: string
  montant_total: number
  quantite: number
  statut: string
  products: {
    nom: string
    photo_url: string | null
    slug: string
  } | null
  payments: {
    provider: string
  }[] | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatFCFA(amount: number): string {
  return amount.toLocaleString('fr-FR').replace(/\s/g, '.') + ' FCFA'
}

function formatOrderId(id: string): string {
  return '#' + id.slice(0, 5).toUpperCase()
}

function providerLabel(provider: string): string {
  const map: Record<string, string> = {
    moov_tg: 'Flooz',
    togocel: 'T-Money',
    card: 'Carte',
  }
  return map[provider] ?? provider
}

function ProviderIcon({ provider }: { provider: string }) {
  if (provider === 'moov_tg') {
    return (
      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#fff3e0' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" fill="#FF6600" opacity="0.2"/>
          <text x="12" y="16" textAnchor="middle" fontSize="10" fontWeight="800" fill="#FF6600">F</text>
        </svg>
      </div>
    )
  }
  if (provider === 'togocel') {
    return (
      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#e8f5e9' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" fill="#006A4E" opacity="0.2"/>
          <text x="12" y="16" textAnchor="middle" fontSize="10" fontWeight="800" fill="#006A4E">T</text>
        </svg>
      </div>
    )
  }
  return (
    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#eff6ff' }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="5" width="20" height="14" rx="2" stroke="#2563eb" strokeWidth={1.8}/>
        <path d="M2 10h20" stroke="#2563eb" strokeWidth={1.8}/>
      </svg>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ConfirmPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const supabase = createClient()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    async function load() {
      // params est une Promise en Next 15+
      const { id } = await (params as Promise<{ id: string }>)
      const { data } = await supabase
        .from('orders')
        .select('id, montant_total, quantite, statut, products(nom, photo_url, slug), payments(provider)')
        .eq('id', id)
        .single()

      if (!data) { router.push('/'); return }
      setOrder(data as unknown as Order)
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    if (loading) return
    const interval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(interval); router.push('/'); return 0 }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [loading])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div
          className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: '#006A4E', borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  if (!order) return null

  const product = order.products
  const provider = order.payments?.[0]?.provider ?? 'moov_tg'

  return (
    <div className="min-h-screen bg-white flex flex-col items-center px-5 pt-16 pb-10">

      {/* ── Logo + check ── */}
      <img src="/PeerWize.svg" alt="PeerWize" className="h-10 w-10 rounded-xl mb-6" />

      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
        style={{ backgroundColor: '#006A4E' }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path d="M5 13l4 4L19 7" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      <h1
        className="text-2xl font-bold mb-2 text-center"
        style={{ color: '#1A1C1E', fontFamily: 'var(--font-jakarta)' }}
      >
        Commande reçue !
      </h1>
      <p
        className="text-sm text-center mb-8"
        style={{ color: '#6b7280', fontFamily: 'var(--font-vietnam)', maxWidth: 260 }}
      >
        Le vendeur a été notifié. Tu recevras une confirmation sur WhatsApp.
      </p>

      {/* ── Carte commande ── */}
      <div
        className="w-full rounded-2xl p-4 mb-8"
        style={{ backgroundColor: '#f8f9fa', border: '1px solid #f3f4f6' }}
      >
        <div className="flex items-center justify-between mb-4">
          <span
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: '#9ca3af', fontFamily: 'var(--font-vietnam)' }}
          >
            Commande
          </span>
          <span
            className="text-xs font-bold"
            style={{ color: '#006A4E', fontFamily: 'var(--font-jakarta)' }}
          >
            {formatOrderId(order.id)}
          </span>
        </div>

        <div className="flex items-center gap-3 mb-4">
          {product?.photo_url ? (
            <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
              <img src={product.photo_url} alt={product.nom} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: '#e6f4ee' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  stroke="#006A4E"
                />
              </svg>
            </div>
          )}
          <div>
            <p className="text-sm font-semibold" style={{ color: '#1A1C1E', fontFamily: 'var(--font-jakarta)' }}>
              {product?.nom ?? '—'}
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#9ca3af', fontFamily: 'var(--font-vietnam)' }}>
              Quantité : {order.quantite}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 rounded-xl px-3 py-2.5" style={{ backgroundColor: '#FFCD00' }}>
            <p className="text-xs font-bold uppercase tracking-wide mb-0.5" style={{ color: '#92710a', fontFamily: 'var(--font-vietnam)' }}>
              Montant
            </p>
            <p className="text-base font-bold" style={{ color: '#1A1C1E', fontFamily: 'var(--font-jakarta)' }}>
              {formatFCFA(order.montant_total)}
            </p>
          </div>
          <div className="flex-1 rounded-xl px-3 py-2.5" style={{ backgroundColor: '#fff', border: '1px solid #f3f4f6' }}>
            <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: '#9ca3af', fontFamily: 'var(--font-vietnam)' }}>
              Méthode
            </p>
            <div className="flex items-center gap-1.5">
              <ProviderIcon provider={provider} />
              <p className="text-sm font-semibold" style={{ color: '#1A1C1E', fontFamily: 'var(--font-jakarta)' }}>
                {providerLabel(provider)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Countdown ── */}
      <p className="text-xs text-center" style={{ color: '#9ca3af', fontFamily: 'var(--font-vietnam)' }}>
        Redirection dans {countdown}s...
      </p>

    </div>
  )
}