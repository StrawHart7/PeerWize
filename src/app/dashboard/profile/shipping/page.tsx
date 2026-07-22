// src/app/dashboard/profile/shipping/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/src/lib/supabase/client";
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  CheckCircle2,
  Loader2,
  AlertCircle,
  X,
  MapPin,
  Truck,
  Edit2,
  ToggleLeft,
  ToggleRight
} from "lucide-react";

interface ShippingZone {
  id: string;
  name: string;
  description: string;
  price: number;
  is_active: boolean;
}

interface Seller {
  id: string;
  free_shipping: boolean;
  shipping_zones?: ShippingZone[];
}

// ── Toggle Switch ──────────────────────────────────────────────────────────
function ToggleSwitch({ 
  enabled, 
  onChange,
  disabled 
}: { 
  enabled: boolean; 
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
        enabled ? "bg-primary" : "bg-gray-300"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export default function ShippingPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [freeShipping, setFreeShipping] = useState(false);
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingZone, setEditingZone] = useState<ShippingZone | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [newZone, setNewZone] = useState({
    name: "",
    description: "",
    price: "",
  });

  // Charger les données
  useEffect(() => {
    const fetchShippingData = async () => {
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
            free_shipping,
            shipping_zones (
              id,
              name,
              description,
              price,
              is_active
            )
          `)
          .eq("id", user.id)
          .single();

        if (error) throw error;

        if (data) {
          setSeller(data);
          setFreeShipping(data.free_shipping || false);
          setZones(data.shipping_zones || []);
        }
      } catch (err) {
        console.error("Erreur chargement livraison:", err);
        setError("Impossible de charger les données de livraison");
      } finally {
        setLoading(false);
      }
    };

    fetchShippingData();
  }, [supabase, router]);

  // Ajouter une zone
  const handleAddZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seller) return;

    const price = parseFloat(newZone.price);
    if (!newZone.name.trim()) {
      setError("Le nom de la zone est requis");
      return;
    }
    if (isNaN(price) || price <= 0) {
      setError("Le prix doit être un nombre valide");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const { data, error } = await supabase
        .from("shipping_zones")
        .insert({
          seller_id: seller.id,
          name: newZone.name,
          description: newZone.description,
          price: price,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      setZones([...zones, data]);
      setNewZone({ name: "", description: "", price: "" });
      setShowAddModal(false);
      setSuccess("Zone de livraison ajoutée avec succès !");
    } catch (err) {
      console.error("Erreur ajout zone:", err);
      setError("Impossible d'ajouter la zone");
    } finally {
      setSaving(false);
    }
  };

  // Modifier une zone
  const handleEditZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingZone) return;

    const price = parseFloat(newZone.price);
    if (!newZone.name.trim()) {
      setError("Le nom de la zone est requis");
      return;
    }
    if (isNaN(price) || price <= 0) {
      setError("Le prix doit être un nombre valide");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const { error } = await supabase
        .from("shipping_zones")
        .update({
          name: newZone.name,
          description: newZone.description,
          price: price,
        })
        .eq("id", editingZone.id);

      if (error) throw error;

      setZones(zones.map(z => 
        z.id === editingZone.id 
          ? { ...z, name: newZone.name, description: newZone.description, price: price }
          : z
      ));
      setShowEditModal(false);
      setEditingZone(null);
      setSuccess("Zone de livraison modifiée avec succès !");
    } catch (err) {
      console.error("Erreur modification zone:", err);
      setError("Impossible de modifier la zone");
    } finally {
      setSaving(false);
    }
  };

  // Supprimer une zone
  const handleDeleteZone = async (zoneId: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cette zone de livraison ?")) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("shipping_zones")
        .delete()
        .eq("id", zoneId);

      if (error) throw error;

      setZones(zones.filter(z => z.id !== zoneId));
      setSuccess("Zone de livraison supprimée");
    } catch (err) {
      console.error("Erreur suppression:", err);
      setError("Impossible de supprimer la zone");
    } finally {
      setLoading(false);
    }
  };

  // Activer/Désactiver une zone
  const handleToggleZone = async (zoneId: string, currentStatus: boolean) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("shipping_zones")
        .update({ is_active: !currentStatus })
        .eq("id", zoneId);

      if (error) throw error;

      setZones(zones.map(z => 
        z.id === zoneId 
          ? { ...z, is_active: !currentStatus }
          : z
      ));
    } catch (err) {
      console.error("Erreur toggle zone:", err);
      setError("Impossible de modifier le statut de la zone");
    } finally {
      setLoading(false);
    }
  };

  // Mettre à jour la livraison gratuite
  const handleToggleFreeShipping = async () => {
    if (!seller) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("sellers")
        .update({ free_shipping: !freeShipping })
        .eq("id", seller.id);

      if (error) throw error;

      setFreeShipping(!freeShipping);
      setSuccess("Livraison gratuite " + (!freeShipping ? "activée" : "désactivée"));
    } catch (err) {
      console.error("Erreur mise à jour livraison gratuite:", err);
      setError("Impossible de mettre à jour la livraison gratuite");
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (zone: ShippingZone) => {
    setEditingZone(zone);
    setNewZone({
      name: zone.name,
      description: zone.description || "",
      price: zone.price.toString(),
    });
    setShowEditModal(true);
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
            Livraison
          </h1>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Image de couverture */}
        <div className="mb-6 rounded-xl overflow-hidden bg-gray-100">
          <Image
            src="/assets/delivery/delivery.png"
            alt="Livraison PeerWize"
            width={400}
            height={120}
            className="w-full h-auto object-cover"
          />
        </div>

        {/* Description */}
        <div className="mb-6">
          <p className="text-sm text-gray-500 font-vietnam">
            <span className="font-semibold text-neutral">LOGISTIQUE DE PROXIMITÉ</span>
            <br />
            Gérez vos tarifs et zones d'expédition en un clic.
          </p>
        </div>

        {/* Livraison gratuite - AVEC TOGGLE */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral font-vietnam">
                Livraison gratuite
              </p>
              <p className="text-xs text-gray-500 font-vietnam">
                Activer pour toutes les commandes
              </p>
            </div>
            <ToggleSwitch
              enabled={freeShipping}
              onChange={handleToggleFreeShipping}
              disabled={saving}
            />
          </div>
        </div>

        {/* Zones de livraison */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-neutral font-vietnam">
              Zones de livraison
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="text-sm text-primary font-medium hover:text-[#00563e] transition-colors flex items-center gap-1 font-vietnam"
            >
              <Plus className="w-4 h-4" />
              Ajouter
            </button>
          </div>

          {zones.length === 0 ? (
            <div className="text-center py-6">
              <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400 font-vietnam">
                Aucune zone de livraison
              </p>
              <p className="text-xs text-gray-300 font-vietnam">
                Ajoutez votre première zone
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {zones.map((zone) => (
                <div
                  key={zone.id}
                  className={`p-3 rounded-lg border transition-all ${
                    zone.is_active 
                      ? "border-gray-200 bg-white" 
                      : "border-gray-100 bg-gray-50 opacity-60"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-neutral font-vietnam">
                          {zone.name}
                        </p>
                        {!zone.is_active && (
                          <span className="text-xs text-gray-400 font-vietnam">
                            Désactivé
                          </span>
                        )}
                      </div>
                      {zone.description && (
                        <p className="text-xs text-gray-500 font-vietnam">
                          {zone.description}
                        </p>
                      )}
                      <p className="text-sm font-semibold text-primary font-vietnam mt-1">
                        {zone.price.toLocaleString()} FCFA
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(zone)}
                        className="p-1.5 text-gray-400 hover:text-primary transition-colors"
                        title="Modifier"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleZone(zone.id, zone.is_active)}
                        className="p-1.5 text-gray-400 hover:text-primary transition-colors"
                        title={zone.is_active ? "Désactiver" : "Activer"}
                      >
                        {zone.is_active ? (
                          <ToggleRight className="w-5 h-5 text-primary" />
                        ) : (
                          <ToggleLeft className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteZone(zone.id)}
                        className="p-1.5 text-gray-400 hover:text-tertiary transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Note */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
          <p className="text-xs text-blue-700 font-vietnam">
            Les frais de livraison sont automatiquement ajoutés au panier du client en fonction de l'adresse de livraison sélectionnée.
          </p>
        </div>

        {/* Erreur/Succès */}
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

        {/* Bouton Enregistrer */}
        <button
          onClick={() => {
            setSuccess("Modifications enregistrées avec succès !");
            setTimeout(() => setSuccess(""), 3000);
          }}
          className="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:bg-[#00563e] transition-colors font-jakarta"
        >
          ENREGISTRER LES MODIFICATIONS
        </button>
      </div>

      {/* Modal Ajout zone */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-md rounded-t-2xl p-6 animate-slide-up">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-neutral font-jakarta">
                Ajouter une zone
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleAddZone}>
              {error && (
                <div className="mb-4 p-3 bg-red-50 text-tertiary rounded-lg text-sm font-vietnam">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral mb-1.5 font-vietnam">
                    Nom de la zone
                  </label>
                  <input
                    type="text"
                    value={newZone.name}
                    onChange={(e) => setNewZone({ ...newZone, name: e.target.value })}
                    placeholder="Ex: Lomé"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-vietnam text-neutral"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral mb-1.5 font-vietnam">
                    Description
                  </label>
                  <input
                    type="text"
                    value={newZone.description}
                    onChange={(e) => setNewZone({ ...newZone, description: e.target.value })}
                    placeholder="Ex: Capitale & environs"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-vietnam text-neutral"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral mb-1.5 font-vietnam">
                    Prix (FCFA)
                  </label>
                  <input
                    type="number"
                    value={newZone.price}
                    onChange={(e) => setNewZone({ ...newZone, price: e.target.value })}
                    placeholder="Ex: 1000"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-vietnam text-neutral"
                    required
                    min="0"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full mt-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-[#00563e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-jakarta"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Ajout en cours...
                  </>
                ) : (
                  "Ajouter la zone"
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Modification zone */}
      {showEditModal && editingZone && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-md rounded-t-2xl p-6 animate-slide-up">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-neutral font-jakarta">
                Modifier la zone
              </h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingZone(null);
                }}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleEditZone}>
              {error && (
                <div className="mb-4 p-3 bg-red-50 text-tertiary rounded-lg text-sm font-vietnam">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral mb-1.5 font-vietnam">
                    Nom de la zone
                  </label>
                  <input
                    type="text"
                    value={newZone.name}
                    onChange={(e) => setNewZone({ ...newZone, name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-vietnam text-neutral"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral mb-1.5 font-vietnam">
                    Description
                  </label>
                  <input
                    type="text"
                    value={newZone.description}
                    onChange={(e) => setNewZone({ ...newZone, description: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-vietnam text-neutral"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral mb-1.5 font-vietnam">
                    Prix (FCFA)
                  </label>
                  <input
                    type="number"
                    value={newZone.price}
                    onChange={(e) => setNewZone({ ...newZone, price: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-vietnam text-neutral"
                    required
                    min="0"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full mt-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-[#00563e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-jakarta"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Modification...
                  </>
                ) : (
                  "Modifier la zone"
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