export default function ProcessingPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center px-4 py-8 bg-white">

      <div className="flex flex-col items-center text-center">

        {/* Logo */}
        <h2
          className="text-lg font-bold mb-10"
          style={{ color: '#1A1C1E', fontFamily: 'var(--font-jakarta)' }}
        >
          PeerWize
        </h2>

        {/* Spinner */}
        <div className="relative w-20 h-20 mb-8">
          <svg
            className="w-20 h-20"
            viewBox="0 0 80 80"
            fill="none"
            style={{ animation: 'spin 1.2s linear infinite' }}
          >
            <circle cx="40" cy="40" r="34" stroke="#e5e7eb" strokeWidth="6"/>
            <path
              d="M40 6 a34 34 0 0 1 34 34"
              stroke="#006A4E"
              strokeWidth="6"
              strokeLinecap="round"
            />
          </svg>
          {/* Icône bouclier au centre */}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#006A4E" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
        </div>

        <p className="text-base font-medium mb-2" style={{ color: '#1A1C1E' }}>
          Paiement en cours de vérification…
        </p>
        <p className="text-sm leading-relaxed">
          <span style={{ color: '#D21034' }}>Ne fermez pas cette page.</span>
          {' '}
          <span style={{ color: '#006A4E' }}>Nous sécurisons votre transaction.</span>
        </p>

        <p className="text-xs text-gray-400 mt-10">
          🔒 Certifié sécurisé par <span className="font-medium" style={{ color: '#006A4E' }}>PeerWize Pay</span>
        </p>

      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

    </div>
  )
}