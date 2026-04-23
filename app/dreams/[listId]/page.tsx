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
  supertype: string; set: { id: string; name: string }
  images: { small: string; large: string }
  marketPrice: number | null
}

export default function DreamsListPage({ params }: { params: Promise<{ listId: string }> }) {
  const resolvedParams = use(params)
  const listId = resolvedParams.listId

  const [list, setList] = useState<DreamsList | null>(null)
  const [cards, setCards] = useState<DreamsCard[]>([])
  const [isSyncing, setIsSyncing] = useState(true)
  const [hasCheckedCloud, setHasCheckedCloud] = useState(false)

  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchCard[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [addedFeedback, setAddedFeedback] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    async function initAndSync() {
      setIsSyncing(true)
      
      // 1. Initial Local Load (Instant)
      const localLists = getDreamsLists()
      const localFound = localLists.find((l) => l.id === listId)
      if (localFound) {
        setList(localFound)
        setCards(getDreamsCards(listId))
      }

      // 2. Background Sync (Merging Truth)
      try {
        const [listRes, cardRes] = await Promise.all([
          fetch('/api/dreams-lists', { cache: 'no-store' }),
          fetch(`/api/dreams-cards?listId=${listId}`, { cache: 'no-store' })
        ])

        if (listRes.ok) {
          const listData = await listRes.ok ? await listRes.json() : { lists: [] }
          const cloudLists: DreamsList[] = listData.lists || []
          
          // --- MERGE PROTECTION ---
          // Don't just overwrite! Keep local lists that are still saving to cloud.
          const currentLocal = getDreamsLists()
          const merged = [...cloudLists]
          currentLocal.forEach(localItem => {
            if (!merged.find(cloudItem => cloudItem.id === localItem.id)) {
              merged.push(localItem)
            }
          })
          saveDreamsLists(merged)
          
          const foundInMerged = merged.find(l => l.id === listId)
          if (foundInMerged) {
            setList(foundInMerged)
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
        console.error("Syncing failed", e)
      } finally {
        setIsSyncing(false)
        setHasCheckedCloud(true)
      }
    }

    if (listId) initAndSync()
  }, [listId])

  const handleSearch = async (q: string) => {
    if (q.length < 2) { setSearchResults([]); return }
    setSearchLoading(true)
    try {
      const res = await fetch(`/api/pokemon/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setSearchResults(data.cards || [])
    } catch { setSearchResults([]) }
    finally { setSearchLoading(false) }
  }

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => handleSearch(searchQuery), 500)
  }, [searchQuery])

  const handleAdd = async (card: SearchCard) => {
    const newCard = {
      id: card.id, name: card.name, number: card.number, rarity: card.rarity,
      supertype: card.supertype, setName: card.set.name, setId: card.set.id,
      imageSmall: card.images.small, imageLarge: card.images.large,
      marketPrice: card.marketPrice ?? undefined, listId
    }
    addCardToDreamsList(listId, newCard)
    setCards(getDreamsCards(listId))
    setAddedFeedback(card.id)
    setTimeout(() => setAddedFeedback(null), 1500)
    
    fetch('/api/dreams-cards', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(newCard) 
    })
  }

  const handleQuantity = (cardId: string, delta: number) => {
    const card = cards.find(c => c.id === cardId)
    if (!card) return
    const newQty = card.quantity + delta
    updateDreamsCardQuantity(listId, cardId, newQty)
    setCards(getDreamsCards(listId))
    fetch('/api/dreams-cards', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ ...card, quantity: newQty, listId }) 
    })
  }

  const handleRemove = (cardId: string) => {
    removeCardFromDreamsList(listId, cardId)
    setCards(getDreamsCards(listId))
    fetch('/api/dreams-cards', { 
        method: 'DELETE', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ listId, cardId }) 
    })
  }

  // --- RENDER LOGIC ---

  // 1. Show spinner if we haven't found the list yet and are still syncing
  if (!list && isSyncing) {
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

  // 2. Only show "Not Found" if we finished syncing and STILL don't have it
  if (!list && hasCheckedCloud) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="py-32 text-center">
          <p className="mb-4 text-lg font-medium">Wishlist not found.</p>
          <Link href="/dreams" className="text-primary hover:underline font-bold">Back to Dreams</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <Link href="/dreams" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground font-medium hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Poke Dreams
        </Link>
        
        <div className="mb-8 flex justify-between items-start flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold tracking-widest uppercase text-primary">Wishlist</span>
              {isSyncing && <Spinner className="h-3 w-3 ml-2 text-muted-foreground" />}
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{list?.name}</h1>
            {list?.description && <p className="text-muted-foreground mt-1">{list.description}</p>}
          </div>
          <div className="bg-card border rounded-lg px-4 py-2 text-center shadow-sm">
            <p className="text-2xl font-bold text-primary">€{cards.reduce((a,c) => a + (c.marketPrice||0)*c.quantity, 0).toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Estimated Value</p>
          </div>
        </div>

        {/* SEARCH SECTION */}
        <div className="mb-10 p-6 bg-card border rounded-xl shadow-sm">
          <h2 className="text-sm font-bold mb-4 uppercase text-muted-foreground tracking-tight">Add Cards to List</h2>
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-10 h-12 bg-background focus:outline-ring" placeholder="Search Pokémon name..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>

          <div className="grid gap-4 grid-cols-2 sm:grid-cols-4 lg:grid-cols-6">
            {searchResults.map(card => (
              <div key={card.id} className="relative group aspect-[2.5/3.5] rounded-lg overflow-hidden border bg-secondary/20 shadow-sm">
                <Image src={card.images.small} alt="" fill className="object-cover transition-transform group-hover:scale-105" sizes="150px" />
                <button onClick={() => handleAdd(card)} className={cn("absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity", addedFeedback === card.id && "opacity-100 bg-primary/40")}>
                  {addedFeedback === card.id ? <Check className="text-white h-8 w-8" /> : <Plus className="text-white h-8 w-8" />}
                </button>
              </div>
            ))}
          </div>
          {searchLoading && <div className="mt-4 flex justify-center"><Spinner className="h-6 w-6" /></div>}
        </div>

        {/* LIST CARDS */}
        <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {cards.map(card => (
            <div key={card.id} className="flex flex-col gap-2 group">
              <div className="relative aspect-[2.5/3.5] rounded-lg overflow-hidden shadow-md">
                <Image src={card.imageSmall} alt="" fill className="object-cover transition-transform group-hover:scale-105" sizes="200px" />
                <button onClick={() => handleRemove(card.id)} className="absolute top-2 right-2 p-1.5 bg-destructive text-white rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="px-1">
                <p className="text-[13px] font-bold truncate leading-tight">{card.name}</p>
                <p className="text-[11px] text-muted-foreground truncate mb-2">{card.setName}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 bg-secondary/50 rounded-md p-0.5 px-1">
                    <button onClick={() => handleQuantity(card.id, -1)} className="h-5 w-5 hover:bg-secondary rounded flex items-center justify-center transition-colors"><Minus className="h-3 w-3" /></button>
                    <span className="text-[11px] font-bold w-3 text-center">{card.quantity}</span>
                    <button onClick={() => handleQuantity(card.id, 1)} className="h-5 w-5 hover:bg-secondary rounded flex items-center justify-center transition-colors"><Plus className="h-3 w-3" /></button>
                  </div>
                  <p className="text-[13px] font-bold text-primary">€{(card.marketPrice || 0).toFixed(2)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {cards.length === 0 && hasCheckedCloud && (
          <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-2xl border-muted-foreground/10 bg-muted/5">
            <Heart className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <h2 className="text-lg font-semibold">Wishlist Empty</h2>
            <p className="text-sm text-muted-foreground max-w-xs">Search for a card above to start your hunt!</p>
          </div>
        )}
      </main>
    </div>
  )
}
