'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/client'
import Link from 'next/link'

// ─── Types ───────────────────────────────────────────────────────────────────

type Seller = {
  nom: string
  whatsapp: string
}

type RecentOrder = {
  id: string
  client_nom: string
  client_whatsapp: string
  montant_total: number
  statut: 'en_attente' | 'payée' | 'livrée' | 'annulée'
  created_at: string
  products: { nom: string } | null
}

type Stats = {
  revenus_mois: number
  commandes_jour: number
  en_attente: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  '#006A4E', '#1a7a5e', '#2d6a8f', '#7c3aed',
  '#b45309', '#0369a1', '#15803d', '#be185d',
]

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('')
}

function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function formatFCFA(amount: number): string {
  return amount.toLocaleString('fr-FR').replace(/\s/g, '.') + ' FCFA'
}

function formatRevenuFCFA(amount: number): string {
  // Affichage style "450.000 FCFA" pour le bloc revenus
  return amount.toLocaleString('fr-FR').replace(/\s/g, '.')
}

const STATUT_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  livrée:    { label: 'Livré',       bg: '#e6f4ee', color: '#006A4E' },
  payée:     { label: 'En cours',    bg: '#fff7e0', color: '#b45309' },
  en_attente:{ label: 'En attente',  bg: '#fef2f2', color: '#D21034' },
  annulée:   { label: 'Annulée',     bg: '#f3f4f6', color: '#6b7280' },
}

// ─── Composants enfants ───────────────────────────────────────────────────────

function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  return (
    <div
      className="flex items-center justify-center flex-shrink-0 rounded-full"
      style={{
        width: size,
        height: size,
        backgroundColor: getAvatarColor(name),
        fontFamily: 'var(--font-jakarta)',
        fontSize: size * 0.35,
        fontWeight: 700,
        color: '#fff',
        letterSpacing: '0.02em',
      }}
    >
      {getInitials(name)}
    </div>
  )
}

function StatutBadge({ statut }: { statut: string }) {
  const cfg = STATUT_CONFIG[statut] ?? STATUT_CONFIG['annulée']
  return (
    <span
      className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ backgroundColor: cfg.bg, color: cfg.color, fontFamily: 'var(--font-vietnam)' }}
    >
      {cfg.label}
    </span>
  )
}

function BottomNav({ active }: { active: 'home' | 'orders' | 'products' | 'profile' }) {
  const items = [
    { key: 'home',     label: 'Accueil',     href: '/dashboard',          icon: HomeIcon },
    { key: 'orders',   label: 'Commandes',   href: '/dashboard/orders',   icon: OrdersIcon },
    { key: 'products', label: 'Produits', href: '/dashboard/products', icon: ProductsIcon },
    { key: 'profile',  label: 'Profil',  href: '/dashboard/profile',  icon: ProfileIcon },
  ] as const

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 flex items-center justify-around border-t border-gray-100 bg-white"
      style={{ height: 64, zIndex: 50 }}
    >
      {items.map(({ key, label, href, icon: Icon }) => {
        const isActive = active === key
        return (
          <Link
            key={key}
            href={href}
            className="flex flex-col items-center justify-center gap-1 flex-1 h-full"
          >
            <Icon active={isActive} />
            <span
              className="text-xs font-medium"
              style={{
                color: isActive ? '#006A4E' : '#9ca3af',
                fontFamily: 'var(--font-vietnam)',
              }}
            >
              {label}
            </span>
            {isActive && (
              <span
                className="absolute bottom-0 block rounded-full"
                style={{ width: 32, height: 3, backgroundColor: '#FFCD00' }}
              />
            )}
          </Link>
        )
      })}
    </nav>
  )
}

// ─── Icônes bottom nav ────────────────────────────────────────────────────────

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"
        fill={active ? '#006A4E' : 'none'}
        stroke={active ? '#006A4E' : '#9ca3af'} strokeWidth={1.8}
      />
      <path d="M9 21V12h6v9" stroke={active ? '#fff' : '#9ca3af'} strokeWidth={1.8} strokeLinecap="round"/>
    </svg>
  )
}

function OrdersIcon({ active }: { active: boolean }) {
  const c = active ? '#006A4E' : '#9ca3af'
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="3" stroke={c} strokeWidth={1.8}/>
      <path d="M7 8h10M7 12h10M7 16h6" stroke={c} strokeWidth={1.8} strokeLinecap="round"/>
    </svg>
  )
}

function ProductsIcon({ active }: { active: boolean }) {
  const c = active ? '#006A4E' : '#9ca3af'
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="2" width="9" height="9" rx="2" fill={active ? '#006A4E' : 'none'} stroke={c} strokeWidth={1.8}/>
      <rect x="13" y="2" width="9" height="9" rx="2" stroke={c} strokeWidth={1.8}/>
      <rect x="2" y="13" width="9" height="9" rx="2" stroke={c} strokeWidth={1.8}/>
      <rect x="13" y="13" width="9" height="9" rx="2" fill={active ? '#FFCD00' : 'none'} stroke={c} strokeWidth={1.8}/>
    </svg>
  )
}

function ProfileIcon({ active }: { active: boolean }) {
  const c = active ? '#006A4E' : '#9ca3af'
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke={c} strokeWidth={1.8}/>
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={c} strokeWidth={1.8} strokeLinecap="round"/>
    </svg>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()

  const [seller, setSeller] = useState<Seller | null>(null)
  const [stats, setStats] = useState<Stats>({ revenus_mois: 0, commandes_jour: 0, en_attente: 0 })
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      // Seller info
      const { data: sellerData } = await supabase
        .from('sellers')
        .select('nom, whatsapp')
        .eq('id', user.id)
        .single()

      if (sellerData) setSeller(sellerData)

      // Toutes les commandes du vendeur (via products)
      const { data: allOrders } = await supabase
        .from('orders')
        .select('id, montant_total, statut, created_at, products!inner(seller_id)')
        .eq('products.seller_id', user.id)

      if (allOrders) {
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const startOfDay   = new Date(now.getFullYear(), now.getMonth(), now.getDate())

        const revenus_mois = allOrders
          .filter(o => o.statut === 'payée' || o.statut === 'livrée')
          .filter(o => new Date(o.created_at) >= startOfMonth)
          .reduce((acc, o) => acc + (o.montant_total ?? 0), 0)

        const commandes_jour = allOrders
          .filter(o => new Date(o.created_at) >= startOfDay)
          .length

        const en_attente = allOrders
          .filter(o => o.statut === 'en_attente')
          .length

        setStats({ revenus_mois, commandes_jour, en_attente })
      }

      // Dernières commandes avec nom produit
      const { data: recent } = await supabase
        .from('orders')
        .select('id, client_nom, client_whatsapp, montant_total, statut, created_at, products!inner(nom, seller_id)')
        .eq('products.seller_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (recent) {
        setRecentOrders(
          recent.map(o => ({
            ...o,
            products: Array.isArray(o.products) ? o.products[0] : o.products,
          }))
        )
      }

      setLoading(false)
    }

    load()
  }, [])

  const prenom = seller?.nom?.split(' ')[0] ?? 'Vendeur'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: '#006A4E', borderTopColor: 'transparent' }}
          />
          <span className="text-sm text-gray-400" style={{ fontFamily: 'var(--font-vietnam)' }}>
            Chargement...
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white pb-20">

      {/* ── Header ── */}
      <div className="px-5 pt-5 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {/* Logo PeerWize */}
          <img src="/PeerWize.svg" alt="PeerWize" className="h-8 w-8 rounded-lg" />
          <span
            className="text-base font-bold"
            style={{ color: '#1A1C1E', fontFamily: 'var(--font-jakarta)' }}
          >
            PeerWize
          </span>
        </div>
        <button className="relative p-2 rounded-full hover:bg-gray-100 transition">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A1C1E" strokeWidth={1.8}>
            <path strokeLinecap="round" d="M15 17H20L18.595 15.595A1 1 0 0118 14.806V11a6 6 0 10-12 0v3.806a1 1 0 01-.595.799L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
          </svg>
          {/* Badge notif */}
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
            style={{ backgroundColor: '#D21034' }}
          />
        </button>
      </div>

      {/* ── Salutation ── */}
      <div className="px-5 mb-5">
        <h1
          className="text-xl font-bold"
          style={{ color: '#1A1C1E', fontFamily: 'var(--font-jakarta)' }}
        >
          Bonjour, {prenom} 👋
        </h1>
        <p className="text-sm text-gray-500 mt-0.5" style={{ fontFamily: 'var(--font-vietnam)' }}>
          Voici l'activité de votre boutique aujourd'hui.
        </p>
      </div>

      {/* ── Carte Revenus du mois ── */}
      <div className="px-5 mb-4">
        <div
          className="rounded-2xl px-5 py-4 flex items-center justify-between"
          style={{ backgroundColor: '#f0f9f5' }}
        >
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1" style={{ fontFamily: 'var(--font-vietnam)' }}>
              Revenus du mois
            </p>
            <p
              className="text-3xl font-bold"
              style={{ color: '#006A4E', fontFamily: 'var(--font-jakarta)', letterSpacing: '-0.02em' }}
            >
              {formatRevenuFCFA(stats.revenus_mois)}
            </p>
            <p className="text-xs font-semibold text-gray-400 mt-0.5" style={{ fontFamily: 'var(--font-vietnam)' }}>
              FCFA
            </p>
          </div>
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: '#FFCD00' }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-4H9l3-7 3 7h-2v4z" fill="#1A1C1E"/>
            </svg>
          </div>
        </div>
      </div>

      {/* ── Stats cards ── */}
      <div className="px-5 mb-6 grid grid-cols-2 gap-3">
        {/* Commandes jour */}
        <div
          className="rounded-2xl px-4 py-4"
          style={{ backgroundColor: '#f8f9fa' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: '#e6f4ee' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="#006A4E" strokeWidth={2} strokeLinecap="round"/>
                <line x1="3" y1="6" x2="21" y2="6" stroke="#006A4E" strokeWidth={2}/>
                <path d="M16 10a4 4 0 01-8 0" stroke="#006A4E" strokeWidth={2} strokeLinecap="round"/>
              </svg>
            </div>
            <span className="text-xs text-gray-500" style={{ fontFamily: 'var(--font-vietnam)' }}>
              Commandes jour
            </span>
          </div>
          <p
            className="text-3xl font-bold"
            style={{ color: '#1A1C1E', fontFamily: 'var(--font-jakarta)' }}
          >
            {stats.commandes_jour}
          </p>
        </div>

        {/* En attente */}
        <div
          className="rounded-2xl px-4 py-4"
          style={{ backgroundColor: '#f8f9fa' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: '#fff7e0' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#b45309" strokeWidth={2}/>
                <polyline points="12 6 12 12 16 14" stroke="#b45309" strokeWidth={2} strokeLinecap="round"/>
              </svg>
            </div>
            <span className="text-xs text-gray-500" style={{ fontFamily: 'var(--font-vietnam)' }}>
              En attente
            </span>
          </div>
          <p
            className="text-3xl font-bold"
            style={{ color: '#1A1C1E', fontFamily: 'var(--font-jakarta)' }}
          >
            {stats.en_attente}
          </p>
        </div>
      </div>

      {/* ── Dernières commandes ── */}
      <div className="px-5">
        <div className="flex items-center justify-between mb-4">
          <h2
            className="text-base font-bold"
            style={{ color: '#1A1C1E', fontFamily: 'var(--font-jakarta)' }}
          >
            Dernières Commandes
          </h2>
          <Link
            href="/dashboard/orders"
            className="text-sm font-semibold"
            style={{ color: '#006A4E', fontFamily: 'var(--font-vietnam)' }}
          >
            Voir tout
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: '#f0f9f5' }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="#006A4E" strokeWidth={1.8} strokeLinecap="round"/>
                <line x1="3" y1="6" x2="21" y2="6" stroke="#006A4E" strokeWidth={1.8}/>
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-500" style={{ fontFamily: 'var(--font-jakarta)' }}>
              Aucune commande pour l'instant
            </p>
            <p className="text-xs text-gray-400 text-center" style={{ fontFamily: 'var(--font-vietnam)' }}>
              Partagez vos liens produit pour recevoir vos premières commandes.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentOrders.map(order => (
              <Link
                key={order.id}
                href={`/dashboard/orders/${order.id}`}
                className="flex items-center gap-3 py-3 border-b border-gray-50 active:bg-gray-50 transition rounded-xl"
              >
                <Avatar name={order.client_nom} size={44} />
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-semibold truncate"
                    style={{ color: '#1A1C1E', fontFamily: 'var(--font-jakarta)' }}
                  >
                    {order.client_nom}
                  </p>
                  <p
                    className="text-xs text-gray-400 truncate mt-0.5"
                    style={{ fontFamily: 'var(--font-vietnam)' }}
                  >
                    {order.products?.nom ?? '—'}
                  </p>
                  <div className="mt-1.5">
                    <StatutBadge statut={order.statut} />
                  </div>
                </div>
                <p
                  className="text-sm font-bold flex-shrink-0"
                  style={{ color: '#1A1C1E', fontFamily: 'var(--font-jakarta)' }}
                >
                  {formatFCFA(order.montant_total)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ── FAB ── */}
      <Link
        href="/dashboard/products/new"
        className="fixed flex items-center justify-center rounded-full shadow-lg"
        style={{
          bottom: 80,
          right: 20,
          width: 56,
          height: 56,
          backgroundColor: '#1A1C1E',
          zIndex: 40,
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth={2.2} strokeLinecap="round"/>
        </svg>
      </Link>

      {/* ── Bottom nav ── */}
      <BottomNav active="home" />
    </div>
  )
}