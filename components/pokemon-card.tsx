"use client"

import { useState } from "react"
import { Check, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface PokemonCardProps {
  id: string
  name: string
  number: string
  rarity: string
  imageUrl?: string
  owned?: boolean
  onToggleOwned?: (id: string) => void
}

export function PokemonCard({
  id,
  name,
  number,
  rarity,
  owned = false,
  onToggleOwned,
}: PokemonCardProps) {
  const [isOwned, setIsOwned] = useState(owned)

  const handleClick = () => {
    setIsOwned(!isOwned)
    onToggleOwned?.(id)
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case "common":
        return "bg-muted-foreground"
      case "uncommon":
        return "bg-green-500"
      case "rare":
        return "bg-blue-500"
      case "rare holo":
        return "bg-cyan-400"
      case "rare ultra":
        return "bg-yellow-500"
      case "secret rare":
        return "bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500"
      default:
        return "bg-muted-foreground"
    }
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        "group relative flex flex-col rounded-lg border bg-card p-2 text-left transition-all",
        "hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5",
        isOwned && "border-primary/50 bg-primary/5"
      )}
    >
      <div className="relative aspect-[2.5/3.5] w-full overflow-hidden rounded bg-secondary/50 flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10" />
        <div className="text-center p-2">
          <p className="text-xs text-muted-foreground">#{number}</p>
          <p className="text-sm font-medium leading-tight mt-1">{name}</p>
        </div>
        
        {/* Owned indicator overlay */}
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center bg-background/80 transition-opacity",
            isOwned ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}
        >
          {isOwned ? (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Check className="h-5 w-5" />
            </div>
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
              <X className="h-5 w-5" />
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="truncate text-xs font-medium">{name}</span>
        <span
          className={cn(
            "h-2 w-2 shrink-0 rounded-full",
            getRarityColor(rarity)
          )}
          title={rarity}
        />
      </div>
    </button>
  )
}
