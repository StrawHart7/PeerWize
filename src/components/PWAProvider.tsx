// src/components/PWAProvider.tsx
"use client";

import { useEffect, useState, createContext, useContext } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

interface PWAContextType {
  isInstalled: boolean;
  deferredPrompt: BeforeInstallPromptEvent | null;
  showInstallBanner: boolean;
  setShowInstallBanner: (show: boolean) => void;
  handleInstall: () => Promise<void>;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

export function usePWA() {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error("usePWA must be used within a PWAProvider");
  }
  return context;
}

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("Service Worker enregistré avec succès:", registration);
        })
        .catch((error) => {
          console.log("Erreur d'enregistrement du Service Worker:", error);
        });
    }

    const checkInstallState = () => {
      if (window.matchMedia("(display-mode: standalone)").matches) {
        setIsInstalled(true);
        return true;
      }
      return false;
    };

    const isStandalone = checkInstallState();

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      console.log("📱 beforeinstallprompt déclenché !");
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (!isStandalone && !isInstalled) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      console.log("✅ Application installée !");
      setIsInstalled(true);
      setShowInstallBanner(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsInstalled(true);
        setShowInstallBanner(false);
      }
    };

    mediaQuery.addEventListener("change", handleDisplayModeChange);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      mediaQuery.removeEventListener("change", handleDisplayModeChange);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      console.log("❌ Aucun prompt d'installation disponible");
      return;
    }
    
    console.log("🔄 Déclenchement de l'installation...");
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    
    if (result.outcome === "accepted") {
      console.log("✅ Installation acceptée !");
      setIsInstalled(true);
      setShowInstallBanner(false);
    } else {
      console.log("❌ Installation refusée");
    }
    setDeferredPrompt(null);
  };

  const value = {
    isInstalled,
    deferredPrompt,
    showInstallBanner,
    setShowInstallBanner,
    handleInstall,
  };

  return (
    <PWAContext.Provider value={value}>
      {children}
      {showInstallBanner && !isInstalled && (
        <div className="fixed bottom-20 left-4 right-4 z-50 bg-white rounded-xl shadow-xl p-4 border border-gray-200 animate-slide-up">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-[#006A4E] rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xl font-bold">P</span>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-[#1A1C1E]">
                Installez PeerWize
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Ajoutez l&apos;application à votre écran d&apos;accueil pour y accéder plus rapidement.
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleInstall}
                  className="flex-1 py-2 bg-[#006A4E] text-white text-sm font-semibold rounded-lg hover:bg-[#00563e] transition-colors"
                >
                  Installer
                </button>
                <button
                  onClick={() => setShowInstallBanner(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-600 text-sm font-semibold rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Plus tard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </PWAContext.Provider>
  );
}