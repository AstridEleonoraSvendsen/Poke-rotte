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
import { ArrowLeft, Search, Trash2, ArrowUpDown, Heart, AlertTriangle } from "lucide-react"
import { loadOwnedCards, saveOwnedCards, loadWishlist, saveWishlist } from "@/lib/collection"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

type SortOption = "number-asc" | "number-desc" | "alpha" | "owned" | "missing"

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
  const setId = resolvedParams.id

  const [set, setSet] = useState<PokemonSet | null>(null)
  const [cards, setCards] = useState<PokemonCard[]>([])
  const [stats, setStats] = useState<SetStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ownedCards, setOwnedCards] = useState<Set<string>>(new Set())
  const [wishlist, setWishlist] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "binder">("grid")
  const [sortBy, setSortBy] = useState<SortOption>("number-asc")
  const [showWishlistOnly, setShowWishlistOnly] = useState(false)
  const [saveIndicator, setSaveIndicator] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    setOwnedCards(loadOwnedCards(setId))
    setWishlist(loadWishlist(setId))
  }, [setId])

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(`/api/pokemon/sets/${setId}`)
        if (!response.ok) throw new Error("Failed to fetch set data")
        const data = await response.json()
        setSet(data.set)
        setCards(data.cards)
        setStats(data.stats)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [setId])

  const flashSaveIndicator = () => {
    setSaveIndicator(true)
    setTimeout(() => setSaveIndicator(false), 1200)
  }

  const toggleOwned = (cardId: string) => {
    setOwnedCards((prev) => {
      const next = new Set(prev)
      if (next.has(cardId)) {
        next.delete(cardId)
      } else {
        next.add(cardId)
        setWishlist((wl) => {
          const wlNext = new Set(wl)
          wlNext.delete(cardId)
          saveWishlist(setId, wlNext)
          return wlNext
        })
      }
      saveOwnedCards(setId, next)
      flashSaveIndicator()
      return next
    })
  }

  const selectAll = () => {
    const all = new Set(cards.map((c) => c.id))
    setOwnedCards(all)
    saveOwnedCards(setId, all)
    flashSaveIndicator()
  }

  const clearAll = () => {
    const empty = new Set<string>()
    setOwnedCards(empty)
    saveOwnedCards(setId, empty)
    flashSaveIndicator()
  }

  const toggleWishlist = (cardId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setWishlist((prev) => {
      const next = new Set(prev)
      if (next.has(cardId)) {
        next.delete(cardId)
      } else {
        next.add(cardId)
      }
      saveWishlist(setId, next)
      return next
    })
  }

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
      const matchesWishlist = showWishlistOnly ? wishlist.has(card.id) : true
      return matchesSearch && matchesWishlist
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "number-asc": {
          const numA = parseInt(a.number.replace(/\D/g, "")) || 0
          const numB = parseInt(b.number.replace(/\D/g, "")) || 0
          if (numA !== numB) return numA - numB
          return a.isReverseHolo ? 1 : -1
        }
        case "number-desc": {
          const numA = parseInt(a.number.replace(/\D/g, "")) || 0
          const numB = parseInt(b.number.replace(/\D/g, "")) || 0
          if (numA !== numB) return numB - numA
          return a.isReverseHolo ? 1 : -1
        }
        case "alpha":
          return a.name.localeCompare(b.name)
        case "owned": {
          const aOwned = ownedCards.has(a.id) ? 0 : 1
          const bOwned = ownedCards.has(b.id) ? 0 : 1
          if (aOwned !== bOwned) return aOwned - bOwned
          const numA = parseInt(a.number.replace(/\D/g, "")) || 0
          const numB = parseInt(b.number.replace(/\D/g, "")) || 0
          return numA - numB
        }
        case "missing": {
          const aMissing = ownedCards.has(a.id) ? 1 : 0
          const bMissing = ownedCards.has(b.id) ? 1 : 0
          if (aMissing !== bMissing) return aMissing - bMissing
          const numA = parseInt(a.number.replace(/\D/g, "")) || 0
          const numB = parseInt(b.number.replace(/\D/g, "")) || 0
          return numA - numB
        }
        default:
          return 0
      }
    })

  const completionPercent =
    cards.length > 0 ? Math.round((ownedCards.size / cards.length) * 100) : 0

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

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h2 className="text-base font-bold">Delete master set?</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  This will permanently remove all your progress for <strong>{set?.name}</strong>. This cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-destructive hover:bg-destructive/90 text-white"
                onClick={() => {
                  clearAll()
                  setConfirmDelete(false)
                }}
              >
                Yes, delete
              </Button>
            </div>
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 py-8">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Sets
        </Link>

        {/* Set Header */}
        <div className="mb-6 rounded-lg border bg-card p-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            <div className="flex items-center gap-4">
              {set.images?.logo && (
                <div className="relative h-16 w-16 flex-shrink-0">
                  <Image src={set.images.logo} alt={set.name} fill className="object-contain" />
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
                    {cards.filter((c) => !c.isReverseHolo && ownedCards.has(c.id)).length}
                  </span>
                  <span className="text-muted-foreground">/{stats?.regularCards || 0}</span>
                </p>
                <p className="text-xs text-muted-foreground">Cards</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  <span className="text-foreground">
                    {cards.filter((c) => c.isReverseHolo && ownedCards.has(c.id)).length}
                  </span>
                  <span className="text-muted-foreground">
                    /{cards.filter((c) => c.isReverseHolo).length}
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
              {wishlist.size > 0 && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-pink-500">{wishlist.size}</p>
                  <p className="text-xs text-muted-foreground">Wishlisted</p>
                </div>
              )}

              <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-border">
                <span
                  className={cn(
                    "text-xs text-primary transition-opacity duration-300",
                    saveIndicator ? "opacity-100" : "opacity-0"
                  )}
                >
                  Saved ✓
                </span>
                <Button variant="ghost" size="icon" title="Export collection">
                  <Download className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" title="Clear all owned cards" onClick={clearAll}>
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
          <Progress value={completionPercent} className="mt-4 h-2" />
        </div>

        {/* Rarity Breakdown */}
        <div className="mb-6">
          <RarityBreakdown cards={cards} ownedCards={ownedCards} />
        </div>

        {/* Toolbar */}
        <div className="mb-6 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Find a card..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-card"
              />
            </div>
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
                  <DropdownMenuItem onClick={() => setSortBy("number-asc")}>Card Number Lo-Hi</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("number-desc")}>Card Number Hi-Lo</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("alpha")}>Alphabetical</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("owned")}>Cards I Own</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("missing")}>Cards I Do Not Own</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border bg-secondary/50 p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "px-4 py-1.5 text-sm font-medium rounded-md transition-colors",
                    viewMode === "grid" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode("binder")}
                  className={cn(
                    "px-4 py-1.5 text-sm font-medium rounded-md transition-colors",
                    viewMode === "binder" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Binder
                </button>
              </div>

              <button
                onClick={() => setShowWishlistOnly((v) => !v)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors border",
                  showWishlistOnly
                    ? "bg-pink-500/10 text-pink-500 border-pink-500/30"
                    : "text-muted-foreground hover:text-foreground border-border"
                )}
              >
                <Heart className={cn("h-3.5 w-3.5", showWishlistOnly && "fill-pink-500")} />
                Wishlist {wishlist.size > 0 && `(${wishlist.size})`}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={selectAll}>Select all</Button>
              <Button variant="ghost" size="sm" onClick={clearAll}>Clear all</Button>
            </div>
          </div>
        </div>

        {/* Cards View */}
        {viewMode === "grid" ? (
          <div className="grid gap-x-3 gap-y-5 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
            {filteredAndSortedCards.map((card) => (
              <div key={card.id} className="group flex flex-col">
                {/* Card image — clickable to toggle owned */}
                <div
                  onClick={() => toggleOwned(card.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && toggleOwned(card.id)}
                  className={cn(
                    "relative aspect-[2.5/3.5] rounded-lg overflow-hidden transition-all cursor-pointer",
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
                  {card.isReverseHolo && (
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent pointer-events-none" />
                  )}
                  <div className={cn(
                    "absolute top-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-bold",
                    ownedCards.has(card.id) ? "bg-primary text-primary-foreground" : "bg-muted/80 text-muted-foreground"
                  )}>
                    {ownedCards.has(card.id) ? "1/1" : "0/1"}
                  </div>
                  <button
                    onClick={(e) => toggleWishlist(card.id, e)}
                    className={cn(
                      "absolute top-1 left-1 p-1 rounded transition-all",
                      wishlist.has(card.id) ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    )}
                    title={wishlist.has(card.id) ? "Remove from wishlist" : "Add to wishlist"}
                  >
                    <Heart className={cn(
                      "h-3.5 w-3.5 drop-shadow",
                      wishlist.has(card.id) ? "fill-pink-500 text-pink-500" : "text-white"
                    )} />
                  </button>
                </div>
                {/* Info panel beneath card — pokedata style */}
                <div className="mt-1.5 flex flex-col gap-px">
                  <p className="text-[10px] font-semibold leading-tight truncate">
                    {card.isReverseHolo ? card.name.replace(" Reverse Holo", "") : card.name}
                  </p>
                  <p className="text-[9px] text-muted-foreground">
                    #{card.number}{card.isReverseHolo ? " · Reverse Holo" : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <BinderView
            cards={filteredAndSortedCards}
            ownedCards={ownedCards}
            wishlist={wishlist}
            onToggleOwned={toggleOwned}
            onToggleWishlist={(id, e) => toggleWishlist(id, e)}
          />
        )}

        {filteredAndSortedCards.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">
              {showWishlistOnly
                ? "No cards in your wishlist yet. Hover a card and click the heart icon to add one."
                : "No cards found matching your criteria"}
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
