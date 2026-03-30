"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { ChevronRight } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

interface PokemonSet {
  id: string
  name: string
  series: string
  printedTotal: number
  total: number
  releaseDate: string
  images: {
    symbol: string
    logo: string
  }
}

// Define series order (newest to oldest)
const SERIES_ORDER = [
  "Scarlet & Violet",
  "Sword & Shield",
  "Sun & Moon",
  "XY",
  "Black & White",
  "HeartGold & SoulSilver",
  "Platinum",
  "Diamond & Pearl",
  "EX",
  "e-Card",
  "Neo",
  "Gym",
  "Base",
  "Other",
]

export function SetBrowser() {
  const [seriesGroups, setSeriesGroups] = useState<Record<string, PokemonSet[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedSeries, setExpandedSeries] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSets() {
      try {
        const response = await fetch("/api/pokemon/sets")
        if (!response.ok) throw new Error("Failed to fetch sets")
        const data = await response.json()
        setSeriesGroups(data.seriesGroups)
        // Auto-expand first series
        const firstSeries = SERIES_ORDER.find(s => data.seriesGroups[s])
        if (firstSeries) setExpandedSeries(firstSeries)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }
    fetchSets()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="h-8 w-8" />
          <p className="text-muted-foreground">Loading sets from Pokemon TCG...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  // Sort series by our defined order
  const sortedSeries = Object.keys(seriesGroups).sort((a, b) => {
    const aIndex = SERIES_ORDER.indexOf(a)
    const bIndex = SERIES_ORDER.indexOf(b)
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b)
    if (aIndex === -1) return 1
    if (bIndex === -1) return -1
    return aIndex - bIndex
  })

  return (
    <div className="space-y-2">
      {sortedSeries.map((series) => {
        const sets = seriesGroups[series]
        return (
          <div key={series} className="rounded-lg border bg-card overflow-hidden">
            <button
              onClick={() => setExpandedSeries(expandedSeries === series ? null : series)}
              className="flex w-full items-center justify-between p-4 text-left hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="font-semibold">{series}</span>
                <span className="text-sm text-muted-foreground">
                  {sets.length} sets
                </span>
              </div>
              <ChevronRight
                className={cn(
                  "h-5 w-5 text-muted-foreground transition-transform",
                  expandedSeries === series && "rotate-90"
                )}
              />
            </button>
            
            {expandedSeries === series && (
              <div className="border-t px-4 py-3 space-y-1">
                {sets.map((set) => (
                  <Link
                    key={set.id}
                    href={`/database/${set.id}`}
                    className="flex items-center gap-4 rounded-md p-3 hover:bg-secondary/50 transition-colors"
                  >
                    {/* Set Symbol */}
                    {set.images?.symbol && (
                      <div className="relative h-8 w-8 flex-shrink-0">
                        <Image
                          src={set.images.symbol}
                          alt=""
                          fill
                          className="object-contain"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{set.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {set.total || set.printedTotal} cards
                      </p>
                    </div>
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatDate(set.releaseDate)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" })
  } catch {
    return dateString
  }
}
