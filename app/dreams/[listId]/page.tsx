"use client"

import { useState, useEffect, use, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import {
  getDreamsLists, getDreamsCards, addCardToDreamsList,
  removeCardFromDreamsList, updateDreamsCardQuantity, updateDreamsList,
  saveDreamsCards, saveDreamsLists,
  type DreamsList, type DreamsCard,
} from "@/lib/collection"
import {
  ArrowLeft, Search, Plus, Minus, X, Heart, Sparkles,
  Pencil, Check, LayoutGrid, List, ChevronDown, SlidersHorizontal,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SearchCard {
  id: string; name: string; number: string; rarity: string
  supertype: string; subtypes: string[]
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
  const resolvedParams = use(params)
  const listId = resolvedParams.listId

  const [list, setList] = useState<DreamsList | null>(null)
  const [cards, setCards] = useState<DreamsCard[]>([])
  const [isSyncing, setIsSyncing] = useState(true)
  const [hasCheckedCloud, setHasCheckedCloud] = useState(false)

  // Search States
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

  // Wishlist display
  const [filterQuery, setFilterQuery] = useState("")
  const [wishlistSort, setWishlistSort] = useState<WishlistSort>("added")

  // Edit modal
  const [editOpen, setEditOpen] = useState(false)
  const [editName, setEditName] = useState("")
  const [editDesc, setEditDesc] = useState("")
  const [addedFeedback, setAddedFeedback] = useState<string | null>(null)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sortRef = useRef<HTMLDivElement>(null)

  // --- THE PATIENT CLOUD SYNC ---
  useEffect(() => {
    async function syncEverything() {
      setIsSyncing(true)
      
      // 1. Check Local Storage first for speed
      const localLists = getDreamsLists()
      const localFound = localLists.find((l) => l.id === listId)
      if (localFound) {
        setList(localFound)
        setEditName(localFound.name)
        setEditDesc(localFound.description || "")
        setCards(getDreamsCards(listId))
      }

      // 2. Fetch Fresh Data from Cloud (The Truth)
      try {
        const [listRes, cardRes] = await Promise.all([
          fetch('/api/dreams-lists', { cache: 'no-store' }),
          fetch(`/api/dreams-cards?listId=${listId}`, { cache: 'no-store' })
        ])

        if (listRes.ok) {
          const listData = await listRes.json()
          const cloudLists: DreamsList[] = listData.lists || []
          saveDreamsLists(cloudLists)
          
          const currentList = cloudLists.find(l => l.id === listId)
          if (currentList) {
            setList(currentList)
            setEditName(currentList.name)
            setEditDesc(currentList.description || "")
          }
        }

        if (cardRes.ok) {
          const cardData = await cardRes.json()
          if (cardData.cards) {
            setCards(cardData.cards)
            saveDreamsCards(listId, cardData.cards)
          }
        }
      } catch (e) {
        console.error("Sync error:", e)
      } finally {
        setIsSyncing(false)
        setHasCheckedCloud(true)
      }
    }

    syncEverything()
  }, [listId])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const runSearch = async (q: string, sort: SortOption, page: number, append = false) => {
    if (q.trim().length < 2) { setSearchResults([]); setSearchTotal(0); setHasSearched(false); return }
    setSearchLoading(true); setHasSearched(true)
    try {
      const res = await fetch(`/api/pokemon/search?q=${encodeURIComponent(q.trim())}&sort=${sort}&page=${page}`)
      const data = await res.json()
      setSearchResults(prev => append ? [...prev, ...(data.cards || [])] : (data.cards || []))
      setSearchTotal(data.total ?? 0)
      setSearchPage(page)
      setSearchHasMore(data.hasMore ?? false)
    } catch { setSearchResults([]) }
    finally { setSearchLoading(false) }
  }

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => runSearch(searchQuery, searchSort, 1), 450)
  }, [searchQuery, searchSort])

  const loadMore = () => runSearch(searchQuery, searchSort, searchPage + 1, true)

  const handleAddCard = async (card: SearchCard) => {
    const newCardData = {
        id: card.id, name: card.name, number: card.number, rarity: card.rarity,
        supertype: card.supertype, setName: card.set.name, setId: card.set.id,
        imageSmall: card.images.small, imageLarge: card.images.large,
        marketPrice: card.marketPrice ?? undefined, listId
    }
    addCardToDreamsList(listId, newCardData)
    setCards(getDreamsCards(listId))
    setAddedFeedback(card.id)
    setTimeout(() => setAddedFeedback(null), 1500)
    fetch('/api/dreams-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCardData)
    }).catch(e => console.error(e))
  }

  const handleRemove = async (cardId: string) => {
    removeCardFromDreamsList(listId, cardId)
    setCards(getDreamsCards(listId))
    fetch('/api/dreams-cards', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listId, cardId })
    }).catch(e => console.error(e))
  }

  const handleQuantity = async (cardId: string, delta: number) => {
    const card = cards.find((c) => c.id === cardId)
    if (!card) return
    const newQty = card.quantity + delta
    updateDreamsCardQuantity(listId, cardId, newQty)
    setCards(getDreamsCards(listId))
    fetch('/api/dreams-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...card, quantity: newQty, listId })
    }).catch(e => console.error(e))
  }

  const saveEdit = async () => {
    if (!editName.trim() || !list) return
    updateDreamsList(listId, { name: editName.trim(), description: editDesc.trim() })
    setList(prev => prev ? { ...prev, name: editName.trim(), description: editDesc.trim() } : prev)
    setEditOpen(false)
    fetch('/api/dreams-lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: listId, name: editName.trim(), description: editDesc.trim() })
    }).catch(e => console.error(e))
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
        case "rarity": return (a.rarity || "").localeCompare(b.rarity || "")
        default:       return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
      }
    })

  const totalCards = cards.reduce((a, c) => a + c.quantity, 0)
  const totalPrice = cards.reduce((a, c) => a + (c.marketPrice ?? 0) * c.quantity, 0)

  // --- RENDER LOGIC ---

  // 1. Loading State
  if (!list && !hasCheckedCloud) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <Spinner className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground font-medium">Finding your rat list...</p>
        </div>
      </div>
    )
  }

  // 2. Not Found State
  if (!list && hasCheckedCloud) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-24 text-center">
          <p className="text-muted-foreground font-medium text-lg">Wishlist not found.</p>
          <Link href="/dreams" className="mt-4 inline-block text-primary hover:underline font-medium">
            Back to Poke Dreams
          </Link>
        </div>
      </div>
    )
  }

  // 3. Main Page
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Edit modal */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">Edit Wishlist</h2>
              <button onClick={() => setEditOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block font-medium">Name</label>
                <Input value={editName} onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && saveEdit()} autoFocus />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block font-medium">Description</label>
                <Input value={editDesc} onChange={e => setEditDesc(e.target.value)}
                  placeholder="What are you chasing?" />
              </div>
              <div className="flex gap-2 pt-1">
                <Button onClick={saveEdit} disabled={!editName.trim()} className="gap-2 flex-1">
                  <Check className="h-4 w-4" />Save changes
                </Button>
                <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <Link href="/dreams" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
          <ArrowLeft className="h-4 w-4" />Back to Poke Dreams
        </Link>

        {/* Page header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-start gap-4 justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold tracking-widest uppercase text-primary">Wishlist</span>
              {isSyncing && <Spinner className="h-3 w-3 animate-spin text-muted-foreground ml-2" />}
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">{list?.name}</h1>
              <button onClick={() => setEditOpen(true)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Edit wishlist">
                <Pencil className="h-4 w-4" />
              </button>
            </div>
            {list?.description && <p className="text-muted-foreground mt-1">{list.description}</p>}
          </div>

          <div className="flex gap-2 flex-shrink-0 flex-wrap">
            <div className="rounded-lg border bg-card px-4 py-2 text-center min-w-[72px]">
              <p className="text-2xl font-bold">{totalCards}</p>
              <p className="text-xs text-muted-foreground">Cards</p>
            </div>
            <div className="rounded-lg border bg-card px-4 py-2 text-center min-w-[72px]">
              <p className="text-2xl font-bold">{cards.length}</p>
              <p className="text-xs text-muted-foreground">Unique</p>
            </div>
            <div className="rounded-lg border bg-card px-4 py-2 text-center min-w-[96px]">
              <p className="text-2xl font-bold text-primary">
                €{totalPrice.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">Total raw</p>
            </div>
          </div>
        </div>

        {/* SEARCH SECTION */}
        <div className="mb-10 rounded-xl border bg-card p-5">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Find a card to add</h2>
          <div className="flex gap-2 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-
