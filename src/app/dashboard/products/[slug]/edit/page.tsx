"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";
import { useToast } from "@/src/components/ToastProvider";
import { 
  X, 
  Loader2, 
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon
} from "lucide-react";
import Image from "next/image";

interface Product {
  id: string;
  nom: string;
  description: string | null;
  prix_fcfa: number;
  photo_url: string | null;
  slug: string;
  actif: boolean;
  seller_id: string;
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;
  const supabase = createClient();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Formulaire
  const [form, setForm] = useState({
    nom: "",
    description: "",
    prix_fcfa: "",
    actif: true,
  });
  
  // Photo
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Charger le produit
  useEffect(() => {
    if (!slug) {
      router.push("/dashboard/products");
      return;
    }

    async function loadProduct() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }

        const { data, error } = await supabase
          .from("products")
          .select("id, nom, description, prix_fcfa, photo_url, slug, actif, seller_id")
          .eq("slug", slug)
          .single();

        if (error || !data) {
          toast("error", "Produit introuvable");
          router.push("/dashboard/products");
          return;
        }

        // Vérifier que le produit appartient au vendeur connecté
        if (data.seller_id !== user.id) {
          toast("error", "Vous n'êtes pas autorisé à modifier ce produit");
          router.push("/dashboard/products");
          return;
        }

        setProduct(data);
        setForm({
          nom: data.nom,
          description: data.description || "",
          prix_fcfa: String(data.prix_fcfa),
          actif: data.actif,
        });
        setExistingPhotoUrl(data.photo_url);
        setPhotoPreview(data.photo_url);
      } catch (err) {
        console.error("Erreur chargement produit:", err);
        setError("Impossible de charger le produit");
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [slug, supabase, router, toast]);

  // Gérer l'upload de la photo
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      setError("La photo ne doit pas dépasser 5MB.");
      return;
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  // Gérer la soumission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    if (!form.nom.trim() || !form.prix_fcfa) {
      setError("Le nom et le prix sont obligatoires.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Non connecté.");
        setSaving(false);
        return;
      }

      let photo_url = existingPhotoUrl;

      // Nouvelle photo uploadée
      if (photoFile) {
        setUploadingPhoto(true);
        const ext = photoFile.name.split(".").pop();
        const path = `${user.id}/${product.slug}-${Date.now()}.${ext}`;
        
        const { error: uploadError } = await supabase.storage
          .from("products")
          .upload(path, photoFile);

        if (uploadError) {
          setError("Erreur upload photo : " + uploadError.message);
          setSaving(false);
          setUploadingPhoto(false);
          return;
        }

        const { data: urlData } = supabase.storage
          .from("products")
          .getPublicUrl(path);

        photo_url = urlData.publicUrl;
        setUploadingPhoto(false);
      }

      const { error: updateError } = await supabase
        .from("products")
        .update({
          nom: form.nom.trim(),
          description: form.description.trim(),
          prix_fcfa: parseInt(form.prix_fcfa),
          photo_url: photo_url,
          actif: form.actif,
        })
        .eq("id", product.id);

      if (updateError) throw updateError;

      toast("success", "Produit modifié avec succès !");
      router.push("/dashboard/products");
    } catch (err) {
      console.error("Erreur mise à jour:", err);
      setError("Impossible de mettre à jour le produit");
    } finally {
      setSaving(false);
    }
  };

  // Fermer le modal (retour à la liste)
  const handleClose = () => {
    router.push("/dashboard/products");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
      <div className="bg-white w-full max-w-md rounded-t-2xl p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-neutral font-jakarta">
            Modifier le produit
          </h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Erreur */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-tertiary rounded-lg text-sm font-vietnam flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Succès */}
          {success && (
            <div className="mb-4 p-3 bg-green-50 text-primary rounded-lg text-sm font-vietnam flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              {success}
            </div>
          )}

          {/* Photo */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral mb-1.5 font-vietnam">
              Photo du produit
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoChange}
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative w-full rounded-xl overflow-hidden cursor-pointer"
              style={{ height: "10rem", backgroundColor: "#f9fafb", border: photoPreview ? "none" : "2px dashed #d1d5db" }}
            >
              {photoPreview ? (
                <>
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: `url(${photoPreview})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      filter: "blur(16px) brightness(0.6)",
                      transform: "scale(1.15)",
                    }}
                  />
                  <img
                    src={photoPreview}
                    alt="preview"
                    className="absolute inset-0 w-full h-full object-contain"
                    style={{ zIndex: 1 }}
                  />
                  <div
                    className="absolute bottom-2 right-2 px-2 py-1 rounded-md text-xs text-white"
                    style={{ backgroundColor: "rgba(0,0,0,0.55)", zIndex: 2 }}
                  >
                    Changer
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-2">
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                  <span className="text-sm font-medium text-gray-500 font-vietnam">
                    Appuyez pour ajouter une photo
                  </span>
                  <span className="text-xs text-gray-400 font-vietnam">
                    JPG, PNG, WEBP (Max 5MB)
                  </span>
                </div>
              )}
            </div>
            {uploadingPhoto && (
              <p className="text-xs text-gray-400 mt-1 font-vietnam">
                Upload en cours...
              </p>
            )}
          </div>

          {/* Nom */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral mb-1.5 font-vietnam">
              Nom du produit
            </label>
            <input
              type="text"
              value={form.nom}
              onChange={(e) => setForm({ ...form, nom: e.target.value })}
              placeholder="Ex: Smartphone X2"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-vietnam text-neutral"
              required
            />
          </div>

          {/* Prix */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral mb-1.5 font-vietnam">
              Prix en FCFA
            </label>
            <div className="relative">
              <input
                type="number"
                value={form.prix_fcfa}
                onChange={(e) => setForm({ ...form, prix_fcfa: e.target.value })}
                placeholder="0"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-vietnam text-neutral pr-16"
                required
                min="0"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400 font-vietnam">
                FCFA
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral mb-1.5 font-vietnam">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="Décrivez les caractéristiques et l'état de votre produit..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-vietnam text-neutral resize-none"
            />
            <p className="text-xs text-gray-400 mt-1 text-right font-vietnam">
              {form.description.length}/500
            </p>
          </div>

          {/* Slug - Lecture seule */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral mb-1.5 font-vietnam">
              Lien du produit
            </label>
            <div
              className="flex items-center gap-2 rounded-lg px-4 py-2.5"
              style={{ backgroundColor: "#f8f9fa", border: "1px solid #f3f4f6" }}
            >
              <span className="text-xs truncate text-gray-500 font-vietnam">
                {typeof window !== "undefined" ? window.location.origin : ""}/p/{product?.slug}
              </span>
              <span className="ml-auto text-xs px-2 py-0.5 rounded-md text-gray-400 font-vietnam" style={{ backgroundColor: "#f3f4f6" }}>
                fixe
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1 font-vietnam">
              Le lien ne change pas après création.
            </p>
          </div>

          {/* Toggle actif */}
          <div className="mb-6">
            <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
              <div>
                <p className="text-sm font-semibold text-neutral font-vietnam">Produit actif</p>
                <p className="text-xs text-gray-500 font-vietnam">Visible par vos clients immédiatement</p>
              </div>
              <button
                type="button"
                onClick={() => setForm({ ...form, actif: !form.actif })}
                className="relative flex-shrink-0 w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none"
                style={{ backgroundColor: form.actif ? "#006A4E" : "#d1d5db" }}
              >
                <span
                  className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200"
                  style={{ left: form.actif ? "26px" : "2px" }}
                />
              </button>
            </div>
          </div>

          {/* Boutons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors font-jakarta"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-[#00563e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-jakarta"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                "Enregistrer"
              )}
            </button>
          </div>
        </form>
      </div>

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