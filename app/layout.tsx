import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'PokeCollect - Pokemon Card Collection Tracker',
  description: 'Track your Pokemon card collection, create master sets, and browse the complete card database',
  generator: 'v0.app',
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
        
        {/* --- THE POKEAPI TEST INJECTION --- */}
        <style dangerouslySetInnerHTML={{
          __html: `
            html, body, * { 
              cursor: url('https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png') 15 15, auto !important; 
            }
            a, button, [role="button"], input, select, textarea, .cursor-pointer, a *, button * { 
              cursor: url('https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/master-ball.png') 15 15, pointer !important; 
            }
          `
        }} />
        {/* ------------------------------------ */}

        {children}
        <Analytics />
      </body>
    </html>
  )
}
