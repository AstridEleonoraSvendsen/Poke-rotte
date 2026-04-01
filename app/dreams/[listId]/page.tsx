"use client"

import { useState, useEffect, use, useRef } from "react"
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
  Pencil, Check, LayoutGrid, List, ChevronDown, SlidersHorizontal,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SearchCard {
  id: string
  name: string
  number: string
  rarity: string
  supertype: string
  subtypes: string[]
  set: { id: string; name: string; series: string; releaseDate: string }
  images: { small: string; large: string }
  marketPrice: number | null
}

type SortOption = "releaseDate-desc" | "releaseDate-asc" | "price-desc" | "price-asc"
type ViewMode = "grid" | "list"
type WishlistSort = "added" | "name" | "rarity" | "set"

const SORT_LABELS: Record<SortOption, string> = {
  "releaseDate-desc": "Release Date: Newer",
  "releaseDate-asc":  "Release Date: Older",
  "price-desc":       "Price: High to Low",
  "price-asc":        "Price: Low to High",
}

export default function DreamsListPage({ params }: { params: Promise<{ listId: string }> }) {
  const { listId } = use(params)

  const [list, setList] = useState<DreamsList | null>(null)
  const [cards, setCards] = useState<DreamsCard[]>([])

  // Search state
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchCard[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchTotal, setSearchTotal] = useState(0)
  const [searchPage, setSearchPage] = useState(1)
  const [searchHasMore, setSearchHasMore] = useState(false)
  const [searchSort, setSearchSort] = useState<SortOption>("releaseDate-desc")
  const [sortOpen, setSortOpen] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [hasSearched, setHasSearched] = useState(false)

  // Wishlist filter/sort
  const [filterQuery, setFilterQuery] = useState("")
  const [wishlistSort, setWishlistSort] = useState<WishlistSort>("added")

  // Edit name
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState("")

  // Feedback
  const [addedFeedback, setAddedFeedback] = useState<string | null>(null)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sortRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const allLists = getDreamsLists()
    const found = allLists.find((l) => l.id === listId)
    if (found) { setList(found); setNameValue(found.name) }
    setCards(getDreamsCards(listId))
  }, [listId])

  // Close sort dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  // Debounced search — triggers on query OR sort change
  const runSearch = async (q: string, sort: SortOption, page: number, append = false) => {
    if (q.trim().length < 2) {
      setSearchResults([]); setSearchTotal(0); setHasSearched(false); return
    }
    setSearchLoading(true)
    setHasSearched(true)
    try {
      const res = await fetch(`/api/pokemon/search?q=${encodeURIComponent(q)}&sort=${sort}&page=${page}`)
      const data = await res.json()
      setSearchResults(prev => append ? [...prev, ...(data.cards || [])] : (data.cards || []))
      setSearchTotal(data.total ?? 0)
      setSearchPage(page)
      setSearchHasMore(data.hasMore ?? false)
    } catch {
      setSearchResults([])
    } finally {
      setSearchLoading(false)
    }
  }

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => runSearch(searchQuery, searchSort, 1), 400)
  }, [searchQuery, searchSort])

  const loadMore = () => runSearch(searchQuery, searchSort, searchPage + 1, true)

  const handleAddCard = (card: SearchCard) => {
    addCardToDreamsList(listId, {
      id: card.id, name: card.name, number: card.number,
      rarity: card.rarity, supertype: card.supertype,
      setName: card.set.name, setId: card.set.id,
      imageSmall: card.images.small, imageLarge: card.images.large,
      marketPrice: card.marketPrice ?? undefined,
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
    setList(prev => prev ? { ...prev, name: nameValue.trim() } : prev)
    setEditingName(false)
  }

  const isInList = (cardId: string) => cards.some((c) => c.id === cardId)

  const sortedWishlistCards = [...cards]
    .filter(c => filterQuery
      ? c.name.toLowerCase().includes(filterQuery.toLowerCase()) || c.setName.toLowerCase().includes(filterQuery.toLowerCase())
      : true)
    .sort((a, b) => {
      switch (wishlistSort) {
        case "name":   return a.name.localeCompare(b.name)
        case "set":    return a.setName.localeCompare(b.setName)
        case "rarity": return a.rarity.localeCompare(b.rarity)
        default:       return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
      }
    })

  const totalCards = cards.reduce((a, c) => a + c.quantity, 0)

  if (!list) return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-24 text-center">
        <p className="text-muted-foreground">Wishlist not found.</p>
        <Link href="/dreams" className="mt-4 inline-block text-primary hover:underline">Back to Poke Dreams</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-7xl">

        {/* Back */}
        <Link href="/dreams" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />Back to Poke Dreams
        </Link>

        {/* Page header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-start gap-4 justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold tracking-widest uppercase text-primary">Wishlist</span>
            </div>
            {editingName ? (
              <div className="flex items-center gap-2">
                <Input value={nameValue} onChange={e => setNameValue(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") saveName(); if (e.key === "Escape") setEditingName(false) }}
                  className="text-2xl font-bold h-auto py-1 w-64" autoFocus />
                <button onClick={saveName} className="text-primary"><Check className="h-5 w-5" /></button>
                <button onClick={() => setEditingName(false)} className="text-muted-foreground"><X className="h-4 w-4" /></button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <h1 className="text-3xl font-bold tracking-tight">{list.name}</h1>
                <button onClick={() => setEditingName(true)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground">
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
            )}
            {list.description && <p className="text-muted-foreground mt-1">{list.description}</p>}
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <div className="rounded-lg border bg-card px-4 py-2 text-center min-w-[72px]">
              <p className="text-2xl font-bold">{totalCards}</p>
              <p className="text-xs text-muted-foreground">Cards</p>
            </div>
            <div className="rounded-lg border bg-card px-4 py-2 text-center min-w-[72px]">
              <p className="text-2xl font-bold">{cards.length}</p>
              <p className="text-xs text-muted-foreground">Unique</p>
            </div>
          </div>
        </div>

        {/* ── SEARCH SECTION ─────────────────────────────────────────────── */}
        <div className="mb-10 rounded-xl border bg-card p-5">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Find a card to add</h2>

          {/* Search input row */}
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by Pokémon name e.g. Mew, Charizard, Pikachu..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-11 h-11 bg-background"
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(""); setSearchResults([]); setHasSearched(false) }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Sort dropdown */}
            <div ref={sortRef} className="relative">
              <button
                onClick={() => setSortOpen(v => !v)}
                className="flex items-center gap-2 h-11 px-4 rounded-lg border bg-background text-sm font-medium hover:bg-secondary/50 transition-colors whitespace-nowrap"
              >
                <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                {SORT_LABELS[searchSort]}
                <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", sortOpen && "rotate-180")} />
              </button>
              {sortOpen && (
                <div className="absolute right-0 top-full mt-1 z-50 w-52 rounded-xl border bg-card shadow-xl overflow-hidden">
                  {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(([key, label]) => (
                    <button key={key} onClick={() => { setSearchSort(key); setSortOpen(false) }}
                      className={cn(
                        "w-full text-left px-4 py-3 text-sm hover:bg-secondary/50 transition-colors",
                        searchSort === key ? "text-primary font-semibold bg-primary/5" : "text-foreground"
                      )}>
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Grid / List toggle */}
            <div className="flex rounded-lg border bg-background p-1 gap-0.5">
              <button onClick={() => setViewMode("grid")}
                className={cn("p-2 rounded-md transition-colors", viewMode === "grid" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground")}>
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button onClick={() => setViewMode("list")}
                className={cn("p-2 rounded-md transition-colors", viewMode === "list" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground")}>
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Results count */}
          {hasSearched && !searchLoading && (
            <p className="text-sm text-muted-foreground mb-4">
              <span className="font-semibold text-foreground">{searchTotal}</span> cards found for "{searchQuery}"
            </p>
          )}

          {/* Loading spinner */}
          {searchLoading && searchResults.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          )}

          {/* No results */}
          {hasSearched && !searchLoading && searchResults.length === 0 && (
            <div className="py-10 text-center text-muted-foreground text-sm">No cards found for "{searchQuery}"</div>
          )}

          {/* Empty / prompt state */}
          {!hasSearched && (
            <div className="py-8 text-center text-muted-foreground text-sm">
              Type a Pokémon name above to search across all sets
            </div>
          )}

          {/* ── GRID VIEW ── */}
          {searchResults.length > 0 && viewMode === "grid" && (
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {searchResults.map(card => {
                const inList = isInList(card.id)
                const justAdded = addedFeedback === card.id
                return (
                  <div key={card.id} className="group flex flex-col">
                    {/* Card image with add button overlay */}
                    <div className="relative aspect-[2.5/3.5] rounded-lg overflow-hidden shadow-md">
                      <Image src={card.images.small} alt={card.name} fill
                        className="object-cover transition-transform duration-200 group-hover:scale-105"
                        sizes="(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 16vw" />
                      {/* Add button — top right circle like pokedata */}
                      <button
                        onClick={() => !inList && !justAdded && handleAddCard(card)}
                        className={cn(
                          "absolute top-2 right-2 h-8 w-8 rounded-full flex items-center justify-center shadow-lg transition-all",
                          inList || justAdded
                            ? "bg-primary text-primary-foreground scale-110"
                            : "bg-background/90 text-foreground hover:bg-primary hover:text-primary-foreground hover:scale-110"
                        )}
                      >
                        {inList || justAdded ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                      </button>
                    </div>
                    {/* Card info beneath — pokedata style */}
                    <div className="mt-2 flex flex-col gap-0.5 min-h-[64px]">
                      <p className="text-xs font-bold leading-tight truncate">{card.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{card.set.name}</p>
                      <p className="text-[11px] text-muted-foreground">#{card.number}</p>
                      <p className="text-xs font-semibold text-primary mt-auto">
                        {card.marketPrice != null ? `€${card.marketPrice.toFixed(2)}` : "—"}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ── LIST VIEW ── */}
          {searchResults.length > 0 && viewMode === "list" && (
            <div className="flex flex-col divide-y divide-border/50">
              {searchResults.map(card => {
                const inList = isInList(card.id)
                const justAdded = addedFeedback === card.id
                return (
                  <div key={card.id} className="flex items-center gap-3 py-2.5 hover:bg-secondary/30 rounded-lg px-2 transition-colors">
                    <div className="relative h-14 w-10 flex-shrink-0 rounded-md overflow-hidden shadow">
                      <Image src={card.images.small} alt={card.name} fill className="object-cover" sizes="40px" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{card.name}</p>
                      <p className="text-xs text-muted-foreground">#{card.number} · {card.set.name}</p>
                      {card.rarity && (
                        <span className="inline-block mt-0.5 px-1.5 py-px rounded text-[10px] bg-secondary text-muted-foreground">{card.rarity}</span>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-primary">
                        {card.marketPrice != null ? `€${card.marketPrice.toFixed(2)}` : "—"}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Raw</p>
                    </div>
                    <button
                      onClick={() => !inList && !justAdded && handleAddCard(card)}
                      className={cn(
                        "flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                        inList || justAdded
                          ? "bg-primary/10 text-primary cursor-default"
                          : "bg-primary text-primary-foreground hover:bg-primary/90"
                      )}
                    >
                      {justAdded ? <><Check className="h-3.5 w-3.5" />Added</>
                        : inList ? <><Heart className="h-3.5 w-3.5 fill-primary" />In list</>
                        : <><Plus className="h-3.5 w-3.5" />Add</>}
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {/* Load more */}
          {searchHasMore && !searchLoading && (
            <div className="mt-6 text-center">
              <Button variant="outline" onClick={loadMore} className="gap-2">
                Load more results
              </Button>
            </div>
          )}
          {searchLoading && searchResults.length > 0 && (
            <div className="mt-4 flex justify-center">
              <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          )}
        </div>

        {/* ── MY WISHLIST CARDS ────────────────────────────────────────────── */}
        {cards.length > 0 && (
          <>
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between mb-5">
              <h2 className="text-lg font-bold">Cards in this list</h2>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input placeholder="Filter..." value={filterQuery} onChange={e => setFilterQuery(e.target.value)} className="pl-8 h-8 w-40 text-sm bg-card" />
                </div>
                <span className="text-sm text-muted-foreground">Sort:</span>
                {(["added", "name", "set", "rarity"] as WishlistSort[]).map(mode => (
                  <button key={mode} onClick={() => setWishlistSort(mode)}
                    className={cn("px-3 py-1 text-xs font-medium rounded-md transition-colors capitalize",
                      wishlistSort === mode ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground")}>
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {sortedWishlistCards.map(card => (
                <div key={card.id} className="group flex flex-col">
                  <div className="relative aspect-[2.5/3.5] rounded-lg overflow-hidden shadow-md">
                    <Image src={card.imageSmall} alt={card.name} fill
                      className="object-cover transition-transform duration-200 group-hover:scale-105"
                      sizes="(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 16vw" />
                    {/* Remove on hover */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button onClick={() => handleRemove(card.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-destructive text-white rounded-lg text-xs font-medium">
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
                  {/* Info beneath card — matching search results style */}
                  <div className="mt-2 flex flex-col gap-0.5 min-h-[64px]">
                    <p className="text-xs font-bold leading-tight truncate">{card.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{card.setName}</p>
                    <p className="text-[11px] text-muted-foreground">#{card.number}</p>
                    <p className="text-xs font-semibold text-primary mt-auto">
                      {card.marketPrice != null ? `€${card.marketPrice.toFixed(2)}` : "—"}
                    </p>
                  </div>
                  {/* Quantity controls */}
                  <div className="flex items-center gap-1.5 mt-2">
                    <button onClick={() => handleQuantity(card.id, -1)}
                      className="h-6 w-6 rounded-md flex items-center justify-center bg-secondary hover:bg-secondary/70 transition-colors">
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-xs font-bold w-5 text-center">{card.quantity}</span>
                    <button onClick={() => handleQuantity(card.id, 1)}
                      className="h-6 w-6 rounded-md flex items-center justify-center bg-secondary hover:bg-secondary/70 transition-colors">
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {cards.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Heart className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-lg font-semibold mb-1">This wishlist is empty</h2>
            <p className="text-sm text-muted-foreground">Search for a card above and click the <strong>+</strong> button to add it.</p>
          </div>
        )}

      </main>
    </div>
  )
}
