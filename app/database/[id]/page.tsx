"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import Image from "next/image"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { ArrowLeft, Search, Plus, Grid3X3, List } from "lucide-react"
import { cn } from "@/lib/utils"

interface PokemonCard {
  id: string
  name: string
  number: string
  rarity: string
  images: {
    small: string
    large: string
  }
  types?: string[]
}

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

function getRarityColor(rarity: string) {
  const r = rarity?.toLowerCase() || ""
  if (r.includes("secret") || r.includes("hyper")) return "bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500"
  if (r.includes("ultra") || r.includes("illustration")) return "bg-yellow-500"
  if (r.includes("holo") || r.includes("rare")) return "bg-cyan-400"
  if (r.includes("uncommon")) return "bg-green-500"
  return "bg-muted-foreground"
}

export default function DatabaseSetPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [set, setSet] = useState<PokemonSet | null>(null)
  const [cards, setCards] = useState<PokemonCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(`/api/pokemon/sets/${resolvedParams.id}`)
        if (!response.ok) throw new Error("Failed to fetch set data")
        const data = await response.json()
        setSet(data.set)
        setCards(data.cards)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [resolvedParams.id])

  const filteredCards = cards.filter((card) =>
    card.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    card.number.includes(searchQuery)
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-4">
            <Spinner className="h-8 w-8" />
            <p className="text-muted-foreground">Loading set data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !set) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-24 text-center">
          <p className="text-destructive">{error || "Set not found"}</p>
          <Link href="/database" className="mt-4 inline-block text-primary hover:underline">
            Back to Database
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Back Link */}
        <Link
          href="/database"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Database
        </Link>

        {/* Set Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            {set.images?.logo && (
              <div className="relative h-16 w-16 flex-shrink-0">
                <Image
                  src={set.images.logo}
                  alt={set.name}
                  fill
                  className="object-contain"
                />
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground mb-1">{set.series}</p>
              <h1 className="text-3xl font-bold tracking-tight">{set.name}</h1>
              <p className="mt-2 text-muted-foreground">
                Released {formatDate(set.releaseDate)} | {cards.length} cards
              </p>
            </div>
          </div>
          <Button className="gap-2 w-fit">
            <Plus className="h-4 w-4" />
            Add to Master Sets
          </Button>
        </div>

        {/* Toolbar */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search cards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex rounded-md border">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-r-none"
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-l-none"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Cards View */}
        {viewMode === "grid" ? (
          <div className="grid gap-3 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
            {filteredCards.map((card) => (
              <div
                key={card.id}
                className="relative aspect-[2.5/3.5] rounded-lg overflow-hidden hover:scale-105 hover:z-10 hover:shadow-xl transition-all cursor-pointer"
              >
                <Image
                  src={card.images.small}
                  alt={card.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 30vw, (max-width: 1024px) 20vw, 12vw"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-secondary/50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Card
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Rarity
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCards.map((card) => (
                    <tr
                      key={card.id}
                      className="border-b last:border-0 hover:bg-secondary/30 transition-colors"
                    >
                      <td className="px-4 py-2">
                        <div className="relative h-16 w-12 rounded overflow-hidden">
                          <Image
                            src={card.images.small}
                            alt={card.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {card.number}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium">{card.name}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn("h-2 w-2 rounded-full", getRarityColor(card.rarity))}
                          />
                          <span className="text-sm">{card.rarity || "Unknown"}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {filteredCards.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">No cards found</p>
          </div>
        )}
      </main>
    </div>
  )
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" })
  } catch {
    return dateString
  }
}
