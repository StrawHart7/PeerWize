// src/app/dashboard/profile/shop/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";
import { useToast } from "@/src/components/ToastProvider"; // ✅ Ajouté
import { 
  ArrowLeft, 
  Store, 
  Tag, 
  FileText, 
  MapPin, 
  Globe,
  Loader2,
  AlertCircle
} from "lucide-react";

interface Seller {
  id: string;
  nom: string;
  shop_name?: string;
  shop_category?: string;
  shop_description?: string;
  shop_address?: string;
  shop_visible?: boolean;
}

const categories = [
  "Alimentation & Épicerie",
  "Vêtements & Accessoires",
  "Électronique",
  "Cosmétiques & Beauté",
  "Maison & Décoration",
  "Santé & Bien-être",
  "Sports & Loisirs",
  "Jouets & Jeux",
  "Livres & Papeterie",
  "Artisanat & Traditions",
  "Services & Prestations",
  "Autres",
];

export default function ShopSettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast(); // ✅ Ajouté
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [formData, setFormData] = useState({
    shop_name: "",
    shop_category: "",
    shop_description: "",
    shop_address: "",
    shop_visible: true,
  });
  const [error, setError] = useState("");

  // Charger les données du vendeur
  useEffect(() => {
    const fetchSeller = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }

        const { data, error } = await supabase
          .from("sellers")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) throw error;

        if (data) {
          setSeller(data);
          setFormData({
            shop_name: data.shop_name || "",
            shop_category: data.shop_category || "",
            shop_description: data.shop_description || "",
            shop_address: data.shop_address || "",
            shop_visible: data.shop_visible ?? true,
          });
        }
      } catch (err) {
        console.error("Erreur chargement boutique:", err);
        toast("error", "Impossible de charger les paramètres de la boutique"); // ✅ Remplacé
      } finally {
        setLoading(false);
      }
    };

    fetchSeller();
  }, [supabase, router, toast]);

  // Gérer la soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seller) return;

    setSaving(true);
    setError("");

    try {
      const { error } = await supabase
        .from("sellers")
        .update({
          shop_name: formData.shop_name,
          shop_category: formData.shop_category,
          shop_description: formData.shop_description,
          shop_address: formData.shop_address,
          shop_visible: formData.shop_visible,
        })
        .eq("id", seller.id);

      if (error) throw error;

      toast("success", "Paramètres de la boutique mis à jour avec succès !"); // ✅ Remplacé
    } catch (err) {
      console.error("Erreur mise à jour:", err);
      toast("error", "Impossible de mettre à jour les paramètres de la boutique"); // ✅ Remplacé
    } finally {
      setSaving(false);
    }
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
            Paramètres de la Boutique
          </h1>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Description */}
        <p className="text-sm text-gray-500 mb-6 font-vietnam">
          Gérez les informations de votre boutique
        </p>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-tertiary flex-shrink-0 mt-0.5" />
              <p className="text-sm text-tertiary font-vietnam">{error}</p>
            </div>
          )}

          {/* Nom de la boutique */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <label
              htmlFor="shop_name"
              className="block text-sm font-medium text-neutral mb-1.5 font-vietnam"
            >
              Nom de la boutique
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <Store className="w-4 h-4 text-gray-400" />
              </div>
              <input
                id="shop_name"
                type="text"
                value={formData.shop_name}
                onChange={(e) => setFormData({ ...formData, shop_name: e.target.value })}
                placeholder="Ex: Boutique Togo Prestige"
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-vietnam text-neutral"
                required
                maxLength={50}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1 font-vietnam">
              {formData.shop_name.length}/50 caractères
            </p>
          </div>

          {/* Catégorie d'activité */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <label
              htmlFor="shop_category"
              className="block text-sm font-medium text-neutral mb-1.5 font-vietnam"
            >
              Catégorie d'activité
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <Tag className="w-4 h-4 text-gray-400" />
              </div>
              <select
                id="shop_category"
                value={formData.shop_category}
                onChange={(e) => setFormData({ ...formData, shop_category: e.target.value })}
                className="w-full pl-9 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-vietnam text-neutral appearance-none bg-white"
                required
              >
                <option value="">Sélectionnez une catégorie</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Description courte */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <label
              htmlFor="shop_description"
              className="block text-sm font-medium text-neutral mb-1.5 font-vietnam"
            >
              Description courte (Bio)
            </label>
            <div className="relative">
              <div className="absolute left-3 top-3">
                <FileText className="w-4 h-4 text-gray-400" />
              </div>
              <textarea
                id="shop_description"
                value={formData.shop_description}
                onChange={(e) => setFormData({ ...formData, shop_description: e.target.value })}
                placeholder="Décrivez votre boutique en quelques mots..."
                rows={4}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-vietnam text-neutral resize-none"
                maxLength={200}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1 font-vietnam">
              {formData.shop_description.length}/200 caractères
            </p>
          </div>

          {/* Boutique en ligne - Toggle */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Globe className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral font-vietnam">
                    Boutique en ligne
                  </p>
                  <p className="text-xs text-gray-500 font-vietnam">
                    Rendre votre boutique visible par les clients
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, shop_visible: !formData.shop_visible })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                  formData.shop_visible ? "bg-primary" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.shop_visible ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Adresse et Livraison */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <label
              htmlFor="shop_address"
              className="block text-sm font-medium text-neutral mb-1.5 font-vietnam"
            >
              Adresse et Livraison
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <MapPin className="w-4 h-4 text-gray-400" />
              </div>
              <input
                id="shop_address"
                type="text"
                value={formData.shop_address}
                onChange={(e) => setFormData({ ...formData, shop_address: e.target.value })}
                placeholder="Ex: Lomé, quartier Adidogomé"
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-vietnam text-neutral"
                required
              />
            </div>
            <p className="text-xs text-gray-400 mt-1 font-vietnam">
              Lieu de livraison ou point de rendez-vous principal
            </p>
          </div>

          {/* Bouton Enregistrer */}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:bg-[#00563e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-jakarta"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Enregistrement...
              </>
            ) : (
              "Enregistrer les modifications"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}