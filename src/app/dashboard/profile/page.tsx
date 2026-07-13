"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  User,
  Lock,
  Store,
  CreditCard,
  Truck,
  HelpCircle,
  FileText,
  MessageSquare,
  ChevronRight,
  LogOut,
  Home,
  ShoppingBag,
  Package,
  Camera,
} from "lucide-react";
import { createClient } from "@/src/lib/supabase/client";

// ── Utilitaires avatar ──────────────────────────────────────────────────────
const AVATAR_COLORS = [
  "#006A4E", "#D21034", "#1565C0", "#6A1B9A",
  "#E65100", "#00695C", "#AD1457", "#37474F",
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// ── Types ───────────────────────────────────────────────────────────────────
interface Seller {
  id: string;
  nom: string;
  email: string;
  whatsapp: string;
  avatar_url?: string | null;
}

// ── Composant item de menu ──────────────────────────────────────────────────
function MenuItem({
  icon: Icon,
  label,
  href,
}: {
  icon: React.ElementType;
  label: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3.5 bg-white hover:bg-gray-50 active:bg-gray-100 transition-colors"
    >
      <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100 shrink-0">
        <Icon size={16} color="#006A4E" />
      </span>
      <span className="flex-1 text-sm font-medium text-[#1A1C1E]">{label}</span>
      <ChevronRight size={16} className="text-gray-400" />
    </Link>
  );
}

// ── Section wrapper ─────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 mb-1">
        {title}
      </p>
      <div className="rounded-xl overflow-hidden border border-gray-100 divide-y divide-gray-100">
        {children}
      </div>
    </div>
  );
}

// ── Bottom Nav ──────────────────────────────────────────────────────────────
function BottomNav({ active }: { active: "home" | "orders" | "products" | "profile" }) {
  const items = [
    { key: "home", label: "Home", icon: Home, href: "/dashboard" },
    { key: "orders", label: "Orders", icon: ShoppingBag, href: "/dashboard/orders" },
    { key: "products", label: "Products", icon: Package, href: "/dashboard/products/new" },
    { key: "profile", label: "Profile", icon: User, href: "/dashboard/profile" },
  ] as const;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around items-center h-16 px-2 z-50">
      {items.map(({ key, label, icon: Icon, href }) => {
        const isActive = key === active;
        return (
          <Link
            key={key}
            href={href}
            className="flex flex-col items-center gap-0.5 flex-1 py-2"
          >
            <span
              className={`w-10 h-7 flex items-center justify-center rounded-full transition-colors ${
                isActive ? "bg-[#FFCD00]" : ""
              }`}
            >
              <Icon size={20} color={isActive ? "#1A1C1E" : "#9CA3AF"} />
            </span>
            <span
              className={`text-[10px] font-medium ${
                isActive ? "text-[#1A1C1E]" : "text-gray-400"
              }`}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

// ── Page principale ─────────────────────────────────────────────────────────
export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Charger le vendeur connecté
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data } = await supabase
        .from("sellers")
        .select("id, nom, email, whatsapp, avatar_url")
        .eq("id", user.id)
        .single();

      if (data) {
        setSeller(data);
        setAvatarUrl(data.avatar_url ?? null);
      }
      setLoading(false);
    }
    load();
  }, [router, supabase]);

  // Upload avatar
  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !seller) return;

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `avatars/${seller.id}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("products")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("products")
        .getPublicUrl(path);

      const newUrl = urlData.publicUrl;
      setAvatarUrl(newUrl);

      await supabase
        .from("sellers")
        .update({ avatar_url: newUrl })
        .eq("id", seller.id);
    } catch (err) {
      console.error("Erreur upload avatar:", err);
    } finally {
      setUploading(false);
    }
  }

  // Déconnexion
  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#006A4E] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const name = seller?.nom ?? "Vendeur";
  const initials = getInitials(name);
  const bgColor = getAvatarColor(name);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white px-4 pt-12 pb-6 flex flex-col items-center border-b border-gray-100">
        {/* Avatar */}
        <div className="relative mb-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="relative w-20 h-20 rounded-2xl overflow-hidden focus:outline-none focus:ring-2 focus:ring-[#006A4E] focus:ring-offset-2"
            aria-label="Changer la photo de profil"
          >
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={name}
                fill
                className="object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ backgroundColor: bgColor }}
              >
                <span className="text-white text-2xl font-bold font-[var(--font-jakarta)]">
                  {initials}
                </span>
              </div>
            )}

            {/* Overlay caméra */}
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              {uploading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera size={18} color="white" />
              )}
            </div>
          </button>

          {/* Badge caméra toujours visible sur mobile */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#FFCD00] rounded-full flex items-center justify-center shadow-sm"
            aria-hidden="true"
          >
            <Camera size={12} color="#1A1C1E" />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>

        {/* Nom */}
        <h1 className="text-lg font-bold text-[#1A1C1E] font-[var(--font-jakarta)]">
          {name}
        </h1>

        {/* Boutique vérifiée */}
        <div className="flex items-center gap-1 mt-0.5">
          <span className="text-sm text-gray-500 font-[var(--font-vietnam)]">
            Boutique Togo
          </span>
          <span className="text-[#006A4E]">✓</span>
        </div>
      </div>

      {/* Contenu */}
      <div className="px-4 pt-6">
        <Section title="Account">
          <MenuItem icon={User} label="Personal Info" href="/dashboard/profile/personal" />
          <MenuItem icon={Lock} label="Login & Security" href="/dashboard/profile/security" />
        </Section>

        <Section title="Shop">
          <MenuItem icon={Store} label="Shop Settings" href="/dashboard/profile/shop" />
          <MenuItem icon={CreditCard} label="Payment Methods" href="/dashboard/profile/payment" />
          <MenuItem icon={Truck} label="Shipping & Delivery" href="/dashboard/profile/shipping" />
        </Section>

        <Section title="Support & Legal">
          <MenuItem icon={HelpCircle} label="Help Center" href="/dashboard/profile/help" />
          <MenuItem icon={FileText} label="Terms & Privacy" href="/dashboard/profile/terms" />
          <MenuItem icon={MessageSquare} label="Contact Us" href="/dashboard/profile/contact" />
        </Section>

        {/* Déconnexion */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3.5 mt-2 rounded-xl border border-red-100 bg-white text-[#D21034] font-semibold text-sm active:bg-red-50 transition-colors"
        >
          <LogOut size={16} />
          Déconnexion
        </button>

        {/* Version */}
        <p className="text-center text-xs text-gray-300 mt-4 mb-2 font-[var(--font-vietnam)]">
          Version 1.0.0-mvp
        </p>
      </div>

      <BottomNav active="profile" />
    </div>
  );
}