// src/app/dashboard/profile/help/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { 
  ArrowLeft, 
  Search, 
  ChevronDown, 
  ChevronRight,
  Package,
  CreditCard,
  User,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronUp
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────
interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

interface Category {
  id: string;
  label: string;
  icon: React.ElementType;
}

// ── Données des catégories ──────────────────────────────────────────────
const categories: Category[] = [
  { id: "orders", label: "Commandes", icon: Package },
  { id: "payments", label: "Paiements", icon: CreditCard },
  { id: "account", label: "Mon Compte", icon: User },
];

// ── Données FAQ complètes ──────────────────────────────────────────────
const faqData: FAQItem[] = [
  // ── Commandes ──
  {
    id: "order-tracking",
    question: "Comment suivre ma commande en temps réel ?",
    answer: "Vous pouvez suivre vos commandes en temps réel depuis votre tableau de bord. Rendez-vous dans l'onglet 'Commandes' pour voir le statut actuel de chaque commande. Les statuts disponibles sont :\n\n• En attente de paiement\n• Paiement confirmé\n• En préparation\n• Expédiée\n• Livrée\n• Annulée\n\nUn historique complet des statuts est également disponible pour chaque commande.",
    category: "orders"
  },
  {
    id: "order-status",
    question: "Que signifient les différents statuts de commande ?",
    answer: "• En attente de paiement : Le client a passé la commande mais le paiement n'a pas encore été confirmé.\n\n• Paiement confirmé : Le paiement a été reçu avec succès via Mobile Money.\n\n• En préparation : Vous avez confirmé la commande et préparez la livraison.\n\n• Expédiée : La commande a été remise au transporteur ou est en cours de livraison.\n\n• Livrée : Le client a reçu sa commande.\n\n• Annulée : La commande a été annulée (par le client ou par vous).",
    category: "orders"
  },
  {
    id: "order-cancel",
    question: "Puis-je annuler une commande après qu'elle a été payée ?",
    answer: "Oui, il est possible d'annuler une commande après paiement, mais cela dépend du statut actuel :\n\n• Si la commande est en statut 'En attente de paiement' : Annulation immédiate possible\n• Si la commande est en statut 'Paiement confirmé' : Annulation possible avant préparation\n• Si la commande est en statut 'En préparation' : Annulation possible mais des frais peuvent s'appliquer\n• Si la commande est en statut 'Expédiée' ou 'Livrée' : Annulation impossible\n\nContactez le vendeur directement pour toute demande d'annulation.",
    category: "orders"
  },
  // ── Paiements ──
  {
    id: "payment-methods",
    question: "Quels sont les modes de paiement acceptés au Togo ?",
    answer: "PeerWize accepte les modes de paiement suivants au Togo :\n\n• Moov Money (Moov Africa)\n• Mixx by Yas (Togocel)\n• Cartes Visa/Mastercard (via Solimi et MyFeda)\n\nPour le paiement par Mobile Money, le client reçoit une notification sur son téléphone et confirme le paiement via son menu USSD (*144# pour Moov, *888# pour T-Money).\n\nLes paiements sont sécurisés par FedaPay pour le MVP, avec une migration vers CashPay de SEMOA prévue en production pour être conforme BCEAO.",
    category: "payments"
  },
  {
    id: "payment-issues",
    question: "Que faire si le paiement échoue ?",
    answer: "Si un paiement échoue, plusieurs raisons possibles :\n\n1. Solde insuffisant sur le compte Mobile Money\n2. Problème de réseau temporaire\n3. Limite de transaction atteinte\n4. Numéro de téléphone incorrect\n\nSolutions :\n• Vérifiez votre solde Mobile Money\n• Réessayez après quelques minutes\n• Assurez-vous d'avoir saisi le bon numéro\n• Contactez le support de votre opérateur si le problème persiste\n\nEn cas de problème persistant, contactez-nous via WhatsApp au +228 90 66 21 92.",
    category: "payments"
  },
  {
    id: "payment-security",
    question: "Mes paiements sont-ils sécurisés sur PeerWize ?",
    answer: "Oui, la sécurité de vos paiements est notre priorité :\n\n- Cryptage SSL des données bancaires\n- Conformité avec les normes de sécurité BCEAO\n- Utilisation de FedaPay (sandbox en MVP) / CashPay (production)\n- Les données sensibles ne sont pas stockées sur nos serveurs\n- Authentification à double facteur pour les transactions importantes\n\nNous travaillons en partenariat avec SEMOA Togo, un établissement agréé par la BCEAO, pour garantir la conformité réglementaire.",
    category: "payments"
  },
  // ── Mon Compte ──
  {
    id: "become-seller",
    question: "Comment devenir vendeur sur PeerWize ?",
    answer: "Devenir vendeur sur PeerWize est simple et rapide :\n\n1. Créez votre compte vendeur via la page d'inscription\n2. Complétez vos informations personnelles (nom, WhatsApp, ville)\n3. Configurez votre boutique (nom, catégorie, description)\n4. Ajoutez vos méthodes de paiement (Moov Money, Mixx by Yas)\n5. Créez vos premiers produits (nom, prix, photos, description)\n6. Partagez vos liens de produits sur vos réseaux sociaux\n\nAvantages :\n- Tableau de bord complet pour gérer vos commandes\n- Lien unique par produit à partager partout\n- Historique financier structuré (V2.0)\n- Accès au micro-crédit basé sur votre score de crédibilité (V2.0)",
    category: "account"
  },
  {
    id: "account-security",
    question: "Comment sécuriser mon compte vendeur ?",
    answer: "Pour sécuriser votre compte vendeur PeerWize :\n\n- Utilisez un mot de passe fort (8+ caractères, lettres, chiffres, symboles)\n- Activez l'authentification à deux facteurs (2FA) disponible dans 'Connexion & Sécurité'\n- Ne partagez jamais vos identifiants\n- Déconnectez-vous des appareils que vous n'utilisez plus\n- Vérifiez régulièrement vos sessions actives\n\nEn cas de suspicion d'accès non autorisé, changez immédiatement votre mot de passe et contactez le support.",
    category: "account"
  },
  {
    id: "edit-profile",
    question: "Comment modifier mes informations personnelles ?",
    answer: "Pour modifier vos informations personnelles :\n\n1. Connectez-vous à votre compte PeerWize\n2. Allez dans 'Profile' > 'Informations Personnelles'\n3. Modifiez les champs souhaités :\n   • Photo de profil\n   • Nom complet\n   • Numéro WhatsApp\n   • Ville\n4. Cliquez sur 'Enregistrer' pour valider les modifications\n\nToutes vos modifications sont immédiatement prises en compte.",
    category: "account"
  },
  {
    id: "shipping-info",
    question: "Comment gérer les livraisons de mes produits ?",
    answer: "La gestion des livraisons se fait dans 'Profile' > 'Expédition et Livraison' :\n\nConfiguration des zones de livraison :\n• Ajoutez des zones géographiques (ex: Lomé, Kara, Atakpamé)\n• Définissez les prix par zone\n• Activez ou désactivez des zones selon vos besoins\n\nOptions de livraison :\n• Livraison gratuite (optionnelle)\n• Frais personnalisés par zone\n\nLes frais de livraison sont automatiquement calculés et ajoutés au panier du client en fonction de son adresse de livraison.",
    category: "account"
  },
];

// ── Accordéon FAQ ────────────────────────────────────────────────────────
function FAQAccordion({ items }: { items: FAQItem[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  const toggle = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="bg-white rounded-xl shadow-sm overflow-hidden transition-all"
        >
          <button
            onClick={() => toggle(item.id)}
            className="w-full flex items-start justify-between gap-3 p-4 text-left hover:bg-gray-50 transition-colors"
          >
            <p className="text-sm font-medium text-neutral font-vietnam flex-1">
              {item.question}
            </p>
            <span className="text-gray-400 flex-shrink-0 mt-0.5">
              {openId === item.id ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </span>
          </button>
          {openId === item.id && (
            <div className="px-4 pb-4 pt-0">
              <div className="border-t border-gray-100 pt-3">
                <div className="text-sm text-gray-600 font-vietnam whitespace-pre-line leading-relaxed">
                  {item.answer}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function HelpPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Filtrer les FAQ
  const filteredFAQs = faqData.filter((item) => {
    const matchesSearch = item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory ? item.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  // Grouper les FAQ par catégorie
  const groupedFAQs = filteredFAQs.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, FAQItem[]>);

  // Ouvrir WhatsApp
  const openWhatsApp = () => {
    const phone = "22890662192";
    const message = encodeURIComponent("J'ai besoin d'aide sur PeerWize");
    window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard/profile")}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-neutral" />
          </button>
          <h1 className="text-xl font-semibold text-neutral font-jakarta">
            Centre d'Aide
          </h1>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Titre */}
        <h2 className="text-lg font-semibold text-neutral mb-1 font-jakarta">
          Comment pouvons-nous vous aider ?
        </h2>
        <p className="text-sm text-gray-500 mb-6 font-vietnam">
          Recherchez une réponse ou parcourez nos articles
        </p>

        {/* Barre de recherche */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher une solution..."
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-vietnam text-neutral bg-white shadow-sm"
          />
        </div>

        {/* Catégories */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap font-vietnam ${
              selectedCategory === null
                ? "bg-primary text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            Toutes
          </button>
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(
                  selectedCategory === category.id ? null : category.id
                )}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap font-vietnam ${
                  selectedCategory === category.id
                    ? "bg-primary text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {category.label}
              </button>
            );
          })}
        </div>

        {/* Résultats */}
        {filteredFAQs.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 font-vietnam">
              Aucune question trouvée pour votre recherche
            </p>
            <p className="text-xs text-gray-400 font-vietnam">
              Essayez avec d'autres mots-clés
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedFAQs).map(([category, items]) => {
              const categoryInfo = categories.find(c => c.id === category);
              const Icon = categoryInfo?.icon || Package;
              const categoryLabel = categoryInfo?.label || category;
              
              return (
                <div key={category}>
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-semibold text-neutral font-jakarta">
                      {categoryLabel}
                    </h3>
                    <span className="text-xs text-gray-400 font-vietnam">
                      ({items.length})
                    </span>
                  </div>
                  <FAQAccordion items={items} />
                </div>
              );
            })}
          </div>
        )}

        {/* Support 24/7 */}
        <div className="mt-8 p-4 bg-primary/5 rounded-xl border border-primary/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-neutral font-vietnam">
                Notre équipe est disponible 24/7
              </p>
              <p className="text-xs text-gray-500 font-vietnam">
                Pour vous accompagner en cas de besoin
              </p>
            </div>
          </div>
        </div>

        {/* Contact WhatsApp */}
        <button
          onClick={openWhatsApp}
          className="w-full mt-4 py-3 bg-[#25D366] text-white font-semibold rounded-xl hover:bg-[#1da851] transition-colors flex items-center justify-center gap-2 font-jakarta shadow-sm"
        >
          <MessageSquare className="w-5 h-5" />
          Nous contacter via WhatsApp
        </button>

        {/* Temps de réponse */}
        <div className="flex items-center justify-center gap-2 mt-4">
          <CheckCircle2 className="w-4 h-4 text-gray-400" />
          <p className="text-xs text-gray-400 font-vietnam">
            Réponse garantie sous 24h
          </p>
        </div>
      </div>
    </div>
  );
}