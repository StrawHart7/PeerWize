export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">

      {/* Logo */}
      <img
        src="/PeerWize.svg"
        alt="PeerWize"
        className="w-20 h-20 mb-4"
      />
      <h1
        className="text-2xl font-bold mb-16"
        style={{ color: '#1A1C1E', fontFamily: 'var(--font-jakarta)' }}
      >
        PeerWize
      </h1>

      {/* Barre de chargement en bas */}
      <div className="fixed bottom-0 left-0 right-0 h-1 bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            backgroundColor: '#006A4E',
            animation: 'progress 2s ease-in-out infinite',
          }}
        />
      </div>

      <style>{`
        @keyframes progress {
          0% { width: 0%; margin-left: 0%; }
          50% { width: 60%; margin-left: 20%; }
          100% { width: 0%; margin-left: 100%; }
        }
      `}</style>

    </div>
  )
}