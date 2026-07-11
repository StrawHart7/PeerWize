'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function NotFound() {
  const router = useRouter()
  const [floating, setFloating] = useState(false)

  useEffect(() => {
    setFloating(true)
  }, [])

  return (
    <div className="min-h-screen flex flex-col justify-center px-4 py-8" style={{ backgroundColor: '#1A1C1E' }}>

      <div className="flex items-center gap-2 mb-6">
        <div className="p-1.5 rounded" style={{ backgroundColor: '#2a2d30' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="1" y="1" width="6" height="6" rx="1" fill="#006A4E"/>
            <rect x="9" y="1" width="6" height="6" rx="1" fill="#006A4E"/>
            <rect x="1" y="9" width="6" height="6" rx="1" fill="#006A4E"/>
            <rect x="9" y="9" width="6" height="6" rx="1" fill="#FFCD00"/>
          </svg>
        </div>
        <span className="text-sm" style={{ color: '#9ca3af' }}>Page Introuvable (404)</span>
      </div>

      <div className="bg-white rounded-2xl px-6 py-12 flex flex-col items-center text-center">

        {/* Cercle avec point d'interrogation flottant */}
        <div className="relative flex items-center justify-center mb-8">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center"
            style={{ backgroundColor: '#f3f4f6' }}
          >
            <span
              className="text-4xl font-bold transition-all duration-1000"
              style={{
                color: '#d1d5db',
                transform: floating ? 'translateY(-8px)' : 'translateY(0px)',
                animation: 'float 2.5s ease-in-out infinite',
              }}
            >
              ?
            </span>
          </div>
          {/* Point jaune */}
          <div
            className="absolute top-1 right-1 w-3 h-3 rounded-full"
            style={{ backgroundColor: '#FFCD00' }}
          />
        </div>

        <p className="text-xs font-medium tracking-widest mb-3" style={{ color: '#d1d5db' }}>
          404
        </p>
        <h1
          className="text-xl font-bold mb-2"
          style={{ color: '#1A1C1E', fontFamily: 'var(--font-jakarta)' }}
        >
          Oups, page introuvable.
        </h1>
        <p className="text-sm text-gray-400 mb-8 leading-relaxed">
          Ce lien a peut-être expiré ou l'adresse a été saisie de manière incorrecte.
        </p>

        <button
          onClick={() => router.push('/')}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-white text-sm font-semibold mb-3"
          style={{ backgroundColor: '#006A4E' }}
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Retour à l'accueil
        </button>

        <button
          onClick={() => router.back()}
          className="w-full py-3 text-sm font-medium text-gray-500"
        >
          Revenir en arrière
          <span className="block text-xs text-gray-300 mt-0.5 tracking-widest">PEERWIZE MARKET</span>
        </button>

      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
      `}</style>

    </div>
  )
}