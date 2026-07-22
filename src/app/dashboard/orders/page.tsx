'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/src/lib/supabase/client'

// ─── Types ────────────────────────────────────────────────────────────────────

type Order = {
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
  } | null
}

type Filtre = 'toutes' | 'en_attente' | 'payée' | 'livrée' | 'annulée'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatFCFA(amount: number): string {
  return amount.toLocaleString('fr-FR').replace(/\s/g, '.') + ' FCFA'
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatOrderId(id: string): string {
  return '#' + id.slice(0, 5).toUpperCase()
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

const BADGE: Record<string, { label: string; bg: string; color: string }> = {
  en_attente: { label: 'EN ATTENTE', bg: '#fff3e0', color: '#b45309' },
  payée:      { label: 'PAYÉE',      bg: '#dcfce7', color: '#15803d' },
  livrée:     { label: 'LIVRÉE',     bg: '#eff6ff', color: '#2563eb' },
  annulée:    { label: 'ANNULÉE',    bg: '#fef2f2', color: '#D21034' },
}

const FILTRES: { key: Filtre; label: string }[] = [
  { key: 'toutes',     label: 'Toutes'     },
  { key: 'en_attente', label: 'En attente' },
  { key: 'payée',      label: 'Payées'     },
  { key: 'livrée',     label: 'Livrées'    },
  { key: 'annulée',    label: 'Annulées'   },
]

// ─── Bottom Nav ───────────────────────────────────────────────────────────────

function BottomNav() {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 bg-white flex items-center justify-around px-4 py-2"
      style={{ borderTop: '1px solid #f3f4f6' }}
    >
      {[
        {
          href: '/dashboard',
          label: 'Home',
          active: false,
          icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          ),
        },
        {
          href: '/dashboard/orders',
          label: 'Comandes',
          active: true,
          icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#006A4E" strokeWidth={2}>
              <rect x="3" y="3" width="18" height="18" rx="3" strokeWidth={2}/>
              <path strokeLinecap="round" d="M7 8h10M7 12h10M7 16h6" strokeWidth={2}/>
            </svg>
          ),
        },
        {
          href: '/dashboard/products',
          label: 'Products',
          active: false,
          icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          ),
        },
        {
          href: '/dashboard/profile',
          label: 'Profile',
          active: false,
          icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          ),
        },
      ].map(({ href, label, icon, active }) => (
        <Link key={href} href={href} className="flex flex-col items-center gap-1 py-1">
          {icon}
          <span
            className="text-xs font-semibold"
            style={{
              color: active ? '#006A4E' : '#9ca3af',
              fontFamily: 'var(--font-vietnam)',
            }}
          >
            {label}
          </span>
        </Link>
      ))}
    </div>
  )
}

// ─── Composant Card ───────────────────────────────────────────────────────────

function OrderCard({ order }: { order: Order }) {
  const router = useRouter()
  const badge = BADGE[order.statut]
  const whatsappNumber = order.client_whatsapp.replace('+', '')

  return (
    <div
      className="rounded-2xl px-4 py-4 mb-3 cursor-pointer active:opacity-80 transition"
      style={{ backgroundColor: '#fff', border: '1px solid #f3f4f6' }}
      onClick={() => router.push(`/dashboard/orders/${order.id}`)}
    >
      {/* Numéro + badge */}
      <div className="flex items-center justify-between mb-2">
        <span
          className="text-xs font-bold"
          style={{ color: '#9ca3af', fontFamily: 'var(--font-vietnam)' }}
        >
          No Commande {formatOrderId(order.id)}
        </span>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: badge.bg, color: badge.color, fontFamily: 'var(--font-vietnam)' }}
        >
          {badge.label}
        </span>
      </div>

      {/* Avatar + nom */}
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: couleurAvatar(order.client_nom) }}
        >
          <span
            className="text-xs font-bold text-white"
            style={{ fontFamily: 'var(--font-jakarta)' }}
          >
            {initiales(order.client_nom)}
          </span>
        </div>
        <span
          className="text-sm font-bold"
          style={{ color: '#1A1C1E', fontFamily: 'var(--font-jakarta)' }}
        >
          {order.client_nom}
        </span>
      </div>

      {/* Produit + montant */}
      <div className="flex items-center gap-3 mb-3">
        {order.products?.photo_url ? (
          <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
            <img
              src={order.products.photo_url}
              alt={order.products.nom}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#e6f4ee' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                stroke="#006A4E"
              />
            </svg>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-semibold truncate"
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
        <div
          className="px-3 py-1.5 rounded-xl flex-shrink-0"
          style={{ backgroundColor: '#FFCD00' }}
        >
          <span
            className="text-xs font-bold"
            style={{ color: '#1A1C1E', fontFamily: 'var(--font-jakarta)' }}
          >
            {formatFCFA(order.montant_total)}
          </span>
        </div>
      </div>

      {/* Date + WhatsApp */}
      <div className="flex items-center justify-between">
        <span
          className="text-xs"
          style={{ color: '#9ca3af', fontFamily: 'var(--font-vietnam)' }}
        >
          {formatDate(order.created_at)}
        </span>
        <a
          href={`https://wa.me/${whatsappNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition active:opacity-70"
          style={{ backgroundColor: '#f0f9f5' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="#006A4E">
            <path fillRule="evenodd" clipRule="evenodd"
              d="M20.463 3.488C18.217 1.24 15.231 0 12.05 0 5.495 0 .16 5.333.157 11.892c0 2.096.546 4.142 1.588 5.946L.057 24l6.304-1.654a11.88 11.88 0 005.683 1.448h.005c6.554 0 11.89-5.333 11.893-11.893.001-3.18-1.232-6.165-3.479-8.413z"
            />
          </svg>
          <span
            className="text-xs font-semibold"
            style={{ color: '#006A4E', fontFamily: 'var(--font-vietnam)' }}
          >
            WhatsApp
          </span>
        </a>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filtre, setFiltre] = useState<Filtre>('toutes')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: products } = await supabase
        .from('products')
        .select('id')
        .eq('seller_id', user.id)

      const productIds = products?.map(p => p.id) ?? []
      if (productIds.length === 0) { setLoading(false); return }

      const { data } = await supabase
        .from('orders')
        .select('id, client_nom, client_whatsapp, quantite, montant_total, statut, created_at, products(nom, photo_url)')
        .in('product_id', productIds)
        .order('created_at', { ascending: false })

      setOrders((data as unknown as Order[]) ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = orders.filter(o => {
    const matchFiltre = filtre === 'toutes' || o.statut === filtre
    const matchSearch = o.client_nom.toLowerCase().includes(search.toLowerCase())
    return matchFiltre && matchSearch
  })

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid #f3f4f6' }}
      >
        <div className="flex items-center gap-2">
          <img src="/PeerWize.svg" alt="PeerWize" className="h-7 w-7 rounded-lg" />
          <span
            className="text-base font-bold"
            style={{ color: '#1A1C1E', fontFamily: 'var(--font-jakarta)' }}
          >
            PeerWize
          </span>
        </div>
        <span
          className="text-base font-bold"
          style={{ color: '#1A1C1E', fontFamily: 'var(--font-jakarta)' }}
        >
          Commandes
        </span>
        <div className="w-8" />
      </div>

      {/* Recherche */}
      <div className="px-4 pt-4 pb-2">
        <div
          className="flex items-center gap-2 rounded-xl px-3 py-2.5"
          style={{ backgroundColor: '#f8f9fa', border: '1.5px solid #e5e7eb' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth={2}>
            <circle cx="11" cy="11" r="8"/>
            <path strokeLinecap="round" d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un client…"
            className="flex-1 text-sm bg-transparent focus:outline-none"
            style={{ color: '#1A1C1E', fontFamily: 'var(--font-vietnam)' }}
          />
          {search && (
            <button onClick={() => setSearch('')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth={2}>
                <path strokeLinecap="round" d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Filtres */}
      <div className="px-4 pb-3 overflow-x-auto">
        <div className="flex gap-2 w-max">
          {FILTRES.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFiltre(key)}
              className="px-4 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap"
              style={{
                backgroundColor: filtre === key ? '#006A4E' : '#f3f4f6',
                color: filtre === key ? '#fff' : '#6b7280',
                fontFamily: 'var(--font-vietnam)',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Liste */}
      <div className="flex-1 px-4 pb-28 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div
              className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: '#006A4E', borderTopColor: 'transparent' }}
            />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="mb-3">
              <rect x="3" y="3" width="18" height="18" rx="3" stroke="#d1d5db" strokeWidth={1.5}/>
              <path d="M7 8h10M7 12h6" stroke="#d1d5db" strokeWidth={1.5} strokeLinecap="round"/>
            </svg>
            <p
              className="text-sm font-semibold mb-1"
              style={{ color: '#9ca3af', fontFamily: 'var(--font-jakarta)' }}
            >
              Aucune commande
            </p>
            <p
              className="text-xs"
              style={{ color: '#d1d5db', fontFamily: 'var(--font-vietnam)' }}
            >
              {search ? 'Aucun résultat pour cette recherche.' : 'Les commandes apparaîtront ici.'}
            </p>
          </div>
        ) : (
          filtered.map(order => <OrderCard key={order.id} order={order} />)
        )}
      </div>

      <BottomNav />
    </div>
  )
}