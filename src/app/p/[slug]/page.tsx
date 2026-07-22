"use client";

import { useState, useEffect } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/src/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

type Product = {
  id: string;
  nom: string;
  description: string | null;
  prix_fcfa: number;
  photo_url: string | null;
  photos: string[] | null;
  slug: string;
  actif: boolean;
  sellers: {
    id: string;
    nom: string;
    whatsapp: string;
    avatar_url: string | null;
  } | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatFCFA(amount: number): string {
  return amount.toLocaleString("fr-FR").replace(/\s/g, ".") + " FCFA";
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

// ─── Carousel avec Swipe + Drag ─────────────────────────────────────────────

function ProductPhotoCarousel({ photos, productName }: { photos: string[] | null; productName: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [offsetX, setOffsetX] = useState(0);
  
  const allPhotos = photos && photos.length > 0 ? photos : [];
  const hasPhotos = allPhotos.length > 0;

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.targetTouches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    setOffsetX(e.targetTouches[0].clientX - startX);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    if (Math.abs(offsetX) > 50) {
      if (offsetX < 0 && currentIndex < allPhotos.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else if (offsetX > 0 && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      }
    }
    setOffsetX(0);
    setStartX(0);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setStartX(e.clientX);
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffsetX(e.clientX - startX);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    if (Math.abs(offsetX) > 50) {
      if (offsetX < 0 && currentIndex < allPhotos.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else if (offsetX > 0 && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      }
    }
    setOffsetX(0);
    setStartX(0);
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      setOffsetX(0);
      setStartX(0);
    }
  };

  if (!hasPhotos) {
    return (
      <div className="w-full flex items-center justify-center" style={{ height: 300, backgroundColor: "#f5f5f5" }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke="#9ca3af" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" stroke="#9ca3af" />
        </svg>
      </div>
    );
  }

  const translateX = isDragging ? offsetX : 0;
  const isTransitioning = !isDragging;

  return (
    <div 
      className="relative w-full overflow-hidden select-none"
      style={{ height: 300, backgroundColor: "#f5f5f5", cursor: "grab" }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {/* Fond flouté */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${allPhotos[currentIndex]})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(20px) brightness(0.55)",
          transform: "scale(1.2)",
        }}
      />
      
      {/* Images en carousel */}
      <div 
        className="flex h-full relative"
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isTransitioning ? "transform 0.3s ease-out" : "none",
          zIndex: 1,
        }}
      >
        {allPhotos.map((photo, index) => (
          <img
            key={index}
            src={photo}
            alt={`${productName} - ${index + 1}`}
            className="h-full w-full object-contain flex-shrink-0 p-3"
            draggable={false}
            style={{ userSelect: "none", pointerEvents: "none" }}
          />
        ))}
      </div>

      {/* Dots */}
      {allPhotos.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 pointer-events-none" style={{ zIndex: 2 }}>
          {allPhotos.map((_, index) => (
            <span
              key={index}
              className="block rounded-full transition-all"
              style={{
                width: index === currentIndex ? "8px" : "4px",
                height: "4px",
                backgroundColor: index === currentIndex ? "#006A4E" : "rgba(255,255,255,0.4)",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // Note: avec "use client", on ne peut pas utiliser async directement
  // On va utiliser useEffect pour charger les données
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [slug, setSlug] = useState<string | null>(null);

  // Récupérer le slug depuis params (qui est une Promise)
  useEffect(() => {
    async function getSlug() {
      const resolved = await params;
      setSlug(resolved.slug);
    }
    getSlug();
  }, [params]);

  // Charger le produit
  useEffect(() => {
    if (!slug) return;

    async function loadProduct() {
      const supabase = createClient();
      const { data } = await supabase
        .from("products")
        .select(
          "id, nom, description, prix_fcfa, photo_url, photos, slug, actif, sellers(id, nom, whatsapp, avatar_url)",
        )
        .eq("slug", slug)
        .single();

      if (data && data.actif) {
        setProduct(data as unknown as Product);
      }
      setLoading(false);
    }

    loadProduct();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "#006A4E", borderTopColor: "transparent" }}
          />
          <span className="text-sm text-gray-400 font-vietnam">
            Chargement...
          </span>
        </div>
      </div>
    );
  }

  if (!product) {
    notFound();
  }

  const p = product;
  const seller = p.sellers;
  const allPhotos = p.photos || (p.photo_url ? [p.photo_url] : []);

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
        <Link
          href={`/dashboard/products/${slug}/share`}
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
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
        </Link>
      </div>

      {/* ── Photos ── */}
      <div className="pt-14">
        <ProductPhotoCarousel photos={allPhotos} productName={p.nom} />
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

        {/* Vendeur - avec photo de profil */}
        {seller && (
          <div
            className="flex items-center gap-3 rounded-2xl px-4 py-3.5"
            style={{ backgroundColor: "#f8f9fa", border: "1px solid #f3f4f6" }}
          >
            {/* Avatar avec photo de profil */}
            {seller.avatar_url ? (
              <img
                src={seller.avatar_url}
                alt={seller.nom}
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div
                className="flex items-center justify-center rounded-full flex-shrink-0"
                style={{
                  width: 40,
                  height: 40,
                  backgroundColor: getAvatarColor(seller.nom),
                  fontFamily: "var(--font-jakarta)",
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#fff",
                }}
              >
                {getInitials(seller.nom)}
              </div>
            )}
            <div>
              <p
                className="text-sm font-semibold"
                style={{ color: "#1A1C1E", fontFamily: "var(--font-jakarta)" }}
              >
                {seller.nom}
              </p>
            </div>
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