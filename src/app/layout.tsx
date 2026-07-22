import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Be_Vietnam_Pro } from 'next/font/google'
import './globals.css'
import { PWAProvider } from '../components/PWAProvider'
import { ToastProvider } from '../components/ToastProvider'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
})

const vietnam = Be_Vietnam_Pro({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-vietnam',
})

export const metadata: Metadata = {
  title: 'PeerWize',
  description: 'Vendez en ligne, encaissez facilement.',
  manifest: '/site.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'PeerWize',
  },
  icons: {
    icon: [
      { url: '/assets/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/assets/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/assets/apple-touch-icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={`${jakarta.variable} ${vietnam.variable}`}>
      <head>
        <meta name="theme-color" content="#006A4E" />
      </head>
      <body>
        <ToastProvider>
          <PWAProvider>{children}</PWAProvider>
        </ToastProvider>
      </body>
    </html>
  )
}