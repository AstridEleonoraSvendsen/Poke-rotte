"use client"

import Link from "next/link"
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
}

export function MasterSetCard({
  id,
  name,
  series,
  totalCards,
  ownedCards,
  releaseDate,
}: MasterSetCardProps) {
  const progress = Math.round((ownedCards / totalCards) * 100)
  
  return (
    <Link href={`/sets/${id}`}>
      <Card className="group overflow-hidden transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
        <CardContent className="p-0">
          <div className="relative aspect-[16/10] bg-secondary/50 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="text-center p-4">
              <p className="text-xs text-muted-foreground mb-1">{series}</p>
              <h3 className="font-bold text-lg leading-tight">{name}</h3>
            </div>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{releaseDate}</span>
              <span className="font-medium text-primary">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">
                {ownedCards} / {totalCards}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
