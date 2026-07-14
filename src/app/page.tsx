"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, User } from "lucide-react";
import { createClient } from "../lib/supabase/client";

export default function LandingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const [checking, setChecking] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);

  // Redirect si déjà connecté
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace("/dashboard");
      } else {
        setChecking(false);
      }
    });
  }, [router, supabase]);

  // Fermer menu si clic outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  if (checking) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-[#006A4E] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-white relative">
      {/* ── Navbar ── */}
      <header className="flex items-center justify-between px-4 pt-12 pb-2 shrink-0">
        {/* Hamburger */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors"
            aria-label="Menu"
          >
            {menuOpen ? <X size={22} color="#1A1C1E" /> : <Menu size={22} color="#1A1C1E" />}
          </button>

          {/* Dropdown menu */}
          {menuOpen && (
            <div className="absolute top-12 left-0 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
              <Link
                href="/login"
                className="flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-[#1A1C1E] hover:bg-gray-50 active:bg-gray-100 transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                <User size={16} color="#006A4E" />
                Se connecter
              </Link>
              <div className="border-t border-gray-100" />
              <Link
                href="/about"
                className="flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-[#1A1C1E] hover:bg-gray-50 active:bg-gray-100 transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                <span className="w-4 h-4 rounded-full border-2 border-[#006A4E] flex items-center justify-center">
                  <span className="text-[8px] font-bold text-[#006A4E]">i</span>
                </span>
                À propos
              </Link>
            </div>
          )}
        </div>

        {/* Logo centré */}
        <Image src="/PeerWize.svg" alt="PeerWize" width={110} height={32} priority />

        {/* Placeholder droit pour symétrie */}
        <div className="w-10 h-10" />
      </header>

      {/* ── Corps — centré verticalement ── */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        {/* Icône logo */}
        <div className="w-20 h-20 rounded-2xl border-2 border-gray-200 flex items-center justify-center mb-8 shadow-sm">
          <Image src="/PeerWize.svg" alt="" width={48} height={48} aria-hidden />
        </div>

        {/* Headline */}
        <h1 className="text-[28px] font-bold leading-tight text-[#1A1C1E] font-[var(--font-jakarta)] mb-3">
          Le commerce simplifié, de personne à personne.
        </h1>

        {/* Sous-titre */}
        <p className="text-sm text-gray-500 font-[var(--font-vietnam)] leading-relaxed max-w-xs">
          Vendez vos produits et gérez vos commandes en toute simplicité au Togo.
        </p>
      </main>

      {/* ── CTAs en bas ── */}
      <footer className="px-6 pb-12 shrink-0 flex flex-col gap-3">
        <Link
          href="/login"
          className="w-full py-4 rounded-2xl text-white font-semibold text-base text-center transition-opacity active:opacity-80"
          style={{ backgroundColor: "#006A4E" }}
        >
          Je souhaite vendre
        </Link>

        <Link
          href="/marketplace"
          className="w-full py-4 rounded-2xl font-semibold text-base text-center border-2 border-gray-200 text-[#1A1C1E] transition-colors active:bg-gray-50"
        >
          Je souhaite acheter
        </Link>
      </footer>
    </div>
  );
}