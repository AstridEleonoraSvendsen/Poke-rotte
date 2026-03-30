"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"

interface Card {
  id: string
  name: string
  number: string
  rarity: string
  variant: "standard" | "reverse_holo"
  isReverseHolo: boolean
  images: {
    small: string
    large: string
  }
}

interface BinderViewProps {
  cards: Card[]
  ownedCards: Set<string>
  onToggleOwned: (cardId: string) => void
}

export function BinderView({ cards, ownedCards, onToggleOwned }: BinderViewProps) {
  // 9-pocket pages: 3 columns x 3 rows = 9 cards per page
  // Each "side" shows 2 pages (left and right), so 18 cards per side
  // But masterset.dk shows 12 per side (3x4), let's follow that
  const CARDS_PER_PAGE = 12 // 3 columns x 4 rows
  const PAGES_PER_SIDE = 1

  // Group cards into sides (each side = 2 pages of 12 cards each = 24 cards, but screenshot shows 12 per visual section)
  // Looking at the screenshot more closely: each "SIDE" has two 3x4 grids side by side
  const CARDS_PER_SIDE = 24 // 12 cards x 2 pages shown side by side
  
  const sides: Card[][] = []
  for (let i = 0; i < cards.length; i += CARDS_PER_SIDE) {
    sides.push(cards.slice(i, i + CARDS_PER_SIDE))
  }

  return (
    <div className="space-y-6">
      {sides.map((sideCards, sideIndex) => {
        const leftPage = sideCards.slice(0, 12)
        const rightPage = sideCards.slice(12, 24)
        
        return (
          <div key={sideIndex} className="rounded-lg border bg-card p-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Page */}
              <div className="rounded-lg border border-border/50 bg-background/50 p-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-accent">SIDE {sideIndex * 2 + 1}</span>
                  <span className="text-sm text-muted-foreground">{leftPage.length} cards</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {leftPage.map((card) => (
                    <BinderCard
                      key={card.id}
                      card={card}
                      owned={ownedCards.has(card.id)}
                      onToggle={() => onToggleOwned(card.id)}
                    />
                  ))}
                </div>
              </div>

              {/* Right Page */}
              {rightPage.length > 0 && (
                <div className="rounded-lg border border-border/50 bg-background/50 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-accent">SIDE {sideIndex * 2 + 2}</span>
                    <span className="text-sm text-muted-foreground">{rightPage.length} cards</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {rightPage.map((card) => (
                      <BinderCard
                        key={card.id}
                        card={card}
                        owned={ownedCards.has(card.id)}
                        onToggle={() => onToggleOwned(card.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

interface BinderCardProps {
  card: Card
  owned: boolean
  onToggle: () => void
}

function BinderCard({ card, owned, onToggle }: BinderCardProps) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "group relative aspect-[2.5/3.5] rounded-md overflow-hidden transition-all",
        "hover:scale-105 hover:z-10 hover:shadow-lg",
        !owned && "opacity-50 grayscale"
      )}
    >
      <Image
        src={card.images.small}
        alt={card.name}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 30vw, 150px"
      />
      {/* Reverse Holo indicator */}
      {card.isReverseHolo && (
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent pointer-events-none" />
      )}
      {/* Card name tooltip on hover */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <p className="text-[9px] text-white font-medium truncate">{card.name}</p>
        <p className="text-[8px] text-white/70">#{card.number}</p>
      </div>
      {/* Ownership badge */}
      <div className={cn(
        "absolute top-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-bold",
        owned ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
      )}>
        {owned ? "1/1" : "0/1"}
      </div>
    </button>
  )
}
