// src/app/about/page.tsx
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, MessageCircle, ShieldCheck, Package, Bell, Store, CreditCard, Truck } from "lucide-react";

export const metadata = {
  title: "À propos — PeerWize",
  description:
    "PeerWize structure le commerce informel togolais. Commandes, paiements Mobile Money, preuves de livraison — tout en un lien.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white flex flex-col">
      {/* NAV */}
      <nav className="flex items-center gap-3 px-5 pt-6 pb-4">
        <Link
          href="/"
          className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-100"
        >
          <ArrowLeft size={18} color="#1A1C1E" />
        </Link>
        <span className="text-sm font-semibold" style={{ color: "#1A1C1E", fontFamily: "var(--font-jakarta)" }}>
          À propos
        </span>
      </nav>

      {/* HERO */}
      <section className="px-5 pt-6 pb-10 flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mb-6">
          <Image src="/PeerWize.svg" alt="PeerWize" width={44} height={44} priority />
        </div>
        <h1
          className="text-2xl font-bold leading-snug mb-3"
          style={{ color: "#1A1C1E", fontFamily: "var(--font-jakarta)" }}
        >
          Le commerce informel,{" "}
          <span style={{ color: "#006A4E" }}>enfin structuré.</span>
        </h1>
        <p className="text-sm leading-relaxed text-gray-500 max-w-xs">
          Tu vends sur WhatsApp, TikTok, par bouche à oreille. Les commandes arrivent par DM,
          l'argent par Mobile Money, et tout le reste dans ta tête. PeerWize change ça.
        </p>
      </section>

      {/* DIVIDER */}
      <div className="mx-5 h-px bg-gray-100" />

      {/* PROBLÈME */}
      <section className="px-5 py-8">
        <h2
          className="text-base font-bold mb-4"
          style={{ color: "#1A1C1E", fontFamily: "var(--font-jakarta)" }}
        >
          Le problème qu'on résout
        </h2>
        <div className="flex flex-col gap-3">
          {[
            {
              icon: <MessageCircle size={18} color="#006A4E" />,
              title: "Des commandes perdues dans les DMs",
              desc: "Pas de trace, pas de suivi — un message oublié et c'est une vente ratée.",
            },
            {
              icon: <ShieldCheck size={18} color="#006A4E" />,
              title: "Pas de preuve, pas de confiance",
              desc: "Le client ne sait pas si son paiement est reçu. Le vendeur n'a aucune garantie.",
            },
            {
              icon: <CreditCard size={18} color="#006A4E" />,
              title: "Invisible pour les banques",
              desc: "Sans historique structuré, impossible d'accéder au crédit, même après des années de ventes.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="flex gap-3 items-start rounded-2xl bg-gray-50 p-4"
            >
              <div className="mt-0.5 shrink-0">{item.icon}</div>
              <div>
                <p className="text-sm font-semibold mb-0.5" style={{ color: "#1A1C1E" }}>
                  {item.title}
                </p>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* DIVIDER */}
      <div className="mx-5 h-px bg-gray-100" />

      {/* COMMENT ÇA MARCHE */}
      <section className="px-5 py-8">
        <h2
          className="text-base font-bold mb-1"
          style={{ color: "#1A1C1E", fontFamily: "var(--font-jakarta)" }}
        >
          Comment ça marche
        </h2>
        <p className="text-sm text-gray-500 mb-5">
          Un lien. Tes clients commandent, paient, reçoivent une confirmation — sans rien télécharger.
        </p>
        <div className="flex flex-col gap-4">
          {[
            { step: "01", text: "Tu crées ton produit en 2 minutes — nom, prix, photo." },
            { step: "02", text: "Tu copies ton lien et tu le partages partout." },
            { step: "03", text: "Ton client commande et paie en Flooz ou T-Money directement." },
            { step: "04", text: "Tu vois la commande dans ton dashboard, tu livres et tu uploades la preuve." },
          ].map((item) => (
            <div key={item.step} className="flex gap-3 items-start">
              <span
                className="text-xs font-bold px-2 py-1 rounded-lg shrink-0 mt-0.5 text-white"
                style={{ backgroundColor: "#006A4E" }}
              >
                {item.step}
              </span>
              <p className="text-sm text-gray-600 leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* DIVIDER */}
      <div className="mx-5 h-px bg-gray-100" />

      {/* GARANTIES */}
      <section className="px-5 py-8">
        <h2
          className="text-base font-bold mb-4"
          style={{ color: "#1A1C1E", fontFamily: "var(--font-jakarta)" }}
        >
          Construit pour la confiance
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: <Store size={20} color="#006A4E" />, label: "Boutique en ligne" },
            { icon: <CreditCard size={20} color="#006A4E" />, label: "Flooz & T-Money natifs" },
            { icon: <Truck size={20} color="#006A4E" />, label: "Preuve de livraison" },
            { icon: <Bell size={20} color="#006A4E" />, label: "Notifications vendeur" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl bg-gray-50 p-4 flex flex-col gap-2"
            >
              {item.icon}
              <p className="text-sm font-medium" style={{ color: "#1A1C1E" }}>
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 pt-2 pb-10 flex flex-col gap-3">
        <Link
          href="/register"
          className="w-full text-center py-4 rounded-2xl font-bold text-base text-white"
          style={{ backgroundColor: "#006A4E", fontFamily: "var(--font-jakarta)" }}
        >
          Commencer à vendre
        </Link>
        <Link
          href="/login"
          className="w-full text-center py-4 rounded-2xl font-bold text-base border border-gray-200 text-gray-700"
          style={{ fontFamily: "var(--font-jakarta)" }}
        >
          J'ai déjà un compte
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto px-5 py-6 text-center">
        <p className="text-xs text-gray-400">© PeerWize 2026 · Lomé, Togo</p>
      </footer>
    </main>
  );
}