// src/app/dashboard/profile/personal-info/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/src/lib/supabase/client";
import { ArrowLeft, Camera, Loader2, MapPin, ChevronDown, Search, Check } from "lucide-react";

interface Seller {
  id: string;
  nom: string;
  whatsapp: string;
  ville?: string;
  avatar_url?: string;
}

const villes = [
  "Lomé",
  "Kara",
  "Atakpamé",
  "Sokodé",
  "Kpalimé",
  "Tsévié",
  "Aného",
  "Bafilo",
  "Notsé",
  "Tabligbo",
  "Dapaong",
  "Mango",
  "Tchamba",
  "Sotouboua",
  "Tchaoudjo",
  "Bassar",
  "Kpendjal",
  "Binah",
  "Doufelgou",
  "Kozah",
];

// ── Custom Dropdown pour la ville ──────────────────────────────────────
function CityDropdown({
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
      <label className="block text-sm font-medium text-[var(--color-neutral)] mb-1.5 font-vietnam">
        Ville
      </label>
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent bg-white transition-all"
      >
        <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <span className={`flex-1 text-left font-vietnam ${
          value ? "text-[var(--color-neutral)]" : "text-gray-400"
        }`}>
          {value || placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
          isOpen ? "rotate-180" : ""
        }`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-80 flex flex-col animate-dropdown">
          {/* Barre de recherche */}
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher une ville..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent font-vietnam"
              />
            </div>
          </div>

          {/* Liste des options */}
          <div className="overflow-y-auto flex-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left font-vietnam"
                >
                  <span className="text-sm text-[var(--color-neutral)]">
                    {option}
                  </span>
                  {value === option && (
                    <Check className="w-4 h-4 text-[var(--color-primary)]" />
                  )}
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-gray-400 font-vietnam">
                  Aucune ville trouvée
                </p>
              </div>
            )}
          </div>

          {/* Footer avec compteur */}
          <div className="p-2 border-t border-gray-100 bg-gray-50 rounded-b-xl">
            <p className="text-xs text-gray-400 text-center font-vietnam">
              {filteredOptions.length} ville{filteredOptions.length > 1 ? "s" : ""} disponible{filteredOptions.length > 1 ? "s" : ""}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PersonalInfoPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [formData, setFormData] = useState({
    nom: "",
    whatsapp: "",
    ville: "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
          // Extraire uniquement les chiffres du numéro WhatsApp
          const whatsappNumber = data.whatsapp?.replace(/\D/g, "") || "";
          const cleanNumber = whatsappNumber.startsWith("228") 
            ? whatsappNumber.slice(3) 
            : whatsappNumber;
          
          setFormData({
            nom: data.nom || "",
            whatsapp: cleanNumber,
            ville: data.ville || "",
          });
          if (data.avatar_url) {
            setAvatarPreview(data.avatar_url);
          }
        }
      } catch (err) {
        console.error("Erreur chargement profil:", err);
        setError("Impossible de charger vos informations");
      } finally {
        setLoading(false);
      }
    };

    fetchSeller();
  }, [supabase, router]);

  // Gérer l'upload de l'avatar
  const handleAvatarUpload = async (file: File) => {
    if (!seller) return;

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${seller.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("products")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("products")
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("sellers")
        .update({ avatar_url: publicUrl })
        .eq("id", seller.id);

      if (updateError) throw updateError;

      setAvatarPreview(publicUrl);
      setAvatarFile(null);
      setSuccess("Photo de profil mise à jour");
    } catch (err) {
      console.error("Erreur upload avatar:", err);
      setError("Impossible d'uploader la photo");
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Gérer la soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seller) return;

    const cleanNumber = formData.whatsapp.replace(/\s/g, "");
    if (cleanNumber.length !== 8) {
      setError("Le numéro WhatsApp doit contenir 8 chiffres (ex: 90000000)");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const fullWhatsapp = `+228${cleanNumber}`;

      const { error } = await supabase
        .from("sellers")
        .update({
          nom: formData.nom,
          whatsapp: fullWhatsapp,
          ville: formData.ville,
        })
        .eq("id", seller.id);

      if (error) throw error;

      setSuccess("Informations mises à jour avec succès !");
    } catch (err) {
      console.error("Erreur mise à jour:", err);
      setError("Impossible de mettre à jour vos informations");
    } finally {
      setSaving(false);
    }
  };

  // Formater le numéro WhatsApp en direct
  const formatWhatsApp = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    const limited = cleaned.slice(0, 8);
    if (limited.length <= 2) return limited;
    if (limited.length <= 4) return `${limited.slice(0, 2)} ${limited.slice(2)}`;
    if (limited.length <= 6) return `${limited.slice(0, 2)} ${limited.slice(2, 4)} ${limited.slice(4)}`;
    return `${limited.slice(0, 2)} ${limited.slice(2, 4)} ${limited.slice(4, 6)} ${limited.slice(6, 8)}`;
  };

  const handleWhatsAppChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatWhatsApp(e.target.value);
    setFormData({ ...formData, whatsapp: formatted });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[var(--color-primary)] animate-spin" />
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
            <ArrowLeft className="w-5 h-5 text-[var(--color-neutral)]" />
          </button>
          <h1 className="text-xl font-semibold text-[var(--color-neutral)] font-jakarta">
            Informations Personnelles
          </h1>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Photo de profil */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <label className="block text-sm font-medium text-[var(--color-neutral)] mb-3 font-vietnam">
            Photo de profil
          </label>
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-[var(--color-primary)] overflow-hidden">
                {avatarPreview ? (
                  <Image
                    src={avatarPreview}
                    alt="Avatar"
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[var(--color-primary)] text-white text-3xl font-semibold">
                    {formData.nom?.charAt(0) || "?"}
                  </div>
                )}
              </div>
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 bg-[var(--color-primary)] text-white p-1.5 rounded-full cursor-pointer hover:bg-[#00563e] transition-colors"
              >
                <Camera className="w-4 h-4" />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 5 * 1024 * 1024) {
                        setError("La photo ne doit pas dépasser 5 Mo");
                        return;
                      }
                      setAvatarFile(file);
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setAvatarPreview(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                      handleAvatarUpload(file);
                    }
                  }}
                />
              </label>
            </div>
            {uploadingAvatar && (
              <p className="text-sm text-gray-500 font-vietnam">
                Upload en cours...
              </p>
            )}
          </div>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-[var(--color-tertiary)] rounded-lg text-sm font-vietnam">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-50 text-[var(--color-primary)] rounded-lg text-sm font-vietnam">
              {success}
            </div>
          )}

          {/* Nom Complet */}
          <div className="mb-5">
            <label
              htmlFor="nom"
              className="block text-sm font-medium text-[var(--color-neutral)] mb-1.5 font-vietnam"
            >
              Nom Complet
            </label>
            <input
              id="nom"
              type="text"
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              placeholder="Ex: Koffi Mensah"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent font-vietnam text-[var(--color-neutral)]"
              required
            />
            <p className="text-xs text-gray-500 mt-1 font-vietnam">
              Votre nom complet tel qu'il apparaîtra sur la boutique
            </p>
          </div>

          {/* Numéro WhatsApp */}
          <div className="mb-5">
            <label
              htmlFor="whatsapp"
              className="block text-sm font-medium text-[var(--color-neutral)] mb-1.5 font-vietnam"
            >
              Numéro WhatsApp
            </label>
            <div className="flex">
              <span className="inline-flex items-center px-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-gray-600 text-sm font-vietnam whitespace-nowrap">
                +228
              </span>
              <input
                id="whatsapp"
                type="tel"
                value={formData.whatsapp}
                onChange={handleWhatsAppChange}
                placeholder="90 00 00 00"
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent font-vietnam text-[var(--color-neutral)]"
                required
                maxLength={11}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1 font-vietnam">
              Entrez les 8 chiffres de votre numéro (ex: 90 00 00 00)
            </p>
          </div>

          {/* Ville - Custom Dropdown */}
          <div className="mb-6">
            <CityDropdown
              value={formData.ville}
              onChange={(value) => setFormData({ ...formData, ville: value })}
              options={villes}
              placeholder="Sélectionnez votre ville"
            />
          </div>

          {/* Bouton Enregistrer */}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-[var(--color-primary)] text-white font-semibold rounded-lg hover:bg-[#00563e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-jakarta"
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
        </form>
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