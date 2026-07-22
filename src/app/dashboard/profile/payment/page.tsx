// src/app/dashboard/profile/payment/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/src/lib/supabase/client";
import { useToast } from "@/src/components/ToastProvider"; // ✅ Ajouté
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  CheckCircle2,
  Loader2,
  Shield,
  Smartphone,
  AlertCircle,
  X,
  Star
} from "lucide-react";

interface PaymentMethod {
  id: string;
  provider: "moov" | "togocel";
  provider_name: string;
  phone_number: string;
  is_default: boolean;
}

interface Seller {
  id: string;
  payment_methods?: PaymentMethod[];
}

// ── Icônes avec images ──────────────────────────────────────────────────────
const MoovIcon = () => (
  <div className="w-8 h-8 rounded-lg overflow-hidden bg-white flex items-center justify-center"> {/* ✅ Retiré border */}
    <Image
      src="/assets/payment/moov.png"
      alt="Moov Money"
      width={32}
      height={32}
      className="w-full h-full object-contain"
    />
  </div>
);

const TogocelIcon = () => (
  <div className="w-8 h-8 rounded-lg overflow-hidden bg-white flex items-center justify-center"> {/* ✅ Retiré border */}
    <Image
      src="/assets/payment/mixx.png"
      alt="Mixx by Yas"
      width={32}
      height={32}
      className="w-full h-full object-contain"
    />
  </div>
);

// ── Providers ──────────────────────────────────────────────────────────────
const PROVIDERS = [
  { 
    id: "togocel", 
    name: "Mixx by Yas", 
    icon: TogocelIcon,
    color: "#FF6B00" 
  },
  { 
    id: "moov", 
    name: "Moov Money", 
    icon: MoovIcon,
    color: "#00A3E0" 
  },
];

export default function PaymentMethodsPage() {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast(); // ✅ Ajouté
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [error, setError] = useState("");
  const [newMethod, setNewMethod] = useState({
    provider: "moov",
    phone_number: "",
  });

  // Charger les méthodes de paiement
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }

        const { data, error } = await supabase
          .from("sellers")
          .select(`
            id,
            payment_methods (
              id,
              provider,
              provider_name,
              phone_number,
              is_default
            )
          `)
          .eq("id", user.id)
          .single();

        if (error) throw error;

        if (data) {
          setSeller(data);
          setPaymentMethods(data.payment_methods || []);
        }
      } catch (err) {
        console.error("Erreur chargement méthodes de paiement:", err);
        toast("error", "Impossible de charger vos méthodes de paiement"); // ✅ Remplacé
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentMethods();
  }, [supabase, router, toast]);

  // Ajouter une méthode de paiement
  const handleAddMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seller) return;

    const cleanNumber = newMethod.phone_number.replace(/\s/g, "");
    if (cleanNumber.length !== 8) {
      toast("error", "Le numéro doit contenir 8 chiffres (ex: 90123456)"); // ✅ Remplacé
      return;
    }

    setSaving(true);
    setError("");

    try {
      const provider = PROVIDERS.find(p => p.id === newMethod.provider);
      const fullNumber = `+228${cleanNumber}`;
      const isDefault = paymentMethods.length === 0;

      const { data, error } = await supabase
        .from("payment_methods")
        .insert({
          seller_id: seller.id,
          provider: newMethod.provider,
          provider_name: provider?.name || newMethod.provider,
          phone_number: fullNumber,
          is_default: isDefault,
        })
        .select()
        .single();

      if (error) throw error;

      setPaymentMethods([...paymentMethods, data]);
      setNewMethod({ provider: "moov", phone_number: "" });
      setShowAddModal(false);
      toast("success", "Compte ajouté avec succès !"); // ✅ Remplacé
    } catch (err) {
      console.error("Erreur ajout méthode:", err);
      toast("error", "Impossible d'ajouter le compte"); // ✅ Remplacé
    } finally {
      setSaving(false);
    }
  };

  // Supprimer une méthode de paiement
  const handleDeleteMethod = async (methodId: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce compte ?")) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("payment_methods")
        .delete()
        .eq("id", methodId);

      if (error) throw error;

      setPaymentMethods(paymentMethods.filter(m => m.id !== methodId));
      toast("success", "Compte supprimé avec succès"); // ✅ Remplacé
    } catch (err) {
      console.error("Erreur suppression:", err);
      toast("error", "Impossible de supprimer le compte"); // ✅ Remplacé
    } finally {
      setLoading(false);
    }
  };

  // Définir une méthode comme principale
  const handleSetDefault = async (methodId: string) => {
    if (!seller) return;

    setLoading(true);
    try {
      const { error: resetError } = await supabase
        .from("payment_methods")
        .update({ is_default: false })
        .eq("seller_id", seller.id);

      if (resetError) throw resetError;

      const { error: updateError } = await supabase
        .from("payment_methods")
        .update({ is_default: true })
        .eq("id", methodId);

      if (updateError) throw updateError;

      setPaymentMethods(paymentMethods.map(m => ({
        ...m,
        is_default: m.id === methodId
      })));
      toast("success", "Compte principal mis à jour"); // ✅ Remplacé
    } catch (err) {
      console.error("Erreur définition par défaut:", err);
      toast("error", "Impossible de définir le compte principal"); // ✅ Remplacé
    } finally {
      setLoading(false);
    }
  };

  // Formater le numéro de téléphone
  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length <= 4) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4)}`;
    return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6, 8)}`;
  };

  // Formater le numéro en direct
  const formatPhoneInput = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    const limited = cleaned.slice(0, 8);
    if (limited.length <= 2) return limited;
    if (limited.length <= 4) return `${limited.slice(0, 2)} ${limited.slice(2)}`;
    if (limited.length <= 6) return `${limited.slice(0, 2)} ${limited.slice(2, 4)} ${limited.slice(4)}`;
    return `${limited.slice(0, 2)} ${limited.slice(2, 4)} ${limited.slice(4, 6)} ${limited.slice(6, 8)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneInput(e.target.value);
    setNewMethod({ ...newMethod, phone_number: formatted });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

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
            Méthodes de Paiement
          </h1>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Description */}
        <p className="text-sm text-gray-500 mb-6 font-vietnam">
          Gérez vos comptes Mobile Money pour recevoir vos paiements en toute sécurité.
        </p>

        {/* Liste des méthodes de paiement */}
        {paymentMethods.length > 0 ? (
          <div className="space-y-3 mb-6">
            {paymentMethods.map((method) => {
              const provider = PROVIDERS.find(p => p.id === method.provider);
              const IconComponent = provider?.icon;
              
              return (
                <div
                  key={method.id}
                  className={`bg-white rounded-xl shadow-sm p-4 border-2 transition-all ${
                    method.is_default ? "border-primary" : "border-transparent"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {/* Icône */}
                      {IconComponent ? (
                        <IconComponent />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                          <Smartphone className="w-4 h-4 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-neutral font-vietnam">
                            {provider?.name || method.provider_name}
                          </p>
                          {method.is_default && (
                            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                              Principal
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 font-vietnam">
                          {method.phone_number}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {!method.is_default && (
                        <button
                          onClick={() => handleSetDefault(method.id)}
                          className="p-1.5 text-gray-400 hover:text-primary transition-colors"
                          title="Définir comme principal"
                        >
                          <Star className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteMethod(method.id)}
                        className="p-1.5 text-gray-400 hover:text-tertiary transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center mb-6 border-2 border-dashed border-gray-200">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Smartphone className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 font-vietnam">
              Aucun compte Mobile Money enregistré
            </p>
            <p className="text-xs text-gray-400 mt-1 font-vietnam">
              Ajoutez votre premier compte pour recevoir des paiements
            </p>
          </div>
        )}

        {/* Section Ajouter */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <p className="text-sm font-medium text-neutral font-vietnam mb-1">
            Besoin d'un nouveau canal ?
          </p>
          <p className="text-xs text-gray-500 font-vietnam mb-3">
            Ajoutez un autre compte pour plus de flexibilité dans vos transactions.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full py-2.5 border-2 border-dashed border-primary rounded-lg text-primary font-medium hover:bg-primary/5 transition-colors flex items-center justify-center gap-2 font-vietnam"
          >
            <Plus className="w-4 h-4" />
            Ajouter un compte
          </button>
        </div>

        {/* Sécurité */}
        <div className="flex items-center gap-2 justify-center">
          <Shield className="w-4 h-4 text-gray-400" />
          <p className="text-xs text-gray-400 font-vietnam">
            Vos données sont cryptées et sécurisées
          </p>
        </div>
      </div>

      {/* Modal Ajout compte */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-md rounded-t-2xl p-6 animate-slide-up">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-neutral font-jakarta">
                Ajouter un compte
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleAddMethod}>
              {error && (
                <div className="mb-4 p-3 bg-red-50 text-tertiary rounded-lg text-sm font-vietnam">
                  {error}
                </div>
              )}

              {/* Provider */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-neutral mb-1.5 font-vietnam">
                  Opérateur
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {PROVIDERS.map((provider) => {
                    const IconComponent = provider.icon;
                    return (
                      <button
                        key={provider.id}
                        type="button"
                        onClick={() => setNewMethod({ ...newMethod, provider: provider.id })}
                        className={`p-3 rounded-lg border-2 transition-all text-center ${
                          newMethod.provider === provider.id
                            ? "border-primary bg-primary/5"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex justify-center mb-1">
                          {IconComponent ? (
                            <IconComponent />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                              <Smartphone className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <span className="text-xs font-medium text-neutral font-vietnam">
                          {provider.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Numéro de téléphone */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-neutral mb-1.5 font-vietnam">
                  Numéro de téléphone
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-gray-600 text-sm font-vietnam whitespace-nowrap">
                    +228
                  </span>
                  <input
                    type="tel"
                    value={newMethod.phone_number}
                    onChange={handlePhoneChange}
                    placeholder="90 12 34 56"
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-vietnam text-neutral"
                    required
                    maxLength={11}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1 font-vietnam">
                  Entrez les 8 chiffres (ex: 90 12 34 56)
                </p>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:bg-[#00563e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-jakarta"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Ajout en cours...
                  </>
                ) : (
                  "Ajouter le compte"
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}