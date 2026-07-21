// src/app/order/[id]/processing/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/client'

const POLL_INTERVAL = 2000  // 2s
const MAX_WAIT = 120000     // 2 min max

export default function ProcessingPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const orderId = params.id as string
  const slug = searchParams.get('slug') ?? ''

  const [timedOut, setTimedOut] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (!orderId) return

    let elapsed = 0
    let stopped = false

    async function poll() {
      if (stopped) return

      const { data } = await supabase
        .from('orders')
        .select('statut')
        .eq('id', orderId)
        .single()

      if (stopped) return

      if (data?.statut === 'payée') {
        stopped = true
        router.push(`/order/${orderId}/confirm`)
        return
      }

      if (data?.statut === 'annulée') {
        stopped = true
        // Redirige vers la page pay du bon produit avec message d'erreur
        if (slug) {
          router.push(`/p/${slug}/pay?order=${orderId}&error=declined`)
        } else {
          router.push('/')
        }
        return
      }

      elapsed += POLL_INTERVAL

      if (elapsed >= MAX_WAIT) {
        stopped = true
        setTimedOut(true)
        return
      }

      setTimeout(poll, POLL_INTERVAL)
    }

    setTimeout(poll, POLL_INTERVAL)

    return () => { stopped = true }
  }, [orderId, slug])

  if (timedOut) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-white text-center">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
          style={{ backgroundColor: '#fef2f2' }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M12 8v4m0 4h.01" stroke="#D21034" strokeWidth={2.2} strokeLinecap="round" />
            <circle cx="12" cy="12" r="9" stroke="#D21034" strokeWidth={2} />
          </svg>
        </div>
        <h2
          className="text-lg font-bold mb-2"
          style={{ color: '#1A1C1E', fontFamily: 'var(--font-jakarta)' }}
        >
          Délai dépassé
        </h2>
        <p
          className="text-sm mb-8"
          style={{ color: '#6b7280', fontFamily: 'var(--font-vietnam)' }}
        >
          Nous n'avons pas reçu de confirmation. Si tu as payé, contacte le vendeur avec ton numéro de commande.
        </p>
        <button
          onClick={() => {
            if (slug) {
              router.push(`/p/${slug}/pay?order=${orderId}`)
            } else {
              router.back()
            }
          }}
          className="w-full py-4 rounded-2xl text-sm font-bold text-white"
          style={{ backgroundColor: '#006A4E', fontFamily: 'var(--font-jakarta)' }}
        >
          Réessayer
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col justify-center px-4 py-8 bg-white">
      <div className="flex flex-col items-center text-center">

        <h2
          className="text-lg font-bold mb-10"
          style={{ color: '#1A1C1E', fontFamily: 'var(--font-jakarta)' }}
        >
          PeerWize
        </h2>

        <div className="relative w-20 h-20 mb-8">
          <svg
            className="w-20 h-20"
            viewBox="0 0 80 80"
            fill="none"
            style={{ animation: 'spin 1.2s linear infinite' }}
          >
            <circle cx="40" cy="40" r="34" stroke="#e5e7eb" strokeWidth="6" />
            <path
              d="M40 6 a34 34 0 0 1 34 34"
              stroke="#006A4E"
              strokeWidth="6"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#006A4E" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
              />
            </svg>
          </div>
        </div>

        <p
          className="text-base font-medium mb-2"
          style={{ color: '#1A1C1E', fontFamily: 'var(--font-jakarta)' }}
        >
          Paiement en cours de vérification…
        </p>
        <p className="text-sm leading-relaxed">
          <span style={{ color: '#D21034' }}>Ne fermez pas cette page.</span>
          {' '}
          <span style={{ color: '#006A4E' }}>Nous sécurisons votre transaction.</span>
        </p>

        <div
          className="mt-6 px-4 py-3 rounded-2xl"
          style={{ backgroundColor: '#f0f9f5' }}
        >
          <p
            className="text-xs text-center"
            style={{ color: '#006A4E', fontFamily: 'var(--font-vietnam)' }}
          >
            Validez la notification reçue sur votre téléphone pour confirmer le paiement.
          </p>
        </div>

        <p
          className="text-xs mt-8"
          style={{ color: '#9ca3af', fontFamily: 'var(--font-vietnam)' }}
        >
          🔒 Certifié sécurisé par{' '}
          <span className="font-medium" style={{ color: '#006A4E' }}>PeerWize Pay</span>
        </p>

      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}