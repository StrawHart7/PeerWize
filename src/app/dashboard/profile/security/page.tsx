// src/app/dashboard/profile/security/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/src/lib/supabase/client";
import { 
  ArrowLeft, 
  Key, 
  Shield, 
  Smartphone, 
  LogOut, 
  Trash2,
  Loader2,
  AlertTriangle,
  Lock,
  Check
} from "lucide-react";

// ── Détection de l'appareil ──────────────────────────────────────────────
function getDeviceInfo() {
  const userAgent = navigator.userAgent;
  let device = "Appareil inconnu";
  let browser = "";
  let os = "";

  // Détection du navigateur
  if (userAgent.indexOf("Chrome") > -1) browser = "Chrome";
  else if (userAgent.indexOf("Safari") > -1) browser = "Safari";
  else if (userAgent.indexOf("Firefox") > -1) browser = "Firefox";
  else if (userAgent.indexOf("Edge") > -1) browser = "Edge";
  else if (userAgent.indexOf("Opera") > -1) browser = "Opera";

  // Détection du système d'exploitation
  if (userAgent.indexOf("Windows") > -1) os = "Windows";
  else if (userAgent.indexOf("Mac OS") > -1) os = "macOS";
  else if (userAgent.indexOf("Linux") > -1) os = "Linux";
  else if (userAgent.indexOf("Android") > -1) os = "Android";
  else if (userAgent.indexOf("iPhone") > -1) os = "iOS";
  else if (userAgent.indexOf("iPad") > -1) os = "iPadOS";

  // Détection du type d'appareil
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent)) {
    device = "Tablette";
  } else if (/Mobile|Android|iPhone|iPod|BlackBerry|Opera Mini|IEMobile/i.test(userAgent)) {
    device = "Smartphone";
  } else {
    device = "Ordinateur";
  }

  // Version simplifiée pour l'affichage
  let display = device;
  if (browser) display += ` • ${browser}`;
  if (os) display += ` • ${os}`;

  return display;
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
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 ${
        enabled ? "bg-[var(--color-primary)]" : "bg-gray-300"
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

export default function SecurityPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState("");
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Détecter l'appareil au chargement
  useEffect(() => {
    setDeviceInfo(getDeviceInfo());
  }, []);

  // Changer le mot de passe
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (error) throw error;

      setSuccess("Mot de passe mis à jour avec succès !");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setTimeout(() => setShowPasswordModal(false), 2000);
    } catch (err: any) {
      console.error("Erreur changement mot de passe:", err);
      setError(err.message || "Impossible de changer le mot de passe");
    } finally {
      setLoading(false);
    }
  };

  // Supprimer le compte
  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non trouvé");

      const { error: deleteSellerError } = await supabase
        .from("sellers")
        .delete()
        .eq("id", user.id);

      if (deleteSellerError) throw deleteSellerError;

      await supabase.auth.signOut();
      router.push("/login");
    } catch (err) {
      console.error("Erreur suppression compte:", err);
      setError("Impossible de supprimer le compte. Contactez le support.");
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
    }
  };

  // Déconnexion de tous les appareils
  const handleLogoutAll = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut({ scope: "global" });
      if (error) throw error;
      router.push("/login");
    } catch (err) {
      console.error("Erreur déconnexion:", err);
      setError("Impossible de se déconnecter de tous les appareils");
    } finally {
      setLoading(false);
      setShowLogoutModal(false);
    }
  };

  // Toggle 2FA
  const handleToggle2FA = () => {
    setTwoFactorEnabled(!twoFactorEnabled);
    // TODO: Intégrer avec Supabase quand la feature sera disponible
    // Pour l'instant, c'est juste un toggle UI
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
            <ArrowLeft className="w-5 h-5 text-[var(--color-neutral)]" />
          </button>
          <h1 className="text-xl font-semibold text-[var(--color-neutral)] font-jakarta">
            Connexion et Sécurité
          </h1>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Description */}
        <p className="text-sm text-gray-600 mb-6 font-vietnam">
          Protégez votre compte PeerWize avec des outils de sécurité avancés.
        </p>

        {/* MOT DE PASSE */}
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 font-vietnam">
            MOT DE PASSE
          </h2>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <button
              onClick={() => setShowPasswordModal(true)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Key className="w-5 h-5 text-[var(--color-primary)]" />
                <span className="text-sm font-medium text-[var(--color-neutral)] font-vietnam">
                  Changer le mot de passe
                </span>
              </div>
              <span className="text-sm text-gray-400">→</span>
            </button>
          </div>
        </div>

        {/* SÉCURITÉ RENFORCÉE */}
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 font-vietnam">
            SÉCURITÉ RENFORCÉE
          </h2>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-[var(--color-primary)] mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-[var(--color-neutral)] font-vietnam">
                      Authentification à deux facteurs
                    </p>
                    <ToggleSwitch
                      enabled={twoFactorEnabled}
                      onChange={handleToggle2FA}
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1 font-vietnam leading-relaxed">
                    Ajoute une couche de sécurité supplémentaire via SMS ou WhatsApp pour confirmer les connexions importantes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SESSIONS ACTIVES */}
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 font-vietnam">
            SESSIONS ACTIVES
          </h2>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-[var(--color-primary)]" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-[var(--color-neutral)] font-vietnam">
                    {deviceInfo}
                  </p>
                  <p className="text-xs text-green-600 font-vietnam">
                    Session actuelle
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowLogoutModal(true)}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm text-[var(--color-tertiary)] font-medium hover:bg-red-50 transition-colors font-vietnam disabled:opacity-50"
            >
              <LogOut className="w-4 h-4" />
              Se déconnecter de tous les appareils
            </button>
          </div>
        </div>

        {/* Image de sécurité - Avant suppression */}
        <div className="mb-6">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <Image
              src="/Security_2.png"
              alt="Sécurité PeerWize"
              width={400}
              height={200}
              className="w-full h-auto"
            />
          </div>
        </div>

        {/* Séparation avec trait */}
        <hr className="my-6 border-gray-200" />

        {/* Supprimer mon compte */}
        <button
          onClick={() => setShowDeleteModal(true)}
          className="w-full flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm hover:bg-gray-50 transition-colors"
        >
          <Lock className="w-5 h-5 text-tertiary" />
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-[var(--color-tertiary)] font-vietnam">
              Supprimer mon compte
            </p>
            <p className="text-xs text-gray-500 font-vietnam">
              Cette action est irréversible et supprimera toutes vos données de vente et d'inventaire.
            </p>
          </div>
          <span className="text-sm text-gray-400">→</span>
        </button>
      </div>

      {/* Modal changement mot de passe */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-md rounded-t-2xl p-6 animate-slide-up">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-[var(--color-neutral)] font-jakarta">
                Changer le mot de passe
              </h2>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePasswordChange}>
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

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-neutral)] mb-1.5 font-vietnam">
                    Mot de passe actuel
                  </label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        currentPassword: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent font-vietnam"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-neutral)] mb-1.5 font-vietnam">
                    Nouveau mot de passe
                  </label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        newPassword: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent font-vietnam"
                    required
                    minLength={6}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-neutral)] mb-1.5 font-vietnam">
                    Confirmer le nouveau mot de passe
                  </label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent font-vietnam"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-6 py-3 bg-[var(--color-primary)] text-white font-semibold rounded-lg hover:bg-[#00563e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-jakarta"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Mise à jour...
                  </>
                ) : (
                  "Mettre à jour le mot de passe"
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal confirmation déconnexion tous appareils */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-md rounded-t-2xl p-6 animate-slide-up">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-[var(--color-neutral)] font-jakarta">
                Déconnexion de tous les appareils
              </h2>
              <button
                onClick={() => setShowLogoutModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="mb-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-800 font-vietnam">
                  ⚠️ Vous allez être déconnecté de tous vos appareils.
                </p>
              </div>
              <p className="text-sm text-gray-600 font-vietnam">
                Vous devrez vous reconnecter sur tous vos appareils après cette action.
                Êtes-vous sûr de vouloir continuer ?
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors font-jakarta"
              >
                Annuler
              </button>
              <button
                onClick={handleLogoutAll}
                disabled={loading}
                className="flex-1 py-3 bg-[var(--color-tertiary)] text-white font-semibold rounded-lg hover:bg-[#b00e2c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-jakarta"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Déconnexion...
                  </>
                ) : (
                  "Déconnecter tous"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal suppression compte */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-md rounded-t-2xl p-6 animate-slide-up">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-[var(--color-tertiary)] font-jakarta">
                Supprimer le compte
              </h2>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="mb-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-red-800 font-vietnam">
                  ⚠️ Cette action est irréversible et supprimera toutes vos
                  données de vente et d'inventaire.
                </p>
              </div>
              <p className="text-sm text-gray-600 font-vietnam">
                Êtes-vous sûr de vouloir supprimer votre compte PeerWize ?
                Toutes vos données seront définitivement perdues.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors font-jakarta"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={loading}
                className="flex-1 py-3 bg-[var(--color-tertiary)] text-white font-semibold rounded-lg hover:bg-[#b00e2c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-jakarta"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Suppression...
                  </>
                ) : (
                  "Supprimer définitivement"
                )}
              </button>
            </div>
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