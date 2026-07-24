import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/src/lib/supabase/admin";

const FEDAPAY_BASE_URL = process.env.FEDAPAY_BASE_URL ?? "https://sandbox.fedapay.com";

export async function POST(req: NextRequest) {
  try {
    const { order_id, provider, amount } = await req.json();

    if (!order_id || !provider || !amount) {
      return NextResponse.json({ error: "Paramètres manquants." }, { status: 400 });
    }

    const validProviders = ["moov_tg", "togocel", "card"];
    if (!validProviders.includes(provider)) {
      return NextResponse.json({ error: "Méthode de paiement invalide." }, { status: 400 });
    }

    const supabase = createAdminClient();

    // ── Idempotence : paiement pending existant ? ─────────────────────────────
    const { data: existingPayment } = await supabase
      .from("payments")
      .select("id, provider_ref")
      .eq("order_id", order_id)
      .eq("statut", "pending")
      .maybeSingle();

    // ── Commande + montant recalculé depuis la base ───────────────────────────
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, montant_total, statut, client_whatsapp, product_id")
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Commande introuvable." }, { status: 404 });
    }

    if (order.statut !== "en_attente") {
      return NextResponse.json({ error: "Cette commande a déjà été traitée." }, { status: 409 });
    }

    // Recalcul du montant depuis products — le client ne fait pas confiance
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("prix_fcfa")
      .eq("id", order.product_id)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: "Produit introuvable." }, { status: 404 });
    }

    // quantite = montant_total / prix_fcfa (arrondi entier)
    const quantite = Math.round(order.montant_total / product.prix_fcfa);
    const expectedAmount = product.prix_fcfa * quantite;

    if (expectedAmount !== order.montant_total) {
      return NextResponse.json({ error: "Montant invalide." }, { status: 400 });
    }

    const phoneNumber = order.client_whatsapp.replace("+", "");

    let transactionId: string;

    if (existingPayment) {
      // Réutiliser la transaction existante
      transactionId = existingPayment.provider_ref;
    } else {
      // ── Étape 1 : Créer la transaction FedaPay ───────────────────────────────
      const fedaRes = await fetch(`${FEDAPAY_BASE_URL}/v1/transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.FEDAPAY_SECRET_KEY}`,
        },
        body: JSON.stringify({
          description: `Commande PeerWize #${order_id.slice(0, 8)}`,
          amount: expectedAmount,
          currency: { iso: "XOF" },
          callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook`,
          customer: {
            phone_number: { number: phoneNumber, country: "TG" },
          },
        }),
      });

      const rawText = await fedaRes.text();
      console.log("FedaPay raw response:", rawText.slice(0, 500));

      let fedaData: unknown;
      try {
        fedaData = JSON.parse(rawText);
      } catch {
        return NextResponse.json({ error: `FedaPay réponse non-JSON: ${rawText.slice(0, 200)}` }, { status: 502 });
      }

      if (!fedaRes.ok) {
        console.error("FedaPay create error:", fedaData);
        return NextResponse.json({ error: "Erreur lors de la création de la transaction." }, { status: 502 });
      }

      transactionId = (fedaData as any)?.["v1/transaction"]?.id ?? (fedaData as any)?.id;

      if (!transactionId) {
        console.error("FedaPay: transaction ID manquant", fedaData);
        return NextResponse.json({ error: "Réponse inattendue du service de paiement." }, { status: 502 });
      }

      // ── Étape 2 : Enregistrer le paiement en DB ──────────────────────────────
      const { error: paymentError } = await supabase.from("payments").insert({
        order_id,
        provider,
        provider_ref: String(transactionId),
        statut: "pending",
        montant: expectedAmount,
      });

      if (paymentError) {
        console.error("Supabase insert payment error:", paymentError);
        return NextResponse.json({ error: "Erreur lors de l'enregistrement du paiement." }, { status: 500 });
      }
    }

    // ── Étape 3 : Token ───────────────────────────────────────────────────────
    const tokenRes = await fetch(`${FEDAPAY_BASE_URL}/v1/transactions/${transactionId}/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.FEDAPAY_SECRET_KEY}`,
      },
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok) {
      console.error("FedaPay token error:", tokenData);
      return NextResponse.json({ error: "Erreur lors de la génération du token." }, { status: 502 });
    }

    // ── Étape 4 : Carte → checkout_url ───────────────────────────────────────
    if (provider === "card") {
      return NextResponse.json({
        success: true,
        checkout_url: tokenData.url ?? null,
      });
    }

    // ── Étape 5 : Mobile Money → USSD push ───────────────────────────────────
    const token = tokenData.token;

    if (!token) {
      console.error("FedaPay: token manquant", tokenData);
      return NextResponse.json({ error: "Token de paiement introuvable." }, { status: 502 });
    }

    const payRes = await fetch(`${FEDAPAY_BASE_URL}/v1/transactions/${transactionId}/pay`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.FEDAPAY_SECRET_KEY}`,
      },
      body: JSON.stringify({
        token,
        provider,
        phone_number: { number: phoneNumber, country: "TG" },
      }),
    });

    let payData: unknown;
    try { payData = await payRes.json(); } catch { payData = null; }

    console.log("FedaPay pay response:", JSON.stringify(payData), "status:", payRes.status);

    if (payRes.status >= 500) {
      console.error("FedaPay pay error:", payData);
      return NextResponse.json({ error: "Erreur lors du déclenchement du paiement Mobile Money." }, { status: 502 });
    }

    return NextResponse.json({ success: true, checkout_url: null });

  } catch (err) {
    console.error("Unexpected error in initiate:", err);
    return NextResponse.json({ error: "Erreur serveur inattendue." }, { status: 500 });
  }
}