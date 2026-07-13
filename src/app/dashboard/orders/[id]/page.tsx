// src/app/dashboard/orders/[id]/page.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/src/lib/supabase/client'

// ─── Types ────────────────────────────────────────────────────────────────────

type OrderDetail = {
  id: string
  client_nom: string
  client_whatsapp: string
  quantite: number
  montant_total: number
  statut: 'en_attente' | 'payée' | 'livrée' | 'annulée'
  created_at: string
  products: {
    nom: string
    photo_url: string | null
    slug: string
  } | null
  payments: {
    provider: string
    provider_ref: string | null
    paid_at: string | null
  }[] | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatFCFA(amount: number): string {
  return amount.toLocaleString('fr-FR').replace(/\s/g, '.') + ' FCFA'
}

function formatOrderId(id: string): string {
  return '#' + id.slice(0, 5).toUpperCase()
}

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function initiales(nom: string): string {
  return nom.trim().split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
}

const COULEURS = [
  '#006A4E', '#D21034', '#2563eb', '#7c3aed',
  '#b45309', '#0891b2', '#be185d', '#065f46',
]

function couleurAvatar(nom: string): string {
  let hash = 0
  for (let i = 0; i < nom.length; i++) hash = nom.charCodeAt(i) + ((hash << 5) - hash)
  return COULEURS[Math.abs(hash) % COULEURS.length]
}

function providerLabel(provider: string): string {
  const map: Record<string, string> = {
    moov_tg: 'Flooz',
    togocel: 'T-Money',
    card: 'Carte',
  }
  return map[provider] ?? provider
}

const BADGE: Record<string, { label: string; bg: string; color: string }> = {
  en_attente: { label: 'EN ATTENTE', bg: '#fff3e0', color: '#b45309' },
  payée:      { label: 'PAYÉE',      bg: '#dcfce7', color: '#15803d' },
  livrée:     { label: 'LIVRÉE',     bg: '#eff6ff', color: '#2563eb' },
  annulée:    { label: 'ANNULÉE',    bg: '#fef2f2', color: '#D21034' },
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [marking, setMarking] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploadedPath, setUploadedPath] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('orders')
        .select(`
          id, client_nom, client_whatsapp, quantite, montant_total,
          statut, created_at,
          products(nom, photo_url, slug),
          payments(provider, provider_ref, paid_at)
        `)
        .eq('id', orderId)
        .single()

      if (!data) { router.push('/dashboard/orders'); return }
      setOrder(data as unknown as OrderDetail)
      setLoading(false)
    }
    load()
  }, [orderId])

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Preview local immédiat
    setPreviewUrl(URL.createObjectURL(file))
    setUploading(true)
    setError(null)

    try {
      const ext = file.name.split('.').pop()
      const path = `delivery-proofs/${orderId}-${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(path, file, { upsert: true })

      if (uploadError) {
        setError("Erreur lors de l'upload. Réessayez.")
        setPreviewUrl(null)
        setUploading(false)
        return
      }

      setUploadedPath(path)
    } catch {
      setError("Erreur inattendue. Réessayez.")
      setPreviewUrl(null)
    } finally {
      setUploading(false)
    }
  }

  async function handleMarkDelivered() {
    if (!uploadedPath || !order) return
    setMarking(true)
    setError(null)

    const { error: updateError } = await supabase
      .from('orders')
      .update({ statut: 'livrée' })
      .eq('id', order.id)

    if (updateError) {
      setError('Erreur lors de la mise à jour. Réessayez.')
      setMarking(false)
      return
    }

    setOrder(prev => prev ? { ...prev, statut: 'livrée' } : prev)
    setMarking(false)
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

  if (!order) return null

  const badge = BADGE[order.statut]
  const payment = order.payments?.[0]
  const whatsappNumber = order.client_whatsapp.replace('+', '')
  const isPayee = order.statut === 'payée'
  const isLivree = order.statut === 'livrée'
  const canMarkDelivered = isPayee && !!uploadedPath && !uploading

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid #f3f4f6' }}
      >
        <Link
          href="/dashboard/orders"
          className="p-2 rounded-full hover:bg-gray-100 transition"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A1C1E" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>

        <span
          className="text-sm font-bold"
          style={{ color: '#1A1C1E', fontFamily: 'var(--font-jakarta)' }}
        >
          Détail de la Commande
        </span>

        <div className="w-9" />
      </div>

      {/* ── Contenu ── */}
      <div className="flex-1 px-4 pt-5 pb-10 overflow-y-auto">

        {/* Numéro + badge statut */}
        <div className="flex items-center justify-between mb-5">
          <span
            className="text-base font-bold"
            style={{ color: '#1A1C1E', fontFamily: 'var(--font-jakarta)' }}
          >
            No {formatOrderId(order.id)}
          </span>
          <span
            className="text-xs font-bold px-3 py-1 rounded-full"
            style={{ backgroundColor: badge.bg, color: badge.color, fontFamily: 'var(--font-vietnam)' }}
          >
            {badge.label}
          </span>
        </div>

        {/* ── Infos client ── */}
        <div
          className="rounded-2xl p-4 mb-4"
          style={{ backgroundColor: '#f8f9fa', border: '1px solid #f3f4f6' }}
        >
          <p
            className="text-xs font-bold uppercase tracking-widest mb-3"
            style={{ color: '#9ca3af', fontFamily: 'var(--font-vietnam)' }}
          >
            Informations client
          </p>

          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: couleurAvatar(order.client_nom) }}
            >
              <span
                className="text-sm font-bold text-white"
                style={{ fontFamily: 'var(--font-jakarta)' }}
              >
                {initiales(order.client_nom)}
              </span>
            </div>
            <span
              className="text-base font-bold"
              style={{ color: '#1A1C1E', fontFamily: 'var(--font-jakarta)' }}
            >
              {order.client_nom}
            </span>
          </div>

          <a
            href={`https://wa.me/${whatsappNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl transition active:opacity-80"
            style={{ backgroundColor: '#25D366' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path fillRule="evenodd" clipRule="evenodd"
                d="M20.463 3.488C18.217 1.24 15.231 0 12.05 0 5.495 0 .16 5.333.157 11.892c0 2.096.546 4.142 1.588 5.946L.057 24l6.304-1.654a11.88 11.88 0 005.683 1.448h.005c6.554 0 11.89-5.333 11.893-11.893.001-3.18-1.232-6.165-3.479-8.413z"
              />
            </svg>
            <span
              className="text-sm font-bold text-white"
              style={{ fontFamily: 'var(--font-jakarta)' }}
            >
              Contacter sur WhatsApp
            </span>
          </a>
        </div>

        {/* ── Détails commande ── */}
        <div
          className="rounded-2xl p-4 mb-4"
          style={{ backgroundColor: '#f8f9fa', border: '1px solid #f3f4f6' }}
        >
          <p
            className="text-xs font-bold uppercase tracking-widest mb-3"
            style={{ color: '#9ca3af', fontFamily: 'var(--font-vietnam)' }}
          >
            Détails de la commande
          </p>

          <div className="flex items-center gap-3 mb-3">
            {order.products?.photo_url ? (
              <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                <img
                  src={order.products.photo_url}
                  alt={order.products.nom}
                  className="w-full h-full object-cover"
                />
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
              <p
                className="text-sm font-bold"
                style={{ color: '#1A1C1E', fontFamily: 'var(--font-jakarta)' }}
              >
                {order.products?.nom ?? '—'}
              </p>
              <p
                className="text-xs mt-0.5"
                style={{ color: '#9ca3af', fontFamily: 'var(--font-vietnam)' }}
              >
                Quantité : {order.quantite}
              </p>
            </div>
          </div>

          <div
            className="inline-block px-4 py-2 rounded-xl"
            style={{ backgroundColor: '#FFCD00' }}
          >
            <span
              className="text-sm font-bold"
              style={{ color: '#1A1C1E', fontFamily: 'var(--font-jakarta)' }}
            >
              {formatFCFA(order.montant_total)}
            </span>
          </div>
        </div>

        {/* ── Paiement & transaction ── */}
        {payment && (
          <div
            className="rounded-2xl p-4 mb-4"
            style={{ backgroundColor: '#f8f9fa', border: '1px solid #f3f4f6' }}
          >
            <p
              className="text-xs font-bold uppercase tracking-widest mb-3"
              style={{ color: '#9ca3af', fontFamily: 'var(--font-vietnam)' }}
            >
              Paiement &amp; transaction
            </p>

            <div className="flex items-center gap-4 mb-2">
              <div>
                <p
                  className="text-xs mb-0.5"
                  style={{ color: '#9ca3af', fontFamily: 'var(--font-vietnam)' }}
                >
                  Méthode
                </p>
                <p
                  className="text-sm font-bold"
                  style={{ color: '#1A1C1E', fontFamily: 'var(--font-jakarta)' }}
                >
                  {providerLabel(payment.provider)}
                </p>
              </div>
              {payment.provider_ref && (
                <div>
                  <p
                    className="text-xs mb-0.5"
                    style={{ color: '#9ca3af', fontFamily: 'var(--font-vietnam)' }}
                  >
                    Référence
                  </p>
                  <p
                    className="text-sm font-bold"
                    style={{ color: '#1A1C1E', fontFamily: 'var(--font-jakarta)' }}
                  >
                    {payment.provider_ref.slice(0, 12)}
                  </p>
                </div>
              )}
            </div>

            {payment.paid_at && (
              <p
                className="text-xs"
                style={{ color: '#9ca3af', fontFamily: 'var(--font-vietnam)' }}
              >
                Date de transaction : {formatDateTime(payment.paid_at)}
              </p>
            )}
          </div>
        )}

        {/* ── Preuve de livraison ── (visible seulement si statut = payée) */}
        {isPayee && (
          <div
            className="rounded-2xl p-4 mb-4"
            style={{ backgroundColor: '#f8f9fa', border: '1px solid #f3f4f6' }}
          >
            <p
              className="text-xs font-bold uppercase tracking-widest mb-3"
              style={{ color: '#9ca3af', fontFamily: 'var(--font-vietnam)' }}
            >
              Preuve de livraison
            </p>

            {error && (
              <div
                className="mb-3 px-3 py-2.5 rounded-xl text-xs"
                style={{ backgroundColor: '#fef2f2', color: '#D21034', border: '1px solid #fecaca' }}
              >
                {error}
              </div>
            )}

            {previewUrl ? (
              <div className="mb-3">
                <div className="relative rounded-xl overflow-hidden" style={{ height: 160 }}>
                  <img
                    src={previewUrl}
                    alt="Preuve"
                    className="w-full h-full object-cover"
                  />
                  {uploading && (
                    <div
                      className="absolute inset-0 flex items-center justify-center"
                      style={{ backgroundColor: 'rgba(255,255,255,0.7)' }}
                    >
                      <div
                        className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
                        style={{ borderColor: '#006A4E', borderTopColor: 'transparent' }}
                      />
                    </div>
                  )}
                </div>
                {!uploading && (
                  <button
                    onClick={() => { setPreviewUrl(null); setUploadedPath(null) }}
                    className="mt-2 text-xs font-semibold"
                    style={{ color: '#D21034', fontFamily: 'var(--font-vietnam)' }}
                  >
                    Changer la photo
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex flex-col items-center justify-center gap-2 py-8 rounded-xl transition active:opacity-70"
                style={{ border: '2px dashed #d1d5db', backgroundColor: '#fff' }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 16V8m0 0l-3 3m3-3l3 3"
                    stroke="#9ca3af" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
                  />
                  <path
                    d="M3 16.5A4.5 4.5 0 007.5 21h9a4.5 4.5 0 000-9h-.5A6 6 0 003 16.5z"
                    stroke="#9ca3af" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
                  />
                </svg>
                <p
                  className="text-sm font-semibold"
                  style={{ color: '#9ca3af', fontFamily: 'var(--font-jakarta)' }}
                >
                  Ajouter une preuve de livraison
                </p>
                <p
                  className="text-xs"
                  style={{ color: '#d1d5db', fontFamily: 'var(--font-vietnam)' }}
                >
                  Photo du colis ou du reçu signé
                </p>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        )}

        {/* ── Déjà livrée ── */}
        {isLivree && (
          <div
            className="flex items-center gap-3 rounded-2xl px-4 py-3.5 mb-4"
            style={{ backgroundColor: '#f0f9f5', border: '1px solid #d1fae5' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke="#006A4E" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p
              className="text-sm font-semibold"
              style={{ color: '#006A4E', fontFamily: 'var(--font-jakarta)' }}
            >
              Cette commande a été marquée comme livrée.
            </p>
          </div>
        )}

        {/* ── Bouton Marquer comme livrée ── */}
        {isPayee && (
          <button
            onClick={handleMarkDelivered}
            disabled={!canMarkDelivered || marking}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-white text-sm font-bold transition"
            style={{
              backgroundColor: canMarkDelivered && !marking ? '#006A4E' : '#a3c9bc',
              fontFamily: 'var(--font-jakarta)',
              cursor: canMarkDelivered && !marking ? 'pointer' : 'not-allowed',
            }}
          >
            {marking ? (
              <div
                className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: '#fff', borderTopColor: 'transparent' }}
              />
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M5 13l4 4L19 7" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Marquer comme livrée
              </>
            )}
          </button>
        )}

        {!isPayee && !isLivree && (
          <div
            className="flex items-center gap-2 px-4 py-3 rounded-2xl"
            style={{ backgroundColor: '#fff3e0' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 8v4m0 4h.01" stroke="#b45309" strokeWidth={2} strokeLinecap="round"/>
              <circle cx="12" cy="12" r="9" stroke="#b45309" strokeWidth={2}/>
            </svg>
            <p
              className="text-xs font-semibold"
              style={{ color: '#b45309', fontFamily: 'var(--font-vietnam)' }}
            >
              En attente de confirmation de paiement.
            </p>
          </div>
        )}

      </div>
    </div>
  )
}