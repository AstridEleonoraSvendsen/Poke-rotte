"use client"

import Image from "next/image"
import { Heart } from "lucide-react"
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
  wishlist?: Set<string>
  onToggleOwned: (cardId: string) => void
  onToggleWishlist?: (cardId: string, e: React.MouseEvent) => void
}

export function BinderView({ cards, ownedCards, wishlist, onToggleOwned, onToggleWishlist }: BinderViewProps) {
  const CARDS_PER_SIDE = 24

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
                      wishlisted={wishlist?.has(card.id) ?? false}
                      onToggle={() => onToggleOwned(card.id)}
                      onToggleWishlist={onToggleWishlist ? (e) => onToggleWishlist(card.id, e) : undefined}
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
                        wishlisted={wishlist?.has(card.id) ?? false}
                        onToggle={() => onToggleOwned(card.id)}
                        onToggleWishlist={onToggleWishlist ? (e) => onToggleWishlist(card.id, e) : undefined}
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
  wishlisted: boolean
  onToggle: () => void
  onToggleWishlist?: (e: React.MouseEvent) => void
}

function BinderCard({ card, owned, wishlisted, onToggle, onToggleWishlist }: BinderCardProps) {
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
      {card.isReverseHolo && (
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent pointer-events-none" />
      )}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <p className="text-[9px] text-white font-medium truncate">{card.name}</p>
        <p className="text-[8px] text-white/70">#{card.number}</p>
      </div>
      <div className={cn(
        "absolute top-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-bold",
        owned ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
      )}>
        {owned ? "1/1" : "0/1"}
      </div>
      {onToggleWishlist && (
        <button
          onClick={onToggleWishlist}
          className={cn(
            "absolute top-1 left-1 p-1 rounded transition-all",
            wishlisted ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}
        >
          <Heart className={cn(
            "h-3 w-3 drop-shadow",
            wishlisted ? "fill-pink-500 text-pink-500" : "text-white"
          )} />
        </button>
      )}
    </button>
  )
}
