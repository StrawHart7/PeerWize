"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/src/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

type Order = {
  id: string;
  montant_total: number;
  product_id: string;
};

type PaymentMethod = "flooz" | "tmoney" | "carte";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatFCFA(amount: number): string {
  return amount.toLocaleString("fr-FR").replace(/\s/g, ".") + " FCFA";
}

// ─── Icônes méthodes de paiement ─────────────────────────────────────────────

function FloozIcon() {
  return (
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ backgroundColor: "#fff3e0" }}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="#FF6600" opacity="0.15" />
        <text x="12" y="16" textAnchor="middle" fontSize="11" fontWeight="800" fill="#FF6600">F</text>
      </svg>
    </div>
  );
}

function TMoneyIcon() {
  return (
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ backgroundColor: "#e8f5e9" }}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="#006A4E" opacity="0.15" />
        <text x="12" y="16" textAnchor="middle" fontSize="10" fontWeight="800" fill="#006A4E">T</text>
      </svg>
    </div>
  );
}

function CardIcon() {
  return (
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ backgroundColor: "#eff6ff" }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="5" width="20" height="14" rx="2" stroke="#2563eb" strokeWidth={1.8} />
        <path d="M2 10h20" stroke="#2563eb" strokeWidth={1.8} />
        <path d="M6 15h4" stroke="#2563eb" strokeWidth={1.8} strokeLinecap="round" />
      </svg>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PaymentPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const orderId = searchParams.get("order");
  const supabase = createClient();

  const [order, setOrder] = useState<Order | null>(null);
  const [selected, setSelected] = useState<PaymentMethod>("flooz");
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!orderId) {
        router.push(`/p/${slug}`);
        return;
      }

      const { data } = await supabase
        .from("orders")
        .select("id, montant_total, product_id")
        .eq("id", orderId)
        .single();

      if (!data) {
        router.push(`/p/${slug}`);
        return;
      }
      setOrder(data);
      setLoading(false);
    }
    load();
  }, [orderId, slug]);

  async function handlePay() {
    if (!order) return;
    setError(null);
    setPaying(true);

    const providerMap: Record<PaymentMethod, string> = {
      flooz: "moov_tg",
      tmoney: "togocel",
      carte: "card",
    };

    try {
      const res = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: order.id,
          provider: providerMap[selected],
          amount: order.montant_total,
        }),
      });

      const json = await res.json();

      if (!res.ok || json.error) {
        setError(json.error ?? "Erreur lors de l'initialisation du paiement.");
        setPaying(false);
        return;
      }

      // Carte : redirection externe FedaPay (inévitable pour 3DS)
      if (json.checkout_url) {
        window.location.href = json.checkout_url;
        return;
      }

      // Mobile Money : USSD envoyé sur le téléphone, on reste dans l'app
      // On passe le slug pour pouvoir rediriger correctement en cas d'échec
      router.push(`/order/${order.id}/processing?slug=${slug}`);

    } catch {
      setError("Impossible de contacter le serveur. Vérifiez votre connexion.");
      setPaying(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "#006A4E", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  if (!order) return null;

  const methods: {
    key: PaymentMethod;
    label: string;
    sub: string;
    icon: React.ReactNode;
  }[] = [
    { key: "flooz", label: "Flooz", sub: "Moov Africa", icon: <FloozIcon /> },
    { key: "tmoney", label: "T-Money", sub: "Togocel", icon: <TMoneyIcon /> },
    { key: "carte", label: "Carte bancaire", sub: "Visa / Mastercard", icon: <CardIcon /> },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1px solid #f3f4f6" }}
      >
        <Link
          href={`/p/${slug}/order`}
          className="p-2 rounded-full hover:bg-gray-100 transition"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A1C1E" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>

        <span
          className="text-sm font-bold"
          style={{ color: "#1A1C1E", fontFamily: "var(--font-jakarta)" }}
        >
          Paiement
        </span>

        <div className="w-9" />
      </div>

      {/* ── Contenu ── */}
      <div className="flex-1 px-5 pt-8 pb-36">
        {/* Total */}
        <div className="text-center mb-8">
          <p
            className="text-xs font-bold uppercase tracking-widest mb-2"
            style={{ color: "#9ca3af", fontFamily: "var(--font-vietnam)" }}
          >
            Total à régler
          </p>
          <p
            className="text-4xl font-bold"
            style={{ color: "#1A1C1E", fontFamily: "var(--font-jakarta)", letterSpacing: "-0.03em" }}
          >
            {formatFCFA(order.montant_total)}
          </p>
        </div>

        {/* Choix méthode */}
        <p
          className="text-sm font-semibold mb-3"
          style={{ color: "#1A1C1E", fontFamily: "var(--font-jakarta)" }}
        >
          Choisir un moyen de paiement
        </p>

        {error && (
          <div
            className="mb-4 px-4 py-3 rounded-xl text-sm"
            style={{ backgroundColor: "#fef2f2", color: "#D21034", border: "1px solid #fecaca" }}
          >
            {error}
          </div>
        )}

        <div className="space-y-3 mb-6">
          {methods.map(({ key, label, sub, icon }) => {
            const isSelected = selected === key;
            return (
              <button
                key={key}
                onClick={() => setSelected(key)}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition text-left"
                style={{
                  border: isSelected ? "2px solid #006A4E" : "1.5px solid #e5e7eb",
                  backgroundColor: isSelected ? "#f0f9f5" : "#fff",
                }}
              >
                {icon}
                <div className="flex-1">
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "#1A1C1E", fontFamily: "var(--font-jakarta)" }}
                  >
                    {label}
                  </p>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: "#9ca3af", fontFamily: "var(--font-vietnam)" }}
                  >
                    {sub}
                  </p>
                </div>
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition"
                  style={{
                    backgroundColor: isSelected ? "#006A4E" : "transparent",
                    border: isSelected ? "none" : "1.5px solid #d1d5db",
                  }}
                >
                  {isSelected && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path d="M5 13l4 4L19 7" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Instruction Mobile Money */}
        {selected !== "carte" && (
          <div
            className="flex items-start gap-3 px-4 py-3 rounded-2xl mb-4"
            style={{ backgroundColor: "#f0f9f5", border: "1px solid #d1fae5" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0">
              <circle cx="12" cy="12" r="9" stroke="#006A4E" strokeWidth={2} />
              <path d="M12 8v4m0 4h.01" stroke="#006A4E" strokeWidth={2} strokeLinecap="round" />
            </svg>
            <p
              className="text-xs leading-relaxed"
              style={{ color: "#006A4E", fontFamily: "var(--font-vietnam)" }}
            >
              Après avoir cliqué sur Payer, vous recevrez une notification sur votre téléphone pour confirmer le paiement avec votre PIN.
            </p>
          </div>
        )}

        {/* Badge sécurité SSL */}
        <div className="flex items-center justify-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
              stroke="#006A4E" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
            />
          </svg>
          <span
            className="text-xs"
            style={{ color: "#9ca3af", fontFamily: "var(--font-vietnam)" }}
          >
            Paiement sécurisé par cryptage SSL
          </span>
        </div>
      </div>

      {/* ── CTA fixe bas ── */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-white px-5 py-4"
        style={{ borderTop: "1px solid #f3f4f6" }}
      >
        <button
          onClick={handlePay}
          disabled={paying}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-white text-sm font-bold transition active:opacity-90"
          style={{
            backgroundColor: paying ? "#4a9a7e" : "#006A4E",
            fontFamily: "var(--font-jakarta)",
          }}
        >
          {paying ? (
            <>
              <div
                className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: "#fff", borderTopColor: "transparent" }}
              />
              <span>Envoi en cours…</span>
            </>
          ) : (
            <>
              Payer {formatFCFA(order.montant_total)}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
}