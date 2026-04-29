import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import { SiteFooter } from "@/components/site-footer"
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Pokemon Rats - Our Personal Tracker',
  description: 'Track your Pokemon card collection, only for rats',
  generator: 'v0.app',
  // NEW: This tells Google and other search engines to go away!
  robots: {
    index: false,
    follow: false,
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        
       {/* --- SMART CURSOR INJECTION --- */}
        <script dangerouslySetInnerHTML={{
          __html: `
            try {
              if (localStorage.getItem('ratCursor') !== 'boring') {
                document.documentElement.classList.add('fun-cursor');
              }
            } catch (e) {}
          `
        }} />
        {/* ------------------------------------ */}

        {/* Wrapper to push footer to the bottom */}
        <div className="flex min-h-screen flex-col">
          <main className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </div>

        <Toaster position="top-center" richColors />
        <Analytics />
      </body>
    </html>
  )
}
