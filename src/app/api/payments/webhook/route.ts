import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/src/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const event = body?.name
    const transaction = body?.entity

    console.log('Webhook payload:', JSON.stringify({ event, fedaStatut: transaction?.status, body }))

    if (!event || !transaction) {
      return NextResponse.json({ error: 'Payload invalide.' }, { status: 400 })
    }

    const providerRef = String(transaction.id)
    const fedaStatut = transaction.status

    const supabase = createAdminClient()

    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('id, order_id, statut')
      .eq('provider_ref', providerRef)
      .single()

    if (paymentError || !payment) {
      console.warn('Webhook: paiement introuvable pour ref', providerRef)
      return NextResponse.json({ received: true })
    }

    if (payment.statut !== 'pending') {
      return NextResponse.json({ received: true })
    }

    const statutMap: Record<string, { payment: string; order: string }> = {
      approved: { payment: 'success', order: 'payée'   },
      declined: { payment: 'failed',  order: 'annulée' },
      canceled: { payment: 'failed',  order: 'annulée' },
    }

    const mapped = statutMap[fedaStatut]

    if (!mapped) {
      return NextResponse.json({ received: true })
    }

    await supabase
      .from('payments')
      .update({
        statut: mapped.payment,
        paid_at: fedaStatut === 'approved' ? new Date().toISOString() : null,
      })
      .eq('id', payment.id)

    await supabase
      .from('orders')
      .update({ statut: mapped.order })
      .eq('id', payment.order_id)

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ received: true })
  }
}