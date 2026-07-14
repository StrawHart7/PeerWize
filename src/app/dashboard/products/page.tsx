'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/client'

type Product = {
  id: string
  nom: string
  prix_fcfa: number
  photo_url: string | null
  slug: string
  actif: boolean
}

function formatFCFA(amount: number): string {
  return amount.toLocaleString('fr-FR').replace(/\s/g, '.') + ' FCFA'
}

function BottomNav() {
  const pathname = usePathname()
  const items = [
    {
      href: '/dashboard',
      label: 'Home',
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M3 12L12 4l9 8" stroke={active ? '#006A4E' : '#9ca3af'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M5 10v9a1 1 0 001 1h4v-4h4v4h4a1 1 0 001-1v-9" stroke={active ? '#006A4E' : '#9ca3af'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      href: '/dashboard/orders',
      label: 'Orders',
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="18" height="18" rx="3" stroke={active ? '#006A4E' : '#9ca3af'} strokeWidth={2}/>
          <path d="M7 8h10M7 12h10M7 16h6" stroke={active ? '#006A4E' : '#9ca3af'} strokeWidth={2} strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      href: '/dashboard/products',
      label: 'Products',
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="7" height="7" rx="1.5" stroke={active ? '#006A4E' : '#9ca3af'} strokeWidth={2}/>
          <rect x="14" y="3" width="7" height="7" rx="1.5" stroke={active ? '#006A4E' : '#9ca3af'} strokeWidth={2}/>
          <rect x="3" y="14" width="7" height="7" rx="1.5" stroke={active ? '#006A4E' : '#9ca3af'} strokeWidth={2}/>
          <rect x="14" y="14" width="7" height="7" rx="1.5" stroke={active ? '#006A4E' : '#9ca3af'} strokeWidth={2}/>
        </svg>
      ),
    },
    {
      href: '/dashboard/profile',
      label: 'Profile',
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="8" r="4" stroke={active ? '#006A4E' : '#9ca3af'} strokeWidth={2}/>
          <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" stroke={active ? '#006A4E' : '#9ca3af'} strokeWidth={2} strokeLinecap="round"/>
        </svg>
      ),
    },
  ]
  return (
    <div
      className="fixed bottom-0 left-0 right-0 bg-white flex items-center justify-around px-2 py-3"
      style={{ borderTop: '1px solid #f3f4f6' }}
    >
      {items.map(({ href, label, icon }) => {
        const active = pathname === href
        return (
          <Link key={href} href={href} className="flex flex-col items-center gap-1 py-1 px-3">
            {icon(active)}
            <span
              className="text-xs"
              style={{
                color: active ? '#006A4E' : '#9ca3af',
                fontFamily: 'var(--font-vietnam)',
                fontWeight: active ? 600 : 400,
              }}
            >
              {label}
            </span>
          </Link>
        )
      })}
    </div>
  )
}

export default function ProductsPage() {
  const supabase = createClient()
  const [products, setProducts] = useState<Product[]>([])
  const [filtered, setFiltered] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: seller } = await supabase
        .from('sellers')
        .select('id')
        .eq('email', user.email)
        .single()

      if (!seller) return

      const { data } = await supabase
        .from('products')
        .select('id, nom, prix_fcfa, photo_url, slug, actif')
        .eq('seller_id', seller.id)
        .order('created_at', { ascending: false })

      setProducts(data ?? [])
      setFiltered(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    const q = search.toLowerCase().trim()
    setFiltered(q ? products.filter(p => p.nom.toLowerCase().includes(q)) : products)
  }, [search, products])

  return (
    <div className="min-h-screen bg-white pb-24">

      {/* ── Header vert ── */}
      <div className="px-5 pt-12 pb-6" style={{ backgroundColor: '#006A4E' }}>
        <div className="flex items-center justify-between mb-6">
          <img src="/PeerWize.svg" alt="PeerWize" className="h-8 w-8 rounded-lg" />
          <button
            className="p-2 rounded-full"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17H20L18.595 15.595A1 1 0 0118 14.808V11a6 6 0 10-12 0v3.808a1 1 0 01-.405.794L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
        </div>

        <div
          className="rounded-2xl px-5 py-5"
          style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
        >
          <p
            className="text-lg font-bold text-white mb-1"
            style={{ fontFamily: 'var(--font-jakarta)' }}
          >
            Ajoutez vos produits
          </p>
          <p
            className="text-sm text-white mb-4"
            style={{ fontFamily: 'var(--font-vietnam)', opacity: 0.75 }}
          >
            Partagez le lien et recevez des commandes
          </p>
          <Link
            href="/dashboard/products/new"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold"
            style={{ backgroundColor: '#FFCD00', color: '#1A1C1E', fontFamily: 'var(--font-jakarta)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1A1C1E" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
            </svg>
            Ajouter un produit
          </Link>
        </div>
      </div>

      {/* ── Liste ── */}
      <div className="px-5 pt-5">
        <h2
          className="text-lg font-bold mb-3"
          style={{ color: '#1A1C1E', fontFamily: 'var(--font-jakarta)' }}
        >
          Vos Produits
        </h2>

        <div
          className="flex items-center gap-2 rounded-xl px-3 py-3 mb-5"
          style={{ backgroundColor: '#f8f9fa', border: '1px solid #f3f4f6' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un produit..."
            className="flex-1 bg-transparent text-sm focus:outline-none"
            style={{ color: '#1A1C1E', fontFamily: 'var(--font-vietnam)' }}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div
              className="w-8 h-8 rounded-full border-2 animate-spin"
              style={{ borderColor: '#006A4E', borderTopColor: 'transparent' }}
            />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: '#f0f9f5' }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  stroke="#006A4E"
                />
              </svg>
            </div>
            <p className="text-sm font-semibold mb-1" style={{ color: '#1A1C1E', fontFamily: 'var(--font-jakarta)' }}>
              {search ? 'Aucun résultat' : 'Aucun produit encore'}
            </p>
            <p className="text-xs" style={{ color: '#9ca3af', fontFamily: 'var(--font-vietnam)' }}>
              {search ? 'Essayez un autre mot-clé' : 'Ajoutez votre premier produit ci-dessus'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(product => (
              <Link
                key={product.id}
                href={`/p/${product.slug}`}
                className="block rounded-2xl overflow-hidden active:opacity-90 transition"
                style={{ border: '1px solid #f3f4f6', backgroundColor: '#fff' }}
              >
                {/* Image */}
                <div
                  className="w-full flex items-center justify-center"
                  style={{ height: 220, backgroundColor: '#f5f5f5' }}
                >
                  {product.photo_url ? (
                    <img
                      src={product.photo_url}
                      alt={product.nom}
                      className="h-full w-full object-contain"
                      style={{ padding: '12px' }}
                    />
                  ) : (
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                        stroke="#9ca3af"
                      />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                        stroke="#9ca3af"
                      />
                    </svg>
                  )}
                </div>

                {/* Infos */}
                <div className="px-4 py-3">
                  <p
                    className="text-sm font-bold mb-1"
                    style={{ color: '#1A1C1E', fontFamily: 'var(--font-jakarta)' }}
                  >
                    {product.nom}
                  </p>
                  <span
                    className="text-base font-bold"
                    style={{ color: '#006A4E', fontFamily: 'var(--font-jakarta)' }}
                  >
                    {formatFCFA(product.prix_fcfa)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}