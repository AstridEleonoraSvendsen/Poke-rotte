"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import Image from "next/image"
import { Header } from "@/components/header"
import { BinderView } from "@/components/binder-view"
import { RarityBreakdown } from "@/components/rarity-breakdown"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { ArrowLeft, Search, Download, Trash2, ArrowUpDown } from "lucide-react"

type SortOption = "number-asc" | "number-desc" | "alpha" | "owned" | "missing"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface PokemonCard {
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

interface SetStats {
  totalCards: number
  regularCards: number
  secretCards: number
}

export default function SetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [set, setSet] = useState<PokemonSet | null>(null)
  const [cards, setCards] = useState<PokemonCard[]>([])
  const [stats, setStats] = useState<SetStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ownedCards, setOwnedCards] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "binder">("grid")
  const [sortBy, setSortBy] = useState<SortOption>("number-asc")

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(`/api/pokemon/sets/${resolvedParams.id}`)
        if (!response.ok) throw new Error("Failed to fetch set data")
        const data = await response.json()
        setSet(data.set)
        setCards(data.cards)
        setStats(data.stats)
        
        // Initialize empty owned cards (user starts fresh)
        setOwnedCards(new Set())
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [resolvedParams.id])

  const toggleOwned = (cardId: string) => {
    setOwnedCards((prev) => {
      const next = new Set(prev)
      if (next.has(cardId)) {
        next.delete(cardId)
      } else {
        next.add(cardId)
      }
      return next
    })
  }

  const selectAll = () => {
    setOwnedCards(new Set(cards.map(c => c.id)))
  }

  const clearAll = () => {
    setOwnedCards(new Set())
  }

  // Sort options labels
  const sortLabels: Record<SortOption, string> = {
    "number-asc": "Card Number Lo-Hi",
    "number-desc": "Card Number Hi-Lo",
    "alpha": "Alphabetical",
    "owned": "Cards I Own",
    "missing": "Cards I Do Not Own",
  }

  const filteredAndSortedCards = cards
    .filter((card) => {
      const matchesSearch =
        card.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.number.includes(searchQuery)
      return matchesSearch
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "number-asc": {
          const numA = parseInt(a.number.replace(/\D/g, '')) || 0
          const numB = parseInt(b.number.replace(/\D/g, '')) || 0
          if (numA !== numB) return numA - numB
          // Reverse holos after standard
          return a.isReverseHolo ? 1 : -1
        }
        case "number-desc": {
          const numA = parseInt(a.number.replace(/\D/g, '')) || 0
          const numB = parseInt(b.number.replace(/\D/g, '')) || 0
          if (numA !== numB) return numB - numA
          return a.isReverseHolo ? 1 : -1
        }
        case "alpha":
          return a.name.localeCompare(b.name)
        case "owned": {
          // Owned cards first
          const aOwned = ownedCards.has(a.id) ? 0 : 1
          const bOwned = ownedCards.has(b.id) ? 0 : 1
          if (aOwned !== bOwned) return aOwned - bOwned
          const numA = parseInt(a.number.replace(/\D/g, '')) || 0
          const numB = parseInt(b.number.replace(/\D/g, '')) || 0
          return numA - numB
        }
        case "missing": {
          // Missing cards first
          const aMissing = ownedCards.has(a.id) ? 1 : 0
          const bMissing = ownedCards.has(b.id) ? 1 : 0
          if (aMissing !== bMissing) return aMissing - bMissing
          const numA = parseInt(a.number.replace(/\D/g, '')) || 0
          const numB = parseInt(b.number.replace(/\D/g, '')) || 0
          return numA - numB
        }
        default:
          return 0
      }
    })

  const completionPercent = cards.length > 0 
    ? Math.round((ownedCards.size / cards.length) * 100) 
    : 0

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
          <Link href="/" className="mt-4 inline-block text-primary hover:underline">
            Back to Master Sets
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
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Sets
        </Link>

        {/* Set Header - TCG MasterSet style */}
        <div className="mb-6 rounded-lg border bg-card p-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            {/* Set Logo */}
            <div className="flex items-center gap-4">
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
                <span className="inline-block px-2 py-0.5 text-xs font-medium bg-secondary rounded mb-1">
                  Pokemon
                </span>
                <h1 className="text-2xl font-bold tracking-tight">{set.name}</h1>
                <p className="text-sm text-muted-foreground">{set.series}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-6 lg:ml-auto">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{completionPercent}%</p>
                <p className="text-xs text-muted-foreground">Complete</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  <span className="text-foreground">{ownedCards.size}</span>
                  <span className="text-muted-foreground">/{cards.length}</span>
                </p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  <span className="text-foreground">
                    {ownedCards.size > 0 
                      ? cards.filter(c => !c.isReverseHolo && ownedCards.has(c.id)).length 
                      : 0}
                  </span>
                  <span className="text-muted-foreground">/{stats?.regularCards || 0}</span>
                </p>
                <p className="text-xs text-muted-foreground">Cards</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  <span className="text-foreground">
                    {cards.filter(c => c.isReverseHolo && ownedCards.has(c.id)).length}
                  </span>
                  <span className="text-muted-foreground">
                    /{cards.filter(c => c.isReverseHolo).length}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">Reverse Holo</p>
              </div>
              {stats && stats.secretCards > 0 && (
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    <span className="text-foreground">0</span>
                    <span className="text-muted-foreground">/{stats.secretCards}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">Secret</p>
                </div>
              )}
              
              {/* Actions */}
              <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-border">
                <Button variant="ghost" size="icon">
                  <Download className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
          
          {/* Progress bar */}
          <Progress value={completionPercent} className="mt-4 h-2" />
        </div>

        {/* Rarity Breakdown */}
        <div className="mb-6">
          <RarityBreakdown cards={cards} ownedCards={ownedCards} />
        </div>

        {/* Toolbar */}
        <div className="mb-6 flex flex-col gap-4">
          {/* Search and Sort Row */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Find a card..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-card"
              />
            </div>

            {/* Sort By Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Sort By</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 min-w-[180px] justify-between">
                    {sortLabels[sortBy]}
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  <DropdownMenuItem onClick={() => setSortBy("number-asc")}>
                    Card Number Lo-Hi
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("number-desc")}>
                    Card Number Hi-Lo
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("alpha")}>
                    Alphabetical
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("owned")}>
                    Cards I Own
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("missing")}>
                    Cards I Do Not Own
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Grid/Binder Toggle and Actions Row */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {/* Grid/Binder Toggle */}
              <div className="flex rounded-lg border bg-secondary/50 p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "px-4 py-1.5 text-sm font-medium rounded-md transition-colors",
                    viewMode === "grid" 
                      ? "bg-background text-foreground shadow-sm" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode("binder")}
                  className={cn(
                    "px-4 py-1.5 text-sm font-medium rounded-md transition-colors",
                    viewMode === "binder" 
                      ? "bg-background text-foreground shadow-sm" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Binder
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={selectAll}>
                Select all
              </Button>
              <Button variant="ghost" size="sm" onClick={clearAll}>
                Clear all
              </Button>
            </div>
          </div>
        </div>

        {/* Cards View */}
        {viewMode === "grid" ? (
          <div className="grid gap-3 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
            {filteredAndSortedCards.map((card) => (
              <button
                key={card.id}
                onClick={() => toggleOwned(card.id)}
                className={cn(
                  "group relative aspect-[2.5/3.5] rounded-lg overflow-hidden transition-all",
                  "hover:scale-105 hover:z-10 hover:shadow-xl",
                  !ownedCards.has(card.id) && "opacity-40 grayscale"
                )}
              >
                <Image
                  src={card.images.small}
                  alt={card.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 30vw, (max-width: 1024px) 20vw, 12vw"
                />
                {/* Reverse Holo indicator */}
                {card.isReverseHolo && (
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent pointer-events-none" />
                )}
                {/* Card name tooltip on hover */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-[10px] text-white font-medium truncate">{card.name}</p>
                  <p className="text-[9px] text-white/70">#{card.number}</p>
                </div>
                {/* Ownership badge */}
                <div className={cn(
                  "absolute top-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-bold",
                  ownedCards.has(card.id) 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted/80 text-muted-foreground"
                )}>
                  {ownedCards.has(card.id) ? "1/1" : "0/1"}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <BinderView 
            cards={filteredAndSortedCards} 
            ownedCards={ownedCards} 
            onToggleOwned={toggleOwned} 
          />
        )}

        {filteredAndSortedCards.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">No cards found matching your criteria</p>
          </div>
        )}
      </main>
    </div>
  )
}
