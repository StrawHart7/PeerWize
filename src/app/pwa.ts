// src/app/pwa.ts
"use client";

export function registerSW() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("Service Worker enregistré avec succès:", registration);
        })
        .catch((error) => {
          console.log("Erreur d'enregistrement du Service Worker:", error);
        });
    });
  }
}