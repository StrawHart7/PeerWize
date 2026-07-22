// src/app/dashboard/profile/contact/page.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/src/lib/supabase/client";
import { useToast } from "@/src/components/ToastProvider"; // ✅ Ajouté
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MessageSquare,
  Send,
  Clock,
  Loader2,
  ChevronDown,
  Check
} from "lucide-react";

interface FormData {
  subject: string;
  message: string;
}

const subjects = [
  "Informations générales",
  "Problème technique",
  "Question sur les paiements",
  "Question sur les livraisons",
  "Modification de compte",
  "Signalement d'erreur",
  "Suggestions d'amélioration",
  "Autre",
];

// ── Custom Dropdown ──────────────────────────────────────────────────────
function SubjectDropdown({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSelect = (option: string) => {
    onChange(option);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-neutral mb-1.5 font-vietnam">
        Sujet de votre demande
      </label>
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white transition-all"
      >
        <span className={`flex-1 text-left font-vietnam ${
          value ? "text-neutral" : "text-gray-400"
        }`}>
          {value || placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
          isOpen ? "rotate-180" : ""
        }`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-80 flex flex-col animate-dropdown">
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher un sujet..."
                className="w-full pl-4 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-vietnam"
              />
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left font-vietnam"
                >
                  <span className="text-sm text-neutral">
                    {option}
                  </span>
                  {value === option && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-gray-400 font-vietnam">
                  Aucun sujet trouvé
                </p>
              </div>
            )}
          </div>

          <div className="p-2 border-t border-gray-100 bg-gray-50 rounded-b-xl">
            <p className="text-xs text-gray-400 text-center font-vietnam">
              {filteredOptions.length} sujet{filteredOptions.length > 1 ? "s" : ""} disponible{filteredOptions.length > 1 ? "s" : ""}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ContactPage() {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast(); // ✅ Ajouté
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    subject: "",
    message: "",
  });

  // Gérer l'envoi du message
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.subject) {
      toast("error", "Veuillez sélectionner un sujet"); // ✅ Remplacé
      return;
    }
    
    if (!formData.message.trim()) {
      toast("error", "Veuillez écrire un message"); // ✅ Remplacé
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("contact_messages")
        .insert({
          seller_id: user?.id || null,
          subject: formData.subject,
          message: formData.message,
          status: "pending",
        });

      if (error) throw error;

      toast("success", "Message envoyé avec succès ! Nous vous répondrons dans les plus brefs délais."); // ✅ Remplacé
      
      setFormData({
        subject: "",
        message: "",
      });
    } catch (err) {
      console.error("Erreur:", err);
      toast("error", "Impossible d'envoyer le message. Veuillez réessayer."); // ✅ Remplacé
    } finally {
      setLoading(false);
    }
  };

  // Ouvrir WhatsApp avec message préchargé
  const openWhatsApp = () => {
    const phone = "22890662192";
    const message = encodeURIComponent("Je rencontre une problème sur PeerWize");
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
            Contactez-nous
          </h1>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-2xl bg-white shadow-sm flex items-center justify-center p-3">
            <Image
              src="/PeerWize.svg"
              alt="PeerWize"
              width={60}
              height={60}
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* Titre */}
        <h2 className="text-lg font-semibold text-center text-neutral mb-2 font-jakarta">
          Besoin d'aide ?
        </h2>
        <p className="text-sm text-gray-500 text-center mb-6 font-vietnam">
          L'équipe PeerWize est là pour vous accompagner dans la gestion de votre boutique.
        </p>

        {/* Contact rapide */}
        <div className="space-y-3 mb-8">
          {/* WhatsApp */}
          <button
            onClick={openWhatsApp}
            className="w-full flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-5 h-5 text-[#25D366]" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-neutral font-vietnam">
                WhatsApp
              </p>
              <p className="text-xs text-gray-500 font-vietnam">
                Discuter sur WhatsApp
              </p>
            </div>
            <span className="text-sm text-gray-400">→</span>
          </button>

          {/* Téléphone */}
          <a
            href="tel:+22890662192"
            className="w-full flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Phone className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-neutral font-vietnam">
                Appelez-nous
              </p>
              <p className="text-xs text-gray-500 font-vietnam">
                +228 90 66 21 92
              </p>
            </div>
            <span className="text-sm text-gray-400">→</span>
          </a>

          {/* Email */}
          <a
            href="mailto:wizeentreprise@gmail.com"
            className="w-full flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-neutral font-vietnam">
                Envoyez un email
              </p>
              <p className="text-xs text-gray-500 font-vietnam">
                wizeentreprise@gmail.com
              </p>
            </div>
            <span className="text-sm text-gray-400">→</span>
          </a>
        </div>

        {/* Formulaire */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h3 className="text-md font-semibold text-neutral mb-4 font-jakarta">
            Laissez un message
          </h3>

          <form onSubmit={handleSubmit}>
            {/* Sujet - Custom Dropdown */}
            <div className="mb-4">
              <SubjectDropdown
                value={formData.subject}
                onChange={(value) => setFormData({ ...formData, subject: value })}
                options={subjects}
                placeholder="Sélectionnez un sujet"
              />
            </div>

            {/* Message */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral mb-1.5 font-vietnam">
                Votre message
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Comment pouvons-nous vous aider ?"
                rows={4}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-vietnam text-neutral resize-none"
                required
                maxLength={500}
              />
              <div className="flex justify-between mt-1">
                <p className="text-xs text-gray-400 font-vietnam">
                  Décrivez votre demande en détail
                </p>
                <p className="text-xs text-gray-400 font-vietnam">
                  {formData.message.length}/500
                </p>
              </div>
            </div>

            {/* Bouton Envoyer */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:bg-[#00563e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-jakarta"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  ENVOYER LE MESSAGE
                </>
              )}
            </button>
          </form>
        </div>

        {/* Temps de réponse */}
        <div className="flex items-center justify-center gap-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <p className="text-xs text-gray-400 font-vietnam">
            Temps de réponse moyen : moins de 24h
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes dropdown {
          from {
            transform: translateY(-8px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-dropdown {
          animation: dropdown 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}