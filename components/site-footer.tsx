"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

export function SiteFooter() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <footer className="w-full border-t border-border mt-auto py-6 bg-background/50">
      <div className="container mx-auto px-4 flex flex-col items-center gap-4 text-center">
        
        {/* The clickable policy link */}
        <button 
          onClick={() => setIsOpen(true)} 
          className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
        >
          Privacy & Cookie Policy
        </button>

        {/* The required Pokémon IP Disclaimer - Now in grey cursive/italic! */}
        <p className="text-[10px] italic text-muted-foreground/60 max-w-2xl leading-relaxed">
          "This site is not affiliated with, endorsed by, or connected to The Pokémon Company. Pokémon and all related names are trademarks of Nintendo/Creatures Inc./GAME FREAK inc."
        </p>
      </div>

      {/* The Pop-up Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-left">
          <div className="bg-card border rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
            
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-bold">Privacy & Cookie Policy</h2>
              <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4 text-sm text-muted-foreground">
              <section>
                <h3 className="font-semibold text-foreground mb-1">1. Minimal Scope</h3>
                <p>This website is a personal hobby project. We do not have user accounts, we do not sell products, and we do not collect personal data for marketing purposes.</p>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-1">2. Cookies</h3>
                <p>We do not use tracking, advertising, or analytical cookies. Our hosting provider may set <strong>strictly necessary technical cookies</strong> required for the site to function securely. Because these are strictly necessary, a cookie consent banner is not required.</p>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-1">3. Hosting & Data Processing</h3>
                <p>This site is hosted on Vercel. When you visit, Vercel's global edge network may temporarily process basic technical data (such as your IP address) to route your connection securely. This data may flow through US infrastructure.</p>
                <p className="mt-2">We have signed Vercel's Data Processing Addendum (DPA), which relies on EU Standard Contractual Clauses (SCCs) to ensure this technical routing complies with GDPR Chapter V.</p>
              </section>
            </div>

            <div className="p-4 border-t bg-muted/30 flex justify-end">
              <Button onClick={() => setIsOpen(false)}>Close</Button>
            </div>

          </div>
        </div>
      )}
    </footer>
  )
}
