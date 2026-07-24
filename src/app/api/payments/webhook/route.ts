import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/src/lib/supabase/admin";

const FEDAPAY_BASE_URL = process.env.FEDAPAY_BASE_URL ?? "https://sandbox.fedapay.com";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const event = body?.name;
    const transaction = body?.entity;

    if (!event || !transaction) {
      return NextResponse.json({ error: "Payload invalide." }, { status: 400 });
    }

    const providerRef = String(transaction.id);
    const fedaStatut = transaction.status;

    // ── Vérification de la transaction côté FedaPay ───────────────────────────
    const verifyRes = await fetch(`${FEDAPAY_BASE_URL}/v1/transactions/${providerRef}`, {
      headers: {
        Authorization: `Bearer ${process.env.FEDAPAY_SECRET_KEY}`,
      },
    });

    if (!verifyRes.ok) {
      console.error("Webhook: impossible de vérifier la transaction", providerRef);
      return NextResponse.json({ error: "Vérification échouée." }, { status: 502 });
    }

    const verifyData = await verifyRes.json();
    const verifiedStatut = verifyData?.["v1/transaction"]?.status ?? verifyData?.status;

    if (!verifiedStatut || verifiedStatut !== fedaStatut) {
      console.error("Webhook: statut non concordant", { fedaStatut, verifiedStatut });
      return NextResponse.json({ received: true });
    }

    // ── Mapping statuts ───────────────────────────────────────────────────────
    const statutMap: Record<string, { payment: string; order: string }> = {
      approved:   { payment: "success", order: "payée"   },
      successful: { payment: "success", order: "payée"   },
      declined:   { payment: "failed",  order: "annulée" },
      canceled:   { payment: "failed",  order: "annulée" },
      cancelled:  { payment: "failed",  order: "annulée" },
    };

    const mapped = statutMap[verifiedStatut];
    if (!mapped) {
      return NextResponse.json({ received: true });
    }

    const supabase = createAdminClient();

    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("id, order_id, statut")
      .eq("provider_ref", providerRef)
      .single();

    if (paymentError || !payment) {
      console.warn("Webhook: paiement introuvable pour ref", providerRef);
      return NextResponse.json({ received: true });
    }

    if (payment.statut !== "pending") {
      return NextResponse.json({ received: true });
    }

    // ── Update payments ───────────────────────────────────────────────────────
    const { error: updatePaymentError } = await supabase
      .from("payments")
      .update({
        statut: mapped.payment,
        paid_at: mapped.payment === "success" ? new Date().toISOString() : null,
      })
      .eq("id", payment.id);

    if (updatePaymentError) {
      console.error("Webhook: erreur update payments", updatePaymentError);
      return NextResponse.json({ error: "Erreur update payments." }, { status: 500 });
    }

    // ── Update orders ─────────────────────────────────────────────────────────
    const { error: updateOrderError } = await supabase
      .from("orders")
      .update({ statut: mapped.order })
      .eq("id", payment.order_id);

    if (updateOrderError) {
      console.error("Webhook: erreur update orders", updateOrderError);
      return NextResponse.json({ error: "Erreur update orders." }, { status: 500 });
    }

    return NextResponse.json({ received: true });

  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Erreur serveur inattendue." }, { status: 500 });
  }
}