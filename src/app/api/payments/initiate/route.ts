import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { order_id, provider, amount } = await req.json();

    if (!order_id || !provider || !amount) {
      return NextResponse.json(
        { error: "Paramètres manquants." },
        { status: 400 },
      );
    }

    const validProviders = ["moov_tg", "togocel", "card"];
    if (!validProviders.includes(provider)) {
      return NextResponse.json(
        { error: "Méthode de paiement invalide." },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, montant_total, statut, client_whatsapp")
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Commande introuvable." },
        { status: 404 },
      );
    }

    if (order.statut !== "en_attente") {
      return NextResponse.json(
        { error: "Cette commande a déjà été traitée." },
        { status: 409 },
      );
    }

    if (order.montant_total !== amount) {
      return NextResponse.json(
        { error: "Montant invalide." },
        { status: 400 },
      );
    }

    const phoneNumber = order.client_whatsapp.replace("+", "");

    // ── Étape 1 : Créer la transaction FedaPay ────────────────────────────────
    const fedaRes = await fetch("https://sandbox.fedapay.com/v1/transactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.FEDAPAY_SECRET_KEY}`,
      },
      body: JSON.stringify({
        description: `Commande PeerWize #${order_id.slice(0, 8)}`,
        amount,
        currency: { iso: "XOF" },
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook`,
        customer: {
          phone_number: {
            number: phoneNumber,
            country: "TG",
          },
        },
      }),
    });

    const fedaData = await fedaRes.json();
    console.log("FedaPay create response:", JSON.stringify(fedaData), "status:", fedaRes.status);

    if (!fedaRes.ok) {
      console.error("FedaPay create error:", fedaData);
      return NextResponse.json(
        { error: "Erreur lors de la création de la transaction." },
        { status: 502 },
      );
    }

    const transactionId = fedaData?.["v1/transaction"]?.id ?? fedaData?.id;

    if (!transactionId) {
      console.error("FedaPay: transaction ID manquant", fedaData);
      return NextResponse.json(
        { error: "Réponse inattendue du service de paiement." },
        { status: 502 },
      );
    }

    // ── Étape 2 : Enregistrer le paiement en DB ───────────────────────────────
    const { error: paymentError } = await supabase.from("payments").insert({
      order_id,
      provider,
      provider_ref: String(transactionId),
      statut: "pending",
      montant: amount,
    });

    if (paymentError) {
      console.error("Supabase insert error:", paymentError);
      return NextResponse.json(
        { error: "Erreur lors de l'enregistrement du paiement." },
        { status: 500 },
      );
    }

    // ── Étape 3 : Carte → token puis redirect ─────────────────────────────────
    if (provider === "card") {
      const tokenRes = await fetch(
        `https://api.fedapay.com/v1/transactions/${transactionId}/token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.FEDAPAY_SECRET_KEY}`,
          },
        },
      );

      const tokenData = await tokenRes.json();

      if (!tokenRes.ok) {
        console.error("FedaPay token error (card):", tokenData);
        return NextResponse.json(
          { error: "Erreur lors de la génération du lien de paiement." },
          { status: 502 },
        );
      }

      return NextResponse.json({
        success: true,
        checkout_url: tokenData.url ?? null,
      });
    }

    // ── Étape 4 : Mobile Money → token puis /pay (USSD push) ─────────────────
    const tokenRes = await fetch(
      `https://api.fedapay.com/v1/transactions/${transactionId}/token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.FEDAPAY_SECRET_KEY}`,
        },
      },
    );

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok) {
      console.error("FedaPay token error:", tokenData);
      return NextResponse.json(
        { error: "Erreur lors de la génération du token." },
        { status: 502 },
      );
    }

    const token = tokenData.token;

    if (!token) {
      console.error("FedaPay: token manquant", tokenData);
      return NextResponse.json(
        { error: "Token de paiement introuvable." },
        { status: 502 },
      );
    }

    const payRes = await fetch(
      `https://api.fedapay.com/v1/transactions/${transactionId}/pay`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.FEDAPAY_SECRET_KEY}`,
        },
        body: JSON.stringify({
          token,
          provider,
          phone_number: {
            number: phoneNumber,
            country: "TG",
          },
        }),
      },
    );

    let payData: unknown;
    try {
      payData = await payRes.json();
    } catch {
      payData = null;
    }

    console.log("FedaPay pay response:", JSON.stringify(payData), "status:", payRes.status);

    // FedaPay peut renvoyer 200 avec body vide sur USSD push live — on accepte
    if (payRes.status >= 500) {
      console.error("FedaPay pay error:", payData);
      return NextResponse.json(
        { error: "Erreur lors du déclenchement du paiement Mobile Money." },
        { status: 502 },
      );
    }

    return NextResponse.json({ success: true, checkout_url: null });

  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json(
      { error: "Erreur serveur inattendue." },
      { status: 500 },
    );
  }
}