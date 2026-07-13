// src/app/api/payments/initiate/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { order_id, provider, amount } = await req.json()

    if (!order_id || !provider || !amount) {
      return NextResponse.json({ error: 'Paramètres manquants.' }, { status: 400 })
    }

    const validProviders = ['moov_tg', 'togocel', 'card']
    if (!validProviders.includes(provider)) {
      return NextResponse.json({ error: 'Méthode de paiement invalide.' }, { status: 400 })
    }

    const supabase = await createClient()

    // Récupérer commande + numéro téléphone client
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, montant_total, statut, client_whatsapp')
      .eq('id', order_id)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Commande introuvable.' }, { status: 404 })
    }

    if (order.statut !== 'en_attente') {
      return NextResponse.json({ error: 'Cette commande a déjà été traitée.' }, { status: 409 })
    }

    if (order.montant_total !== amount) {
      return NextResponse.json({ error: 'Montant invalide.' }, { status: 400 })
    }

    // Numéro au format FedaPay — ils veulent juste les chiffres sans le +
    // +22890000000 → 22890000000
    const phoneNumber = order.client_whatsapp.replace('+', '')

    // ── Créer la transaction FedaPay ───────────────────────────────────────
    const fedaRes = await fetch('https://sandbox-api.fedapay.com/v1/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.FEDAPAY_SECRET_KEY}`,
      },
      body: JSON.stringify({
        description: `Commande PeerWize #${order_id.slice(0, 8)}`,
        amount,
        currency: { iso: 'XOF' },
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook`,
        customer: {
          // FedaPay utilise ça pour pré-remplir et pour le Mobile Money
          phone_number: {
            number: phoneNumber,
            country: 'TG',
          },
        },
      }),
    })

    const fedaData = await fedaRes.json()

    if (!fedaRes.ok) {
      console.error('FedaPay create error:', fedaData)
      return NextResponse.json(
        { error: 'Erreur lors de la création de la transaction.' },
        { status: 502 }
      )
    }

    const transactionId = fedaData?.v1?.transaction?.id ?? fedaData?.id
    if (!transactionId) {
      console.error('FedaPay: transaction ID manquant', fedaData)
      return NextResponse.json(
        { error: 'Réponse inattendue du service de paiement.' },
        { status: 502 }
      )
    }

    // ── Enregistrer le paiement en base ───────────────────────────────────
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        order_id,
        provider,
        provider_ref: String(transactionId),
        statut: 'en_attente',
        montant: amount,
      })

    if (paymentError) {
      console.error('Supabase insert error:', paymentError)
      return NextResponse.json(
        { error: "Erreur lors de l'enregistrement du paiement." },
        { status: 500 }
      )
    }

    // ── Tokeniser pour déclencher l'invite Mobile Money ───────────────────
    if (provider !== 'card') {
      const tokenRes = await fetch(
        `https://sandbox-api.fedapay.com/v1/transactions/${transactionId}/token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.FEDAPAY_SECRET_KEY}`,
          },
          body: JSON.stringify({ provider }),
        }
      )

      if (!tokenRes.ok) {
        const tokenErr = await tokenRes.json()
        console.error('FedaPay token error:', tokenErr)
        // Non bloquant — processing page poll quand même
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Erreur serveur inattendue.' }, { status: 500 })
  }
}