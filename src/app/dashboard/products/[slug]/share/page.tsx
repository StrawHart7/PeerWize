"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";
import {
  ArrowLeft,
  Copy,
  Check,
  Share2,
} from "lucide-react";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "";

// Icônes SVG inline pour WhatsApp / Instagram / TikTok
function WhatsAppIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="#25D366">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.558 4.121 1.532 5.853L.057 23.716a.75.75 0 00.917.943l6.053-1.588A11.946 11.946 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.708 9.708 0 01-4.953-1.355l-.355-.212-3.681.965.981-3.588-.232-.368A9.721 9.721 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="url(#ig)">
      <defs>
        <linearGradient id="ig" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f09433"/>
          <stop offset="25%" stopColor="#e6683c"/>
          <stop offset="50%" stopColor="#dc2743"/>
          <stop offset="75%" stopColor="#cc2366"/>
          <stop offset="100%" stopColor="#bc1888"/>
        </linearGradient>
      </defs>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="#1A1C1E">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z"/>
    </svg>
  );
}

interface Product {
  nom: string;
  prix_fcfa: number;
  photo_url: string | null;
}

export default function SharePage() {
  const params = useParams()
  // ✅ Fix : slug correctement extrait
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug
  const router = useRouter();
  const supabase = createClient();

  const [product, setProduct] = useState<Product | null>(null);
  const [copied, setCopied] = useState(false);

  const shareUrl = `${APP_URL}/p/${slug}`;

  useEffect(() => {
    // ✅ Fix : garde si slug est undefined
    if (!slug) return
    
    async function load() {
      const { data } = await supabase
        .from("products")
        .select("nom, prix_fcfa, photo_url")
        .eq("slug", slug)
        .single();
      if (data) setProduct(data);
    }
    load();
  }, [slug, supabase]);

  function handleCopy() {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function shareWhatsApp() {
    const text = encodeURIComponent(`🛍️ ${product?.nom ?? "Découvrez ce produit"}\n${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }

  function shareInstagram() {
    handleCopy();
    window.open("https://www.instagram.com/", "_blank");
  }

  function shareTikTok() {
    handleCopy();
    window.open("https://www.tiktok.com/", "_blank");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-12 pb-4 flex items-center gap-3">
        <button
          onClick={() => router.push("/dashboard/products")}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 active:bg-gray-200 transition-colors"
        >
          <ArrowLeft size={18} color="#1A1C1E" />
        </button>
        <h1 className="text-base font-bold text-[#1A1C1E] font-[var(--font-jakarta)]">
          Partager le produit
        </h1>
      </div>

      <div className="px-4 pt-6 flex flex-col gap-4">

        {/* Nom produit */}
        {product && (
          <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center gap-3">
            <Share2 size={16} color="#006A4E" />
            <div>
              <p className="text-sm font-semibold text-[#1A1C1E] font-[var(--font-jakarta)]">
                {product.nom}
              </p>
              <p className="text-xs text-gray-400 font-[var(--font-vietnam)]">
                {product.prix_fcfa.toLocaleString("fr-FR")} FCFA
              </p>
            </div>
          </div>
        )}

        {/* Lien copiable */}
        <div className="bg-white rounded-xl border border-gray-100 px-4 py-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 font-[var(--font-vietnam)]">
            Lien du produit
          </p>
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-3">
            <span className="flex-1 text-xs text-gray-500 truncate font-[var(--font-vietnam)]">
              {shareUrl}
            </span>
            <button
              onClick={handleCopy}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 font-[var(--font-jakarta)]"
              style={{
                backgroundColor: copied ? "#006A4E" : "#fff",
                color: copied ? "#fff" : "#1A1C1E",
                border: copied ? "1px solid #006A4E" : "1px solid #e5e7eb",
              }}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? "Copié !" : "Copier"}
            </button>
          </div>
        </div>

        {/* Partage réseaux */}
        <div className="bg-white rounded-xl border border-gray-100 px-4 py-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 font-[var(--font-vietnam)]">
            Partager sur
          </p>
          <div className="flex flex-col gap-2">

            <button
              onClick={shareWhatsApp}
              className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-gray-50 active:bg-gray-100 transition-colors"
            >
              <WhatsAppIcon />
              <span className="text-sm font-medium text-[#1A1C1E] font-[var(--font-vietnam)]">
                WhatsApp
              </span>
            </button>

            <button
              onClick={shareInstagram}
              className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-gray-50 active:bg-gray-100 transition-colors"
            >
              <InstagramIcon />
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium text-[#1A1C1E] font-[var(--font-vietnam)]">
                  Instagram
                </span>
                <span className="text-xs text-gray-400 font-[var(--font-vietnam)]">
                  Lien copié automatiquement
                </span>
              </div>
            </button>

            <button
              onClick={shareTikTok}
              className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-gray-50 active:bg-gray-100 transition-colors"
            >
              <TikTokIcon />
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium text-[#1A1C1E] font-[var(--font-vietnam)]">
                  TikTok
                </span>
                <span className="text-xs text-gray-400 font-[var(--font-vietnam)]">
                  Lien copié automatiquement
                </span>
              </div>
            </button>

          </div>
        </div>

        {/* CTA voir produit */}
        <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center py-4 rounded-xl text-white text-sm font-semibold font-[var(--font-jakarta)] transition-opacity active:opacity-80"
            style={{ backgroundColor: "#006A4E" }}
        >
            Voir la page produit
        </a>

      </div>
    </div>
  );
}