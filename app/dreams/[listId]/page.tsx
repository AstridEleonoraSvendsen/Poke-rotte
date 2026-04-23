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
  const [isLoading, setIsLoading] = useState(true)
  const [hasCheckedCloud, setHasCheckedCloud] = useState(false)

  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchCard[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [addedFeedback, setAddedFeedback] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    async function initAndSync() {
      // 1. Initial Local Load
      const localLists = getDreamsLists()
      const found = localLists.find(l => l.id === listId)
      if (found) {
        setList(found)
        setCards(getDreamsCards(listId))
        setIsLoading(false)
      }

      // 2. Cloud Sync
      try {
        const [listRes, cardRes] = await Promise.all([
          fetch('/api/dreams-lists', { cache: 'no-store' }),
          fetch(`/api/dreams-cards?listId=${listId}`, { cache: 'no-store' })
        ])

        if (listRes.ok) {
          const data = await listRes.json()
          const cloudLists: DreamsList[] = data.lists || []
          const cloudFound = cloudLists.find(l => l.id === listId)
          if (cloudFound) {
            setList(cloudFound)
            // Update local storage so we have it next time
            const merged = [...cloudLists]
            localLists.forEach(l => { if(!merged.find(c => c.id === l.id)) merged.push(l) })
            saveDreamsLists(merged)
          }
        }

        if (cardRes.ok) {
          const data = await cardRes.json()
          if (data.cards) {
            setCards(data.cards)
            saveDreamsCards(listId, data.cards)
          }
        }
      } catch (e) { console.error(e) }
      finally {
        setIsLoading(false)
        setHasCheckedCloud(true)
      }
    }
    initAndSync()
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
    fetch('/api/dreams-cards', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newCard) })
  }

  const handleQuantity = (cardId: string, delta: number) => {
    const card = cards.find(c => c.id === cardId)
    if (!card) return
    const newQty = card.quantity + delta
    updateDreamsCardQuantity(listId, cardId, newQty)
    setCards(getDreamsCards(listId))
    fetch('/api/dreams-cards', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...card, quantity: newQty, listId }) })
  }

  const handleRemove = (cardId: string) => {
    removeCardFromDreamsList(listId, cardId)
    setCards(getDreamsCards(listId))
    fetch('/api/dreams-cards', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ listId, cardId }) })
  }

  if (isLoading && !list) {
    return (
      <div className="min-h-screen bg-background">
        <Header /><div className="flex flex-col items-center justify-center py-32"><Spinner className="h-8 w-8 mb-4" /><p>Loading your rat list...</p></div>
      </div>
    )
  }

  if (!list && hasCheckedCloud) {
    return (
      <div className="min-h-screen bg-background">
        <Header /><div className="py-32 text-center"><p className="mb-4">Wishlist not found.</p><Link href="/dreams" className="text-primary hover:underline">Back to Dreams</Link></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <Link href="/dreams" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" /> Back</Link>
        
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">{list?.name}</h1>
            <p className="text-muted-foreground">{list?.description}</p>
          </div>
          <div className="bg-card border rounded-lg px-4 py-2 text-center">
            <p className="text-2xl font-bold text-primary">€{cards.reduce((a,c) => a + (c.marketPrice||0)*c.quantity, 0).toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Total Value</p>
          </div>
        </div>

        <div className="mb-10 p-6 bg-card border rounded-xl">
          <h2 className="text-sm font-bold mb-4 uppercase text-muted-foreground">Add Cards</h2>
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-10 h-12" placeholder="Search Pokemon..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>

          <div className="grid gap-4 grid-cols-2 sm:grid-cols-4 lg:grid-cols-6">
            {searchResults.map(card => (
              <div key={card.id} className="relative group aspect-[2.5/3.5] rounded-lg overflow-hidden border">
                <Image src={card.images.small} alt="" fill className="object-cover" sizes="150px" />
                <button onClick={() => handleAdd(card)} className={cn("absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity", addedFeedback === card.id && "opacity-100 bg-primary/40")}>
                  {addedFeedback === card.id ? <Check className="text-white" /> : <Plus className="text-white" />}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {cards.map(card => (
            <div key={card.id} className="flex flex-col gap-2">
              <div className="relative aspect-[2.5/3.5] rounded-lg overflow-hidden shadow-md group">
                <Image src={card.imageSmall} alt="" fill className="object-cover" />
                <button onClick={() => handleRemove(card.id)} className="absolute top-2 right-2 p-1 bg-destructive rounded text-white opacity-0 group-hover:opacity-100"><X className="h-3 w-3" /></button>
              </div>
              <div className="px-1">
                <p className="text-xs font-bold truncate">{card.name}</p>
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleQuantity(card.id, -1)} className="h-5 w-5 bg-secondary rounded flex items-center justify-center"><Minus className="h-3 w-3" /></button>
                    <span className="text-xs font-bold">{card.quantity}</span>
                    <button onClick={() => handleQuantity(card.id, 1)} className="h-5 w-5 bg-secondary rounded flex items-center justify-center"><Plus className="h-3 w-3" /></button>
                  </div>
                  <p className="text-xs font-bold text-primary">€{(card.marketPrice || 0).toFixed(2)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
