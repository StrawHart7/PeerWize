"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, ShoppingBag } from "lucide-react";

export default function MarketplacePage() {
  const router = useRouter();

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-white">
      {/* Header */}
      <header className="flex items-center px-4 pt-12 pb-4 shrink-0">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors"
          aria-label="Retour"
        >
          <ArrowLeft size={22} color="#1A1C1E" />
        </button>
      </header>

      {/* Corps centré */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
          style={{ backgroundColor: "#FFCD00" }}
        >
          <ShoppingBag size={36} color="#1A1C1E" />
        </div>

        <h1 className="text-2xl font-bold text-[#1A1C1E] font-[var(--font-jakarta)] mb-3">
          La marketplace arrive bientôt
        </h1>

        <p className="text-sm text-gray-500 font-[var(--font-vietnam)] leading-relaxed max-w-xs">
          Découvrez les boutiques des vendeurs togolais directement depuis l&apos;application. Fonctionnalité disponible en V1.0.
        </p>
      </main>

      {/* Footer */}
      <footer className="px-6 pb-12 shrink-0">
        <button
          onClick={() => router.back()}
          className="w-full py-4 rounded-2xl font-semibold text-base text-white transition-opacity active:opacity-80"
          style={{ backgroundColor: "#006A4E" }}
        >
          Retour à l&apos;accueil
        </button>
      </footer>
    </div>
  );
}