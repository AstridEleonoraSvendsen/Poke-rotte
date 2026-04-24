"use client"

import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface MasterSetCardProps {
  id: string
  name: string
  series: string
  totalCards: number
  ownedCards: number
  releaseDate: string
  logoUrl?: string
  // NEW: Accept value and currency from the dashboard
  value?: number 
  displayCurrency?: "EUR" | "DKK"
}

export function MasterSetCard({
  id,
  name,
  series,
  totalCards,
  ownedCards,
  releaseDate,
  logoUrl,
  value = 0,
  displayCurrency = "EUR"
}: MasterSetCardProps) {
  const progress = Math.round((ownedCards / totalCards) * 100)
  const missing = totalCards - ownedCards
  
  const currencySymbol = displayCurrency === "EUR" ? "€" : "kr "
  const formattedValue = value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  
  return (
    <Link href={`/sets/${id}`}>
      <Card className="group overflow-hidden transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
        <CardContent className="p-0">
          {/* Header with set info */}
          <div className="p-4 border-b border-border/50">
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <div className="relative h-10 w-10 flex-shrink-0">
                  <Image src={logoUrl} alt="" fill className="object-contain" />
                </div>
              ) : (
                <div className="h-10 w-10 flex-shrink-0 rounded bg-secondary flex items-center justify-center">
                  <span className="text-xs font-bold text-muted-foreground">
                    {name.charAt(0)}
                  </span>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <span className="inline-block px-1.5 py-0.5 text-[10px] font-medium bg-secondary rounded mb-0.5">
                  Pokemon
                </span>
                <h3 className="font-bold text-sm leading-tight truncate">{name}</h3>
                <p className="text-xs text-muted-foreground truncate">{series}</p>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="px-4 py-3 flex items-center justify-between gap-2">
            <div className="text-center">
              <p className="text-xl font-bold">{ownedCards}</p>
              <p className="text-[10px] text-muted-foreground">Owned</p>
            </div>
            
            <div className="text-center">
              <p className="text-xl font-bold">{totalCards}</p>
              <p className="text-[10px] text-muted-foreground">Total</p>
            </div>
            
            {/* NEW VALUE BLOCK */}
            <div className="text-center">
              <p className="text-xl font-bold text-primary">
                {currencySymbol}{formattedValue}
              </p>
              <p className="text-[10px] text-muted-foreground">Value</p>
            </div>

            <div className="text-center">
              <p className="text-xl font-bold">{progress}%</p>
              <p className="text-[10px] text-muted-foreground">Complete</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="px-4 pb-3">
            <Progress value={progress} className="h-1.5" />
          </div>

          {/* Footer */}
          <div className="px-4 py-2 bg-secondary/30 flex items-center justify-between text-xs text-muted-foreground">
            <span>{releaseDate}</span>
            <span>{missing} missing</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
