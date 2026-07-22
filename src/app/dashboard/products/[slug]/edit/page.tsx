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

interface Product {
  id: string;
  nom: string;
  description: string | null;
  prix_fcfa: number;
  photo_url: string | null;
  photos: string[] | null;
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
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [offsetX, setOffsetX] = useState(0);
  
  // Formulaire
  const [form, setForm] = useState({
    nom: "",
    description: "",
    prix_fcfa: "",
    actif: true,
  });
  
  // Photos
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
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
          .select("id, nom, description, prix_fcfa, photo_url, photos, slug, actif, seller_id")
          .eq("slug", slug)
          .single();

        if (error || !data) {
          toast("error", "Produit introuvable");
          router.push("/dashboard/products");
          return;
        }

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
        
        const existing = data.photos || (data.photo_url ? [data.photo_url] : []);
        setExistingPhotos(existing);
        setPhotoPreviews(existing);
      } catch (err) {
        console.error("Erreur chargement produit:", err);
        setError("Impossible de charger le produit");
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [slug, supabase, router, toast]);

  // Gérer l'upload des photos
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles: File[] = [];
    const newPreviews: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 5 * 1024 * 1024) {
        setError(`La photo "${file.name}" dépasse 5MB.`);
        continue;
      }
      newFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    }

    if (newFiles.length > 0) {
      setPhotoFiles(prev => [...prev, ...newFiles]);
      setPhotoPreviews(prev => [...prev, ...newPreviews]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removePhoto = (index: number) => {
    if (index < existingPhotos.length) {
      setExistingPhotos(prev => prev.filter((_, i) => i !== index));
      setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
    } else {
      const newIndex = index - existingPhotos.length;
      setPhotoFiles(prev => prev.filter((_, i) => i !== newIndex));
      setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
    }
    
    if (currentPhotoIndex >= index && currentPhotoIndex > 0) {
      setCurrentPhotoIndex(prev => prev - 1);
    }
  };

  // ── Carousel navigation ──
  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.targetTouches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    setOffsetX(e.targetTouches[0].clientX - startX);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    const allPhotos = [...photoPreviews];
    if (Math.abs(offsetX) > 50) {
      if (offsetX < 0 && currentPhotoIndex < allPhotos.length - 1) {
        setCurrentPhotoIndex(currentPhotoIndex + 1);
      } else if (offsetX > 0 && currentPhotoIndex > 0) {
        setCurrentPhotoIndex(currentPhotoIndex - 1);
      }
    }
    setOffsetX(0);
    setStartX(0);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setStartX(e.clientX);
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffsetX(e.clientX - startX);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    const allPhotos = [...photoPreviews];
    if (Math.abs(offsetX) > 50) {
      if (offsetX < 0 && currentPhotoIndex < allPhotos.length - 1) {
        setCurrentPhotoIndex(currentPhotoIndex + 1);
      } else if (offsetX > 0 && currentPhotoIndex > 0) {
        setCurrentPhotoIndex(currentPhotoIndex - 1);
      }
    }
    setOffsetX(0);
    setStartX(0);
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      setOffsetX(0);
      setStartX(0);
    }
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

      let allPhotos = [...existingPhotos];

      if (photoFiles.length > 0) {
        setUploadingPhoto(true);
        for (let i = 0; i < photoFiles.length; i++) {
          const file = photoFiles[i];
          const ext = file.name.split(".").pop();
          const path = `${user.id}/${product.slug}-${Date.now()}-${i}.${ext}`;
          
          const { error: uploadError } = await supabase.storage
            .from("products")
            .upload(path, file);

          if (uploadError) {
            setError("Erreur upload photo : " + uploadError.message);
            setSaving(false);
            setUploadingPhoto(false);
            return;
          }

          const { data: urlData } = supabase.storage
            .from("products")
            .getPublicUrl(path);

          allPhotos.push(urlData.publicUrl);
        }
        setUploadingPhoto(false);
      }

      const { error: updateError } = await supabase
        .from("products")
        .update({
          nom: form.nom.trim(),
          description: form.description.trim(),
          prix_fcfa: parseInt(form.prix_fcfa),
          photos: allPhotos,
          photo_url: allPhotos[0] || null,
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

  const allPhotos = [...photoPreviews];

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
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-tertiary rounded-lg text-sm font-vietnam flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 text-primary rounded-lg text-sm font-vietnam flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              {success}
            </div>
          )}

          {/* Photos - Carousel avec swipe/drag */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral mb-1.5 font-vietnam">
              Photos du produit
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoChange}
              multiple
              className="hidden"
            />
            
            {allPhotos.length > 0 ? (
              <div 
                className="relative w-full rounded-xl overflow-hidden select-none"
                style={{ height: "12rem", backgroundColor: "#f9fafb", cursor: "grab" }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
              >
                <div 
                  className="flex h-full"
                  style={{
                    transform: `translateX(${isDragging ? offsetX : 0}px)`,
                    transition: !isDragging ? "transform 0.3s ease-out" : "none",
                  }}
                >
                  {allPhotos.map((photo, index) => (
                    <img
                      key={index}
                      src={photo}
                      alt={`Photo ${index + 1}`}
                      className="h-full w-full object-contain flex-shrink-0"
                      draggable={false}
                      style={{ userSelect: "none", pointerEvents: "none" }}
                    />
                  ))}
                </div>

                {allPhotos.length > 1 && (
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 pointer-events-none">
                    {allPhotos.map((_, index) => (
                      <span
                        key={index}
                        className="block rounded-full transition-all"
                        style={{
                          width: index === currentPhotoIndex ? "8px" : "4px",
                          height: "4px",
                          backgroundColor: index === currentPhotoIndex ? "#006A4E" : "rgba(255,255,255,0.4)",
                        }}
                      />
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removePhoto(currentPhotoIndex) }}
                  className="absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: "rgba(210,16,52,0.8)", zIndex: 2 }}
                >
                  <X className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
                  className="absolute bottom-2 right-2 px-2 py-1 rounded-md text-xs text-white cursor-pointer"
                  style={{ backgroundColor: "rgba(0,0,0,0.55)", zIndex: 2 }}
                >
                  Ajouter +
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full rounded-xl flex flex-col items-center justify-center cursor-pointer"
                style={{ height: "10rem", backgroundColor: "#f9fafb", border: "2px dashed #d1d5db" }}
              >
                <ImageIcon className="w-8 h-8 text-gray-400" />
                <span className="text-sm font-medium text-gray-500 font-vietnam mt-2">
                  Appuyez pour ajouter des photos
                </span>
                <span className="text-xs text-gray-400 font-vietnam">
                  JPG, PNG, WEBP (Max 5MB chacun)
                </span>
              </div>
            )}
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