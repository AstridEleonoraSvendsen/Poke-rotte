"use client"

import { Progress } from "@/components/ui/progress"

interface Card {
  id: string
  rarity: string
}

interface RarityBreakdownProps {
  cards: Card[]
  ownedCards: Set<string>
}

const RARITY_ORDER = [
  "Common",
  "Uncommon", 
  "Rare",
  "Rare Holo",
  "Double Rare",
  "Illustration Rare",
  "Special Illustration Rare",
  "Ultra Rare",
  "Rare Ultra",
  "Rare Holo EX",
  "Rare Holo GX",
  "Rare Holo V",
  "Rare Holo VMAX",
  "Rare Holo VSTAR",
  "Rare Secret",
  "Rare Rainbow",
  "Rare Shiny",
  "ACE SPEC Rare",
  "Hyper Rare",
  "Shiny Rare",
  "Shiny Ultra Rare",
  "Promo",
]

export function RarityBreakdown({ cards, ownedCards }: RarityBreakdownProps) {
  // Group cards by rarity
  const rarityGroups = cards.reduce((acc, card) => {
    const rarity = card.rarity || "Unknown"
    if (!acc[rarity]) {
      acc[rarity] = { total: 0, owned: 0 }
    }
    acc[rarity].total++
    if (ownedCards.has(card.id)) {
      acc[rarity].owned++
    }
    return acc
  }, {} as Record<string, { total: number; owned: number }>)

  // Sort rarities by predefined order
  const sortedRarities = Object.entries(rarityGroups).sort((a, b) => {
    const aIndex = RARITY_ORDER.indexOf(a[0])
    const bIndex = RARITY_ORDER.indexOf(b[0])
    if (aIndex === -1 && bIndex === -1) return a[0].localeCompare(b[0])
    if (aIndex === -1) return 1
    if (bIndex === -1) return -1
    return aIndex - bIndex
  })

  return (
    <div className="rounded-lg border bg-card p-6">
      <h3 className="text-lg font-semibold mb-4">Rarity Breakdown</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {sortedRarities.map(([rarity, { total, owned }]) => {
          const percentage = total > 0 ? Math.round((owned / total) * 100) : 0
          return (
            <div key={rarity} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{rarity}</span>
              </div>
              <p className="text-xl font-bold">
                {owned}/{total}
              </p>
              <Progress value={percentage} className="h-1.5" />
            </div>
          )
        })}
      </div>
    </div>
  )
}
