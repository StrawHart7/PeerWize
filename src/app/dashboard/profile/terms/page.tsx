// src/app/dashboard/profile/terms/page.tsx
"use client";

import { ArrowLeft, Scale, Shield, FileText, MessageCircle, Mail, Building2, Users, ShoppingBag, Ban, AlertTriangle, Clock, Trash2, Phone } from "lucide-react";
import { useRouter } from "next/navigation";

function SectionTitle({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon size={18} color="#006A4E" />
      <h2 className="text-base font-bold text-neutral font-jakarta">
        {title}
      </h2>
    </div>
  );
}

function SubSection({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 last:mb-0">
      <div className="flex items-center gap-2 mb-1">
        <Icon size={14} color="#006A4E" />
        <h3 className="text-xs font-semibold text-primary uppercase tracking-wider font-vietnam">
          {title}
        </h3>
      </div>
      <div className="text-sm text-gray-600 font-vietnam leading-relaxed">
        {children}
      </div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 shadow-sm">
      {children}
    </div>
  );
}

export default function TermsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#f5f5f5] pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Retour"
          >
            <ArrowLeft size={18} color="#1A1C1E" />
          </button>
          <h1 className="text-xl font-semibold text-neutral font-jakarta">
            Politiques & Confidentialité
          </h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">

        {/* Intro */}
        <Card>
          <div className="flex items-start gap-3">
            <Shield size={20} color="#006A4E" className="shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-bold text-neutral font-jakarta mb-1">
                Transparence & Confiance
              </h2>
              <p className="text-sm text-gray-600 font-vietnam leading-relaxed">
                Chez PeerWize, nous construisons un espace de commerce local fiable, où chaque transaction est protégée et chaque utilisateur respecté. Ces conditions définissent les règles du jeu — lisez-les, elles vous concernent directement.
              </p>
            </div>
          </div>
        </Card>

        {/* Conditions d'utilisation */}
        <Card>
          <SectionTitle icon={Scale} title="Conditions d'Utilisation" />

          <SubSection icon={Users} title="Responsabilités du compte">
            En créant un compte PeerWize, vous êtes responsable de la confidentialité de vos identifiants et de toutes les actions effectuées depuis votre compte. Les vendeurs s'engagent à fournir des informations exactes sur leurs produits, leurs prix et leurs délais de livraison. Toute information fausse ou trompeuse peut entraîner la suspension du compte.
          </SubSection>

          <SubSection icon={FileText} title="Utilisation acceptable">
            PeerWize est ouverte à toute personne capable de comprendre et d'accepter ces conditions. L'utilisation de la plateforme à des fins illégales, frauduleuses ou contraires à l'ordre public entraîne la suspension immédiate et définitive du compte. Nous nous réservons le droit de modérer les contenus qui ne respectent pas les standards de notre communauté.
          </SubSection>

          <SubSection icon={ShoppingBag} title="Produits et services autorisés">
            Vous pouvez vendre des produits numériques (cartes cadeaux, crédits jeux, abonnements) et des produits physiques livrables. Les produits interdits incluent : armes, substances illicites, contrefaçons, et tout contenu portant atteinte aux droits d'autrui.
          </SubSection>

          <SubSection icon={Ban} title="Sécurité des transactions">
            Les paiements sur PeerWize transitent uniquement par les canaux officiels intégrés (Mobile Money). PeerWize ne saurait être tenu responsable des échanges financiers effectués en dehors de la plateforme. En cas de litige, les preuves de paiement et de livraison enregistrées sur la plateforme font foi.
          </SubSection>
        </Card>

        {/* Politique de confidentialité */}
        <Card>
          <SectionTitle icon={Shield} title="Politique de Confidentialité" />

          <SubSection icon={FileText} title="Données que nous collectons">
            <p className="mb-1">Pour les vendeurs : nom, adresse email, numéro WhatsApp, numéro Mobile Money.</p>
            <p>Pour les clients : nom, numéro WhatsApp, adresse de livraison (si applicable), détails de la commande. Ces données sont strictement nécessaires au fonctionnement du service.</p>
          </SubSection>

          <SubSection icon={Shield} title="Comment nous utilisons vos données">
            Vos données servent uniquement à traiter vos commandes, vous envoyer des notifications liées à votre activité, et améliorer l'expérience sur la plateforme. Nous ne vendons, ne louons et ne partageons jamais vos données personnelles avec des tiers à des fins commerciales.
          </SubSection>

          <SubSection icon={Clock} title="Conservation des données">
            Vos données sont conservées tant que votre compte est actif. En cas de suppression de compte, vos données personnelles sont effacées dans un délai de 30 jours, à l'exception des données liées à des transactions déjà effectuées, conservées pour des raisons légales.
          </SubSection>

          <SubSection icon={Trash2} title="Vos droits">
            Vous pouvez à tout moment demander l'accès, la correction ou la suppression de vos données personnelles en nous contactant directement. Nous nous engageons à répondre dans un délai de 7 jours ouvrables.
          </SubSection>

          <SubSection icon={FileText} title="Cookies et données de navigation">
            PeerWize utilise uniquement des cookies techniques indispensables au fonctionnement de l'application (session, authentification). Aucun cookie publicitaire ou de tracking tiers n'est utilisé.
          </SubSection>
        </Card>

        {/* Règlement des litiges */}
        <Card>
          <SectionTitle icon={AlertTriangle} title="Règlement des Litiges" />
          <p className="text-sm text-gray-600 font-vietnam leading-relaxed">
            En cas de problème entre un acheteur et un vendeur, PeerWize peut intervenir comme médiateur sur la base des preuves disponibles sur la plateforme. Notre équipe s'engage à traiter tout litige signalé dans un délai de 48 heures ouvrables. La décision de PeerWize dans ce cadre est indicative et ne se substitue pas aux voies légales disponibles au Togo.
          </p>
        </Card>

        {/* Contact */}
        <Card>
          <SectionTitle icon={MessageCircle} title="Nous Contacter" />
          <div className="flex flex-col gap-3">
            <a
              href="https://wa.me/22890662192"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 active:opacity-70 transition-opacity hover:bg-gray-50 p-2 rounded-lg -mx-2"
            >
              <MessageCircle size={18} color="#006A4E" />
              <span className="text-sm text-neutral font-vietnam">+228 90 66 21 92</span>
            </a>
            <a
              href="tel:+22890662192"
              className="flex items-center gap-3 active:opacity-70 transition-opacity hover:bg-gray-50 p-2 rounded-lg -mx-2"
            >
              <Phone size={18} color="#006A4E" />
              <span className="text-sm text-neutral font-vietnam">+228 90 66 21 92</span>
            </a>
            <a
              href="mailto:wizeentreprise@gmail.com"
              className="flex items-center gap-3 active:opacity-70 transition-opacity hover:bg-gray-50 p-2 rounded-lg -mx-2"
            >
              <Mail size={18} color="#006A4E" />
              <span className="text-sm text-neutral font-vietnam">wizeentreprise@gmail.com</span>
            </a>
            <div className="flex items-center gap-3 p-2 -mx-2">
              <Building2 size={18} color="#006A4E" />
              <span className="text-sm text-neutral font-vietnam">PeerWize — Lomé, Togo</span>
            </div>
          </div>
        </Card>

        {/* Date */}
        <p className="text-center text-xs text-gray-300 mt-2 mb-4 font-vietnam">
          Dernière mise à jour : juillet 2026
        </p>

      </div>
    </div>
  );
}