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
import { ArrowLeft, Search, Trash2, ArrowUpDown, Heart, AlertTriangle, Coins, X, Check } from "lucide-react"
import { loadOwnedCards, saveOwnedCards, loadWishlist, saveWishlist } from "@/lib/collection"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

type SortOption = "number-asc" | "number-desc" | "alpha" | "owned" | "missing"
type Currency = "EUR" | "DKK"

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

// 1 EUR = 7.46 DKK
const EUR_TO_DKK = 7.46;

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
  
  // Pricing States
  const [cardPrices, setCardPrices] = useState<Record<string, { price: number, currency: Currency }>>({})
  const [displayCurrency, setDisplayCurrency] = useState<Currency>("EUR")
  const [priceModalOpen, setPriceModalOpen] = useState(false)
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [priceInput, setPriceInput] = useState("")
  const [currencyInput, setCurrencyInput] = useState<Currency>("EUR")

  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "binder">("grid")
  const [sortBy, setSortBy] = useState<SortOption>("number-asc")
  const [showWishlistOnly, setShowWishlistOnly] = useState(false)
  const [saveIndicator, setSaveIndicator] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false) 

  useEffect(() => {
    // 1. Instant Local Load
    setOwnedCards(loadOwnedCards(setId))
    setWishlist(loadWishlist(setId))
    try {
      const localPrices = localStorage.getItem(`prices:${setId}`)
      if (localPrices) setCardPrices(JSON.parse(localPrices))
    } catch {}

    // 2. Cloud Sync
    async function fetchCloudOwned() {
      try {
        const res = await fetch(`/api/owned-cards?setId=${setId}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data.cards) {
            const cloudSet = new Set<string>(data.cards);
            setOwnedCards(cloudSet);
            saveOwnedCards(setId, cloudSet); 
          }
          if (data.cardData) {
            const prices: Record<string, { price: number, currency: Currency }> = {};
            data.cardData.forEach((row: any) => {
              if (row.paidPrice != null) {
                prices[row.cardId] = { 
                  price: Number(row.paidPrice), 
                  currency: (row.currency as Currency) || "EUR" 
                };
              }
            });
            setCardPrices(prices);
            localStorage.setItem(`prices:${setId}`, JSON.stringify(prices));
          }
        }
      } catch (e) {
        console.error("Failed to sync with cloud", e);
      }
    }
    fetchCloudOwned();
  }, [setId])

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(`/api/pokemon/sets/${setId}`)
        if (!response.ok) throw new Error("Failed to fetch set data")
        const data = await response.json()
        setSet(data.set)
        setCards(data.cards || [])
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

  const toggleOwned = async (cardId: string) => {
    setOwnedCards((prev) => {
      const next = new Set(prev)
      const isAdding = !next.has(cardId)
      
      if (isAdding) {
        next.add(cardId)
        setWishlist((wl) => {
          const wlNext = new Set(wl)
          wlNext.delete(cardId)
          saveWishlist(setId, wlNext)
          return wlNext
        })
      } else {
        next.delete(cardId)
        // Optionally remove price if un-owned
        const newPrices = { ...cardPrices }
        delete newPrices[cardId]
        setCardPrices(newPrices)
        localStorage.setItem(`prices:${setId}`, JSON.stringify(newPrices))
      }
      
      saveOwnedCards(setId, next)
      flashSaveIndicator()

      fetch('/api/owned-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          setId: setId, 
          cardId: cardId, 
          action: isAdding ? 'add' : 'remove' 
        })
      }).catch(err => console.error("Cloud save failed:", err))

      return next
    })
  }

  const openPriceModal = (cardId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevents clicking the card behind it
    e.preventDefault();
    setSelectedCardId(cardId);
    if (cardPrices[cardId]) {
      setPriceInput(cardPrices[cardId].price.toString());
      setCurrencyInput(cardPrices[cardId].currency);
    } else {
      setPriceInput("");
      setCurrencyInput(displayCurrency);
    }
    setPriceModalOpen(true);
  }

  const savePrice = async () => {
    if (!selectedCardId) return;
    
    const parsedPrice = parseFloat(priceInput.replace(',', '.'));
    if (isNaN(parsedPrice) || parsedPrice < 0) return;

    const newPrices = { 
      ...cardPrices, 
      [selectedCardId]: { price: parsedPrice, currency: currencyInput } 
    };
    setCardPrices(newPrices);
    localStorage.setItem(`prices:${setId}`, JSON.stringify(newPrices));
    setPriceModalOpen(false);
    flashSaveIndicator();

    try {
      await fetch('/api/owned-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          setId: setId, 
          cardId: selectedCardId, 
          action: 'update_price',
          paidPrice: parsedPrice,
          currency: currencyInput
        })
      })
    } catch (e) { console.error("Cloud price update failed", e) }
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
    setCardPrices({})
    localStorage.removeItem(`prices:${setId}`)
    flashSaveIndicator()
  }

  const toggleWishlist = (cardId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
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

  // --- SMART CONVERTER MATH ---
  let totalEUR = 0;
  let totalDKK = 0;
  
  ownedCards.forEach(cardId => {
    if (cardPrices[cardId]) {
      if (cardPrices[cardId].currency === "DKK") {
        totalDKK += cardPrices[cardId].price;
      } else {
        totalEUR += cardPrices[cardId].price;
      }
    }
  });

  const totalExpense = displayCurrency === "EUR" 
    ? totalEUR + (totalDKK / EUR_TO_DKK)
    : totalDKK + (totalEUR * EUR_TO_DKK);

  const sortLabels: Record<SortOption, string> = {
    "number-asc": "Card Number Lo-Hi",
    "number-desc": "Card Number Hi-Lo",
    "alpha": "Alphabetical",
    "owned": "Cards I Own",
    "missing": "Cards I Do Not Own",
  }

  const filteredAndSortedCards = (cards || [])
    .filter((card) => {
      if (!card) return false;
      const safeName = card.name || "";
      const safeNumber = String(card.number || "");
      
      const matchesSearch =
        safeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        safeNumber.includes(searchQuery)
      const matchesWishlist = showWishlistOnly ? wishlist.has(card.id) : true
      return matchesSearch && matchesWishlist
    })
    .sort((a, b) => {
      if (!a || !b) return 0;
      const safeNumA = String(a.number || "");
      const safeNumB = String(b.number || "");
      
      switch (sortBy) {
        case "number-asc": {
          const numA = parseInt(safeNumA.replace(/\D/g, "")) || 0
          const numB = parseInt(safeNumB.replace(/\D/g, "")) || 0
          if (numA !== numB) return numA - numB
          return a.isReverseHolo ? 1 : -1
        }
        case "number-desc": {
          const numA = parseInt(safeNumA.replace(/\D/g, "")) || 0
          const numB = parseInt(safeNumB.replace(/\D/g, "")) || 0
          if (numA !== numB) return numB - numA
          return a.isReverseHolo ? 1 : -1
        }
        case "alpha":
          return (a.name || "").localeCompare(b.name || "")
        case "owned": {
          const aOwned = ownedCards.has(a.id) ? 0 : 1
          const bOwned = ownedCards.has(b.id) ? 0 : 1
          if (aOwned !== bOwned) return aOwned - bOwned
          const numA = parseInt(safeNumA.replace(/\D/g, "")) || 0
          const numB = parseInt(safeNumB.replace(/\D/g, "")) || 0
          return numA - numB
        }
        case "missing": {
          const aMissing = ownedCards.has(a.id) ? 1 : 0
          const bMissing = ownedCards.has(b.id) ? 1 : 0
          if (aMissing !== bMissing) return aMissing - bMissing
          const numA = parseInt(safeNumA.replace(/\D/g, "")) || 0
          const numB = parseInt(safeNumB.replace(/\D/g, "")) || 0
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
            <p className="text-muted-foreground">Loading rat sets...</p>
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

      {/* PRICE MODAL - Clean overlay, z-index high enough so it doesn't crash underneath */}
      {priceModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border rounded-2xl shadow-2xl w-full max-w-xs mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Paid Price</h2>
              <button onClick={() => setPriceModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Track exactly what you spent on this card.
            </p>
            <div className="flex gap-2 mb-6">
              <Input 
                type="text" 
                placeholder="0.00" 
                value={priceInput} 
                onChange={e => setPriceInput(e.target.value)} 
                className="flex-1 text-lg font-semibold"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && savePrice()}
              />
              <select 
                className="bg-secondary rounded-md px-3 border border-input text-sm font-medium focus:outline-ring"
                value={currencyInput}
                onChange={e => setCurrencyInput(e.target.value as Currency)}
              >
                <option value="EUR">€ EUR</option>
                <option value="DKK">kr DKK</option>
              </select>
            </div>
            <Button className="w-full gap-2" onClick={savePrice}>
              <Check className="h-4 w-4" /> Save Price
            </Button>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h2 className="text-base font-bold text-destructive">Delete master set?</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  This will permanently remove all progress for <strong>{set?.name}</strong>. This cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
             <Button
              className="flex-1 bg-destructive hover:bg-destructive/90 text-white"
              disabled={isDeleting}
              onClick={async () => {
                setIsDeleting(true);
                try {
                  await fetch(`/api/master-sets?setId=${setId}`, { method: 'DELETE' });
                } catch (err) { console.error(err); }
                clearAll()
                import("@/lib/collection").then((mod) => {
                  mod.removeActiveSet(setId)
                  setConfirmDelete(false)
                  window.location.href = "/";
                })
              }}
            >
              {isDeleting ? <Spinner className="h-4 w-4 mr-2" /> : null}
              {isDeleting ? "Deleting..." : "Yes, delete"}
            </Button>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>Cancel</Button>
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
        <div className="mb-6 rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            <div className="flex items-center gap-4">
              {set.images?.logo && (
                <div className="relative h-16 w-16 flex-shrink-0">
                  <Image src={set.images.logo} alt={set.name || "Set Logo"} fill className="object-contain" />
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
              
              {/* SMART TOTAL BLOCK */}
              <div 
                className="text-center cursor-pointer hover:bg-secondary/40 p-2 rounded-lg transition-colors group"
                onClick={() => setDisplayCurrency(prev => prev === "EUR" ? "DKK" : "EUR")}
                title="Click to toggle EUR / DKK"
              >
                <p className="text-2xl font-bold text-primary transition-transform group-active:scale-95">
                  {displayCurrency === "EUR" ? "€" : "kr "}
                  {totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                  Total Expense <ArrowUpDown className="h-3 w-3 opacity-50 group-hover:opacity-100" />
                </p>
              </div>

              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{completionPercent}%</p>
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
                
                <Button variant="ghost" size="icon" title="Delete this master set" onClick={() => setConfirmDelete(true)}>
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
                className="pl-10 bg-card focus:outline-ring"
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
                
                {/* 1. The Clickable Card Area */}
                <div
                  onClick={() => toggleOwned(card.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && toggleOwned(card.id)}
                  className={cn(
                    "relative aspect-[2.5/3.5] rounded-lg overflow-hidden transition-all cursor-pointer bg-secondary/20",
                    "hover:scale-105 hover:z-10 hover:shadow-xl",
                    !ownedCards.has(card.id) && "opacity-40 grayscale"
                  )}
                >
                  {card.images?.small ? (
                    <Image
                      src={card.images.small}
                      alt={card.name || "Unknown Card"}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 30vw, (max-width: 1024px) 20vw, 12vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center p-2 text-center border-2 border-dashed border-muted-foreground/30">
                      <span className="text-[10px] text-muted-foreground font-medium">No Image</span>
                    </div>
                  )}
                  
                  {card.isReverseHolo && (
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent pointer-events-none" />
                  )}
                  
                  <div className={cn(
                    "absolute top-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-bold z-10",
                    ownedCards.has(card.id) ? "bg-primary text-primary-foreground" : "bg-muted/80 text-muted-foreground"
                  )}>
                    {ownedCards.has(card.id) ? "1/1" : "0/1"}
                  </div>
                  
                  <button
                    onClick={(e) => toggleWishlist(card.id, e)}
                    className={cn(
                      "absolute top-1 left-1 p-1 rounded transition-all z-10",
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
                
                {/* 2. The Info Section (Name, Number, and Coin Button) */}
                <div className="mt-2 flex items-start justify-between gap-1">
                  <div className="flex flex-col gap-px overflow-hidden min-w-0">
                    <p className="text-[10px] font-semibold leading-tight truncate">
                      {card.isReverseHolo ? (card.name || "").replace(" Reverse Holo", "") : (card.name || "Unknown")}
                    </p>
                    <p className="text-[9px] text-muted-foreground truncate">
                      #{card.number || "??"}{card.isReverseHolo ? " · Rev Holo" : ""}
                    </p>
                  </div>
                  
                  {/* The newly moved Coin Button - completely separated from the card click! */}
                  {ownedCards.has(card.id) && (
                    <button
                      onClick={(e) => openPriceModal(card.id, e)}
                      className={cn(
                        "p-1 rounded-md flex-shrink-0 transition-colors hover:scale-110",
                        cardPrices[card.id] ? "bg-yellow-500/20 text-yellow-600 hover:bg-yellow-500 hover:text-white" : "bg-secondary text-muted-foreground hover:bg-primary hover:text-white"
                      )}
                      title="Add paid price"
                    >
                      <Coins className="h-3 w-3" />
                    </button>
                  )}
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
