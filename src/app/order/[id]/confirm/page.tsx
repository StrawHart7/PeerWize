import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/src/lib/supabase/server'

// ─── Types ────────────────────────────────────────────────────────────────────

type Order = {
  id: string
  montant_total: number
  quantite: number
  statut: string
  products: {
    nom: string
    photo_url: string | null
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
    moov_tg:  'Flooz',
    togocel:  'T-Money',
    card:     'Carte',
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

export default async function ConfirmPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data } = await supabase
    .from('orders')
    .select('id, montant_total, quantite, statut, products(nom, photo_url), payments(provider)')
    .eq('id', id)
    .single()

  if (!data) notFound()

  const order = data as unknown as Order
  const product = order.products
  const provider = order.payments?.[0]?.provider ?? 'moov_tg'

  return (
    <div className="min-h-screen bg-white flex flex-col px-5 pt-10 pb-10">

      {/* ── Logo + check ── */}
      <div className="flex flex-col items-center mb-6">
        <img src="/PeerWize.svg" alt="PeerWize" className="h-10 w-10 rounded-xl mb-4" />
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
          style={{ backgroundColor: '#006A4E' }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M5 13l4 4L19 7" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h1
          className="text-2xl font-bold mb-1"
          style={{ color: '#1A1C1E', fontFamily: 'var(--font-jakarta)' }}
        >
          Commande reçue !
        </h1>
        <p
          className="text-sm text-center"
          style={{ color: '#6b7280', fontFamily: 'var(--font-vietnam)', maxWidth: 260 }}
        >
          Le vendeur a été notifié. Tu recevras une confirmation sur WhatsApp.
        </p>
      </div>

      {/* ── Carte commande ── */}
      <div
        className="rounded-2xl p-4 mb-4"
        style={{ backgroundColor: '#f8f9fa', border: '1px solid #f3f4f6' }}
      >
        {/* En-tête commande */}
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

        {/* Produit */}
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
            <p
              className="text-sm font-semibold"
              style={{ color: '#1A1C1E', fontFamily: 'var(--font-jakarta)' }}
            >
              {product?.nom ?? '—'}
            </p>
            <p
              className="text-xs mt-0.5"
              style={{ color: '#9ca3af', fontFamily: 'var(--font-vietnam)' }}
            >
              Quantité : {order.quantite}
            </p>
          </div>
        </div>

        {/* Montant + méthode */}
        <div className="flex items-center gap-3">
          <div
            className="flex-1 rounded-xl px-3 py-2.5"
            style={{ backgroundColor: '#FFCD00' }}
          >
            <p
              className="text-xs font-bold uppercase tracking-wide mb-0.5"
              style={{ color: '#92710a', fontFamily: 'var(--font-vietnam)' }}
            >
              Montant
            </p>
            <p
              className="text-base font-bold"
              style={{ color: '#1A1C1E', fontFamily: 'var(--font-jakarta)' }}
            >
              {formatFCFA(order.montant_total)}
            </p>
          </div>
          <div
            className="flex-1 rounded-xl px-3 py-2.5"
            style={{ backgroundColor: '#fff', border: '1px solid #f3f4f6' }}
          >
            <p
              className="text-xs font-bold uppercase tracking-wide mb-1"
              style={{ color: '#9ca3af', fontFamily: 'var(--font-vietnam)' }}
            >
              Méthode
            </p>
            <div className="flex items-center gap-1.5">
              <ProviderIcon provider={provider} />
              <p
                className="text-sm font-semibold"
                style={{ color: '#1A1C1E', fontFamily: 'var(--font-jakarta)' }}
              >
                {providerLabel(provider)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bannière WhatsApp ── */}
      <div
        className="flex items-center gap-3 rounded-2xl px-4 py-3.5 mb-6"
        style={{ backgroundColor: '#f0f9f5', border: '1px solid #d1fae5' }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
          <path fillRule="evenodd" clipRule="evenodd"
            d="M20.463 3.488C18.217 1.24 15.231 0 12.05 0 5.495 0 .16 5.333.157 11.892c0 2.096.546 4.142 1.588 5.946L.057 24l6.304-1.654a11.88 11.88 0 005.683 1.448h.005c6.554 0 11.89-5.333 11.893-11.893.001-3.18-1.232-6.165-3.479-8.413z"
            fill="#25D366"
          />
          <path
            d="M12.05 21.785h-.004a9.873 9.873 0 01-5.031-1.378l-.361-.214-3.741.981.998-3.648-.235-.374A9.861 9.861 0 012.165 11.9c.003-5.456 4.44-9.89 9.899-9.89a9.836 9.836 0 016.993 2.9 9.836 9.836 0 012.893 6.994c-.003 5.457-4.44 9.881-9.9 9.881z"
            fill="#25D366"
          />
          <path
            d="M9.013 7.412l-.358-.019c-.12 0-.239.042-.329.125-.179.166-.688.671-.688 1.636 0 .965.703 1.899.801 2.028.098.13 1.37 2.175 3.368 2.963 1.667.656 2.004.525 2.365.492.361-.033 1.164-.476 1.328-.934.164-.457.164-.849.115-.934-.049-.085-.179-.13-.377-.228-.197-.098-1.164-.574-1.344-.64-.18-.066-.311-.098-.442.098-.13.197-.508.64-.622.77-.115.13-.23.147-.427.049-.197-.098-.833-.307-1.588-.98-.587-.524-.983-1.17-1.098-1.367-.115-.197-.012-.303.086-.4.089-.088.197-.23.296-.344.098-.115.13-.197.197-.328.066-.13.033-.245-.017-.343-.049-.098-.442-1.067-.607-1.46-.16-.381-.323-.329-.442-.335z"
            fill="white"
          />
        </svg>
        <p
          className="text-sm font-medium"
          style={{ color: '#006A4E', fontFamily: 'var(--font-vietnam)' }}
        >
          Surveille ton WhatsApp pour les détails de la livraison.
        </p>
      </div>

      {/* ── Actions ── */}
      <div className="space-y-3 mt-auto">
        <Link
          href="/dashboard/orders"
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-white text-sm font-bold"
          style={{ backgroundColor: '#006A4E', fontFamily: 'var(--font-jakarta)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="18" height="18" rx="3" stroke="white" strokeWidth={2}/>
            <path d="M7 8h10M7 12h10M7 16h6" stroke="white" strokeWidth={2} strokeLinecap="round"/>
          </svg>
          Voir mes commandes
        </Link>

        <Link
          href={`/p/${data.products && 'slug' in (data.products as object) ? (data.products as { slug?: string }).slug ?? '' : ''}`}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold"
          style={{
            color: '#1A1C1E',
            fontFamily: 'var(--font-jakarta)',
            border: '1.5px solid #e5e7eb',
            backgroundColor: '#fff',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1A1C1E" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Retour à la boutique
        </Link>
      </div>

    </div>
  )
}