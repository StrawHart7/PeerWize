import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/src/lib/supabase/server";

// ─── Types ────────────────────────────────────────────────────────────────────

type Product = {
  id: string;
  nom: string;
  description: string | null;
  prix_fcfa: number;
  photo_url: string | null;
  slug: string;
  actif: boolean;
  sellers: {
    id: string;
    nom: string;
    whatsapp: string;
  } | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatFCFA(amount: number): string {
  return amount.toLocaleString("fr-FR").replace(/\s/g, ".") + " FCFA";
}

function formatWhatsapp(numero: string): string {
  // Affichage lisible : +228 90 12 34 56
  const clean = numero.replace(/\D/g, "");
  if (clean.startsWith("228") && clean.length === 11) {
    return `+228 ${clean.slice(3, 5)} ${clean.slice(5, 7)} ${clean.slice(7, 9)} ${clean.slice(9)}`;
  }
  return numero;
}

function getAvatarColor(name: string): string {
  const colors = [
    "#006A4E",
    "#1a7a5e",
    "#2d6a8f",
    "#7c3aed",
    "#b45309",
    "#0369a1",
    "#be185d",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select(
      "id, nom, description, prix_fcfa, photo_url, slug, actif, sellers(id, nom, whatsapp)",
    )
    .eq("slug", slug)
    .single();

  if (!product || !product.actif) notFound();

  const p = product as unknown as Product;
  const seller = p.sellers;

  return (
    <div className="min-h-screen bg-white">
      {/* ── Header ── */}
      <div
        className="fixed top-0 left-0 right-0 flex items-center justify-between px-4 py-3 z-50"
        style={{
          backgroundColor: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid #f3f4f6",
        }}
      >
        <Link
          href="/"
          className="p-2 rounded-full hover:bg-gray-100 transition"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#1A1C1E"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </Link>
        <span
          className="text-sm font-semibold"
          style={{ color: "#1A1C1E", fontFamily: "var(--font-jakarta)" }}
        >
          Détails du Produit
        </span>
        <button className="p-2 rounded-full hover:bg-gray-100 transition">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#1A1C1E"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
        </button>
      </div>

      {/* ── Photo produit ── */}
      <div className="pt-14">
        {p.photo_url ? (
          <div
            className="relative w-full overflow-hidden"
            style={{ height: "260px" }}
          >
            {/* Fond flouté */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${p.photo_url})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: "blur(20px) brightness(0.55)",
                transform: "scale(1.2)",
              }}
            />
            {/* Image principale */}
            <img
              src={p.photo_url}
              alt={p.nom}
              className="absolute inset-0 w-full h-full object-contain"
              style={{ zIndex: 1 }}
            />
          </div>
        ) : (
          <div
            className="w-full flex items-center justify-center"
            style={{ height: "260px", backgroundColor: "#f0f9f5" }}
          >
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                stroke="#006A4E"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                stroke="#006A4E"
              />
            </svg>
          </div>
        )}
      </div>

      {/* ── Contenu ── */}
      <div className="px-5 pt-5 pb-32">
        {/* Nom */}
        <h1
          className="text-xl font-bold leading-snug mb-2"
          style={{ color: "#1A1C1E", fontFamily: "var(--font-jakarta)" }}
        >
          {p.nom}
        </h1>

        {/* Prix */}
        <div
          className="inline-block px-3 py-1 rounded-lg mb-5"
          style={{ backgroundColor: "#FFCD00" }}
        >
          <span
            className="text-lg font-bold"
            style={{ color: "#1A1C1E", fontFamily: "var(--font-jakarta)" }}
          >
            {formatFCFA(p.prix_fcfa)}
          </span>
        </div>

        {/* Description */}
        {p.description && (
          <div className="mb-6">
            <p
              className="text-xs font-bold uppercase tracking-widest mb-2"
              style={{ color: "#9ca3af", fontFamily: "var(--font-vietnam)" }}
            >
              Description
            </p>
            <p
              className="text-sm leading-relaxed"
              style={{ color: "#374151", fontFamily: "var(--font-vietnam)" }}
            >
              {p.description}
            </p>
          </div>
        )}

        {/* Vendeur */}
        {seller && (
          <div
            className="flex items-center gap-3 rounded-2xl px-4 py-3.5"
            style={{ backgroundColor: "#f8f9fa", border: "1px solid #f3f4f6" }}
          >
            <div
              className="flex items-center justify-center rounded-full flex-shrink-0"
              style={{
                width: 42,
                height: 42,
                backgroundColor: getAvatarColor(seller.nom),
                fontFamily: "var(--font-jakarta)",
                fontSize: 15,
                fontWeight: 700,
                color: "#fff",
              }}
            >
              {getInitials(seller.nom)}
            </div>
            <p
              className="text-sm font-semibold"
              style={{ color: "#1A1C1E", fontFamily: "var(--font-jakarta)" }}
            >
              {seller.nom}
            </p>
          </div>
        )}
      </div>

      {/* ── CTA fixe bas ── */}
      <div
        className="fixed bottom-0 left-0 right-0 px-5 py-4 bg-white"
        style={{ borderTop: "1px solid #f3f4f6" }}
      >
        <Link
          href={`/p/${slug}/order`}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-white text-sm font-bold transition active:opacity-90"
          style={{
            backgroundColor: "#006A4E",
            fontFamily: "var(--font-jakarta)",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-10 2a2 2 0 100 4 2 2 0 000-4z"
              stroke="white"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Commander maintenant
        </Link>
      </div>
    </div>
  );
}
