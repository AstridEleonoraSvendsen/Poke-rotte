"use client"

import { useState, useEffect, use, useRef, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  getDreamsLists,
  getDreamsCards,
  addCardToDreamsList,
  removeCardFromDreamsList,
  updateDreamsCardQuantity,
  updateDreamsList,
  type DreamsList,
  type DreamsCard,
} from "@/lib/collection"
import {
  ArrowLeft, Search, Plus, Minus, X, Heart, Sparkles,
  Pencil, Check, SlidersHorizontal, ChevronDown
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SearchCard {
  id: string
  name: string
  number: string
  rarity: string
  supertype: string
  subtypes: string[]
  set: { id: string; name: string; series: string; releaseDate: string; images?: { symbol?: string } }
  images: { small: string; large: string }
  cardmarket?: { prices?: { averageSellPrice?: number; trendPrice?: number } }
}

type SortMode = "added" | "name" | "rarity" | "set"

const RARITY_ORDER = [
  "Hyper Rare", "Special Illustration Rare", "Illustration Rare", "Ultra Rare",
  "Shiny Ultra Rare", "Shiny Rare", "Double Rare", "Rare Holo V", "Rare Holo VMAX",
  "Rare VSTAR", "Rare Holo GX", "Rare Holo EX", "Rare Holo", "Rare", "Uncommon", "Common",
]

export default function DreamsListPage({ params }: { params: Promise<{ listId: string }> }) {
  const { listId } = use(params)

  const [list, setList] = useState<DreamsList | null>(null)
  const [cards, setCards] = useState<DreamsCard[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchCard[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState("")
  const [sortBy, setSortBy] = useState<SortMode>("added")
  const [filterQuery, setFilterQuery] = useState("")
  const [addedFeedback, setAddedFeedback] = useState<string | null>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const allLists = getDreamsLists()
    const found = allLists.find((l) => l.id === listId)
    if (found) {
      setList(found)
      setNameValue(found.name)
    }
    setCards(getDreamsCards(listId))
  }, [listId])

  // Close search on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (searchQuery.length < 2) {
      setSearchResults([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const res = await fetch(`/api/pokemon/search?q=${encodeURIComponent(searchQuery)}`)
        const data = await res.json()
        setSearchResults(data.cards || [])
        setSearchOpen(true)
      } catch { setSearchResults([]) }
      finally { setSearchLoading(false) }
    }, 350)
  }, [searchQuery])

  const handleAddCard = (card: SearchCard) => {
    const price = card.cardmarket?.prices?.trendPrice ?? card.cardmarket?.prices?.averageSellPrice
    addCardToDreamsList(listId, {
      id: card.id,
      name: card.name,
      number: card.number,
      rarity: card.rarity,
      supertype: card.supertype,
      setName: card.set.name,
      setId: card.set.id,
      imageSmall: card.images.small,
      imageLarge: card.images.large,
      marketPrice: price,
    })
    setCards(getDreamsCards(listId))
    setAddedFeedback(card.id)
    setTimeout(() => setAddedFeedback(null), 1500)
  }

  const handleRemove = (cardId: string) => {
    removeCardFromDreamsList(listId, cardId)
    setCards(getDreamsCards(listId))
  }

  const handleQuantity = (cardId: string, delta: number) => {
    const card = cards.find((c) => c.id === cardId)
    if (!card) return
    updateDreamsCardQuantity(listId, cardId, card.quantity + delta)
    setCards(getDreamsCards(listId))
  }

  const saveName = () => {
    if (!nameValue.trim() || !list) return
    updateDreamsList(listId, { name: nameValue.trim() })
    setList((prev) => prev ? { ...prev, name: nameValue.trim() } : prev)
    setEditingName(false)
  }

  const isInList = (cardId: string) => cards.some((c) => c.id === cardId)

  const sortedCards = [...cards]
    .filter((c) =>
      filterQuery
        ? c.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
          c.setName.toLowerCase().includes(filterQuery.toLowerCase())
        : true
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "name": return a.name.localeCompare(b.name)
        case "set": return a.setName.localeCompare(b.setName) || a.name.localeCompare(b.name)
        case "rarity": {
          const ai = RARITY_ORDER.indexOf(a.rarity)
          const bi = RARITY_ORDER.indexOf(b.rarity)
          return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
        }
        default: return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
      }
    })

  const totalCards = cards.reduce((a, c) => a + c.quantity, 0)
  const rarityGroups = cards.reduce((acc, c) => {
    acc[c.rarity] = (acc[c.rarity] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)
  const topRarity = Object.entries(rarityGroups).sort((a, b) => b[1] - a[1])[0]

  if (!list) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-24 text-center">
          <p className="text-muted-foreground">Wishlist not found.</p>
          <Link href="/dreams" className="mt-4 inline-block text-primary hover:underline">Back to Poke Dreams</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-6xl">

        {/* Back */}
        <Link href="/dreams" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Poke Dreams
        </Link>

        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-start gap-4 justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold tracking-widest uppercase text-primary">Wishlist</span>
            </div>
            {editingName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") saveName(); if (e.key === "Escape") setEditingName(false) }}
                  className="text-2xl font-bold h-auto py-1 w-64"
                  autoFocus
                />
                <button onClick={saveName} className="text-primary hover:text-primary/80">
                  <Check className="h-5 w-5" />
                </button>
                <button onClick={() => setEditingName(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <h1 className="text-3xl font-bold tracking-tight">{list.name}</h1>
                <button
                  onClick={() => setEditingName(true)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
            )}
            {list.description && <p className="text-muted-foreground mt-1">{list.description}</p>}
          </div>

          {/* Stats pills */}
          <div className="flex flex-wrap gap-2">
            <div className="rounded-lg border bg-card px-4 py-2 text-center">
              <p className="text-2xl font-bold">{totalCards}</p>
              <p className="text-xs text-muted-foreground">Cards</p>
            </div>
            <div className="rounded-lg border bg-card px-4 py-2 text-center">
              <p className="text-2xl font-bold">{cards.length}</p>
              <p className="text-xs text-muted-foreground">Unique</p>
            </div>
            {topRarity && (
              <div className="rounded-lg border bg-card px-4 py-2 text-center max-w-[120px]">
                <p className="text-sm font-bold truncate">{topRarity[0]}</p>
                <p className="text-xs text-muted-foreground">Top rarity</p>
              </div>
            )}
          </div>
        </div>

        {/* Search bar — full width, prominent */}
        <div ref={searchRef} className="relative mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search for any Pokémon card to add to this wishlist..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchResults.length > 0 && setSearchOpen(true)}
              className="pl-12 h-14 text-base bg-card border-border/80 focus:border-primary rounded-xl"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(""); setSearchResults([]); setSearchOpen(false) }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Search results dropdown */}
          {searchOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-xl border bg-card shadow-2xl overflow-hidden">
              {searchLoading && (
                <div className="flex items-center justify-center py-8">
                  <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                </div>
              )}
              {!searchLoading && searchResults.length === 0 && searchQuery.length >= 2 && (
                <div className="py-8 text-center text-muted-foreground text-sm">No cards found for "{searchQuery}"</div>
              )}
              {!searchLoading && searchResults.length > 0 && (
                <div className="max-h-[480px] overflow-y-auto">
                  <div className="px-3 py-2 border-b bg-secondary/30">
                    <p className="text-xs text-muted-foreground font-medium">{searchResults.length} results for "{searchQuery}"</p>
                  </div>
                  {searchResults.map((card) => {
                    const inList = isInList(card.id)
                    const justAdded = addedFeedback === card.id
                    const price = card.cardmarket?.prices?.trendPrice ?? card.cardmarket?.prices?.averageSellPrice
                    return (
                      <div
                        key={card.id}
                        className="flex items-center gap-3 px-3 py-2.5 hover:bg-secondary/50 transition-colors border-b border-border/30 last:border-0"
                      >
                        {/* Card image */}
                        <div className="relative h-14 w-10 flex-shrink-0 rounded overflow-hidden shadow">
                          <Image src={card.images.small} alt={card.name} fill className="object-cover" sizes="40px" />
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{card.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            #{card.number} · {card.set.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {card.rarity && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-secondary text-muted-foreground">
                                {card.rarity}
                              </span>
                            )}
                            {price && (
                              <span className="text-[11px] text-muted-foreground font-medium">€{price.toFixed(2)}</span>
                            )}
                          </div>
                        </div>
                        {/* Add button */}
                        <button
                          onClick={() => !inList && handleAddCard(card)}
                          className={cn(
                            "flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                            inList || justAdded
                              ? "bg-primary/10 text-primary cursor-default"
                              : "bg-primary text-primary-foreground hover:bg-primary/90"
                          )}
                        >
                          {justAdded ? (
                            <><Check className="h-3.5 w-3.5" /> Added</>
                          ) : inList ? (
                            <><Heart className="h-3.5 w-3.5 fill-primary" /> In list</>
                          ) : (
                            <><Plus className="h-3.5 w-3.5" /> Add</>
                          )}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* List toolbar */}
        {cards.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between mb-6">
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filter cards..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="pl-9 bg-card"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Sort:</span>
              {(["added", "name", "rarity", "set"] as SortMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setSortBy(mode)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize",
                    sortBy === mode
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  )}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Empty state for cards */}
        {cards.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Search className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-lg font-semibold mb-1">This wishlist is empty</h2>
            <p className="text-muted-foreground text-sm">
              Search for a card above and click <strong>Add</strong> to start building your list.
            </p>
          </div>
        )}

        {/* Card grid — inspired by dextcg's large card visual layout */}
        {sortedCards.length > 0 && (
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {sortedCards.map((card) => (
              <div key={card.id} className="group relative">
                {/* Card image */}
                <div className="relative aspect-[2.5/3.5] rounded-xl overflow-hidden shadow-md group-hover:shadow-xl transition-shadow">
                  <Image
                    src={card.imageSmall}
                    alt={card.name}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 16vw"
                  />
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                    <button
                      onClick={() => handleRemove(card.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-destructive/90 text-white rounded-lg text-xs font-medium hover:bg-destructive"
                    >
                      <X className="h-3 w-3" /> Remove
                    </button>
                  </div>
                  {/* Quantity badge */}
                  {card.quantity > 1 && (
                    <div className="absolute top-1.5 right-1.5 bg-primary text-primary-foreground text-[11px] font-bold rounded-full h-5 w-5 flex items-center justify-center shadow">
                      {card.quantity}
                    </div>
                  )}
                </div>

                {/* Card info below */}
                <div className="mt-2 px-0.5">
                  <p className="text-xs font-semibold truncate">{card.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{card.setName} #{card.number}</p>
                  {card.marketPrice && (
                    <p className="text-[10px] text-primary font-medium mt-0.5">€{card.marketPrice.toFixed(2)}</p>
                  )}

                  {/* Quantity controls */}
                  <div className="flex items-center gap-1 mt-1.5">
                    <button
                      onClick={() => handleQuantity(card.id, -1)}
                      className="h-5 w-5 rounded flex items-center justify-center bg-secondary hover:bg-secondary/80 transition-colors"
                    >
                      <Minus className="h-2.5 w-2.5" />
                    </button>
                    <span className="text-xs font-semibold w-5 text-center">{card.quantity}</span>
                    <button
                      onClick={() => handleQuantity(card.id, 1)}
                      className="h-5 w-5 rounded flex items-center justify-center bg-secondary hover:bg-secondary/80 transition-colors"
                    >
                      <Plus className="h-2.5 w-2.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No filter results */}
        {filterQuery && sortedCards.length === 0 && cards.length > 0 && (
          <div className="py-12 text-center text-muted-foreground">
            No cards match "{filterQuery}"
          </div>
        )}
      </main>
    </div>
  )
}
