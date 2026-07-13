// src/app/api/payments/webhook/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // FedaPay envoie l'événement dans body.name et la transaction dans body.entity
    const event = body?.name
    const transaction = body?.entity

    if (!event || !transaction) {
      return NextResponse.json({ error: 'Payload invalide.' }, { status: 400 })
    }

    const providerRef = String(transaction.id)
    const fedaStatut = transaction.status // 'approved', 'declined', 'canceled'

    const supabase = await createClient()

    // Retrouver le paiement via provider_ref
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('id, order_id, statut')
      .eq('provider_ref', providerRef)
      .single()

    if (paymentError || !payment) {
      // Pas trouvé — on répond 200 quand même pour que FedaPay ne retry pas
      console.warn('Webhook: paiement introuvable pour ref', providerRef)
      return NextResponse.json({ received: true })
    }

    // Éviter de retraiter un webhook déjà traité
    if (payment.statut !== 'en_attente') {
      return NextResponse.json({ received: true })
    }

    // Mapper statut FedaPay → statut interne
    const statutMap: Record<string, { payment: string; order: string }> = {
      approved: { payment: 'payé',    order: 'payée'    },
      declined: { payment: 'échoué',  order: 'annulée'  },
      canceled: { payment: 'annulé',  order: 'annulée'  },
    }

    const mapped = statutMap[fedaStatut]

    if (!mapped) {
      // Statut inconnu (ex: 'pending') — on ignore
      return NextResponse.json({ received: true })
    }

    // Update payment
    await supabase
      .from('payments')
      .update({
        statut: mapped.payment,
        paid_at: fedaStatut === 'approved' ? new Date().toISOString() : null,
      })
      .eq('id', payment.id)

    // Update order
    await supabase
      .from('orders')
      .update({ statut: mapped.order })
      .eq('id', payment.order_id)

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('Webhook error:', err)
    // Toujours 200 pour éviter les retries FedaPay en boucle
    return NextResponse.json({ received: true })
  }
}