"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface SetData {
  id: string
  name: string
  totalCards: number
  releaseDate: string
}

interface EraData {
  name: string
  sets: SetData[]
}

const ERAS: EraData[] = [
  {
    name: "Scarlet & Violet",
    sets: [
      { id: "sv-prismatic", name: "Prismatic Evolutions", totalCards: 258, releaseDate: "Jan 2025" },
      { id: "sv-surging", name: "Surging Sparks", totalCards: 253, releaseDate: "Nov 2024" },
      { id: "sv-stellar", name: "Stellar Crown", totalCards: 175, releaseDate: "Sep 2024" },
      { id: "sv-twilight", name: "Twilight Masquerade", totalCards: 226, releaseDate: "May 2024" },
      { id: "sv-temporal", name: "Temporal Forces", totalCards: 218, releaseDate: "Mar 2024" },
      { id: "sv-paldean", name: "Paldean Fates", totalCards: 245, releaseDate: "Jan 2024" },
    ],
  },
  {
    name: "Sword & Shield",
    sets: [
      { id: "swsh-crown", name: "Crown Zenith", totalCards: 230, releaseDate: "Jan 2023" },
      { id: "swsh-silver", name: "Silver Tempest", totalCards: 245, releaseDate: "Nov 2022" },
      { id: "swsh-lost", name: "Lost Origin", totalCards: 247, releaseDate: "Sep 2022" },
      { id: "swsh-astral", name: "Astral Radiance", totalCards: 246, releaseDate: "May 2022" },
      { id: "swsh-brilliant", name: "Brilliant Stars", totalCards: 216, releaseDate: "Feb 2022" },
    ],
  },
  {
    name: "Sun & Moon",
    sets: [
      { id: "sm-cosmic", name: "Cosmic Eclipse", totalCards: 271, releaseDate: "Nov 2019" },
      { id: "sm-hidden", name: "Hidden Fates", totalCards: 163, releaseDate: "Aug 2019" },
      { id: "sm-unified", name: "Unified Minds", totalCards: 258, releaseDate: "Aug 2019" },
      { id: "sm-unbroken", name: "Unbroken Bonds", totalCards: 234, releaseDate: "May 2019" },
    ],
  },
  {
    name: "XY",
    sets: [
      { id: "xy-evolutions", name: "Evolutions", totalCards: 113, releaseDate: "Nov 2016" },
      { id: "xy-steam", name: "Steam Siege", totalCards: 116, releaseDate: "Aug 2016" },
      { id: "xy-fates", name: "Fates Collide", totalCards: 129, releaseDate: "May 2016" },
      { id: "xy-breakpoint", name: "BREAKpoint", totalCards: 123, releaseDate: "Feb 2016" },
      { id: "xy5", name: "Primal Clash", totalCards: 164, releaseDate: "Feb 2015" },
    ],
  },
  {
    name: "Base Sets",
    sets: [
      { id: "base-set", name: "Base Set", totalCards: 102, releaseDate: "Jan 1999" },
      { id: "jungle", name: "Jungle", totalCards: 64, releaseDate: "Jun 1999" },
      { id: "fossil", name: "Fossil", totalCards: 62, releaseDate: "Oct 1999" },
      { id: "team-rocket", name: "Team Rocket", totalCards: 83, releaseDate: "Apr 2000" },
    ],
  },
]

export function SetBrowser() {
  const [expandedEra, setExpandedEra] = useState<string | null>("Scarlet & Violet")

  return (
    <div className="space-y-2">
      {ERAS.map((era) => (
        <div key={era.name} className="rounded-lg border bg-card overflow-hidden">
          <button
            onClick={() => setExpandedEra(expandedEra === era.name ? null : era.name)}
            className="flex w-full items-center justify-between p-4 text-left hover:bg-secondary/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="font-semibold">{era.name}</span>
              <span className="text-sm text-muted-foreground">
                {era.sets.length} sets
              </span>
            </div>
            <ChevronRight
              className={cn(
                "h-5 w-5 text-muted-foreground transition-transform",
                expandedEra === era.name && "rotate-90"
              )}
            />
          </button>
          
          {expandedEra === era.name && (
            <div className="border-t px-4 py-3 space-y-2">
              {era.sets.map((set) => (
                <Link
                  key={set.id}
                  href={`/database/${set.id}`}
                  className="flex items-center justify-between rounded-md p-3 hover:bg-secondary/50 transition-colors"
                >
                  <div>
                    <p className="font-medium">{set.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {set.totalCards} cards
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {set.releaseDate}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
