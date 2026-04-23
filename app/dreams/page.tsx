"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import {
  getDreamsLists,
  getDreamsCards,
  createDreamsList,
  deleteDreamsList,
  saveDreamsLists,
  saveDreamsCards,
  type DreamsList,
  type DreamsCard,
} from "@/lib/collection"
import { Plus, Sparkles, Heart, Trash2, ChevronRight, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"

export default function DreamsPage() {
  const [lists, setLists] = useState<DreamsList[]>([])
  const [cardCounts, setCardCounts] = useState<Record<string, { count: number; previews: DreamsCard[] }>>({})
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState("")
  const [newDesc, setNewDesc] = useState("")
  const [isSyncing, setIsSyncing] = useState(true)

  useEffect(() => {
    // 1. Load local data immediately
    const localLists = getDreamsLists()
    setLists(localLists)
    
    const counts: Record<string, { count: number; previews: DreamsCard[] }> = {}
    localLists.forEach((list) => {
      const cards = getDreamsCards(list.id)
      counts[list.id] = { count: cards.reduce((a, c) => a + c.quantity, 0), previews: cards.slice(0, 5) }
    })
    setCardCounts(counts)

    // 2. Background Sync (Merging, not overwriting!)
    async function syncWithCloud() {
      try {
        const res = await fetch('/api/dreams-lists', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          const cloudLists: DreamsList[] = data.lists || []

          // MERGE LOGIC: Keep anything local that isn't in the cloud yet
          setLists(prev => {
            const merged = [...cloudLists];
            prev.forEach(localItem => {
              if (!merged.find(cloudItem => cloudItem.id === localItem.id)) {
                merged.push(localItem);
              }
            });
            const final = merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            saveDreamsLists(final); // Save the merged result
            return final;
          });

          // Sync card counts for all lists
          const cloudCounts: Record<string, { count: number; previews: DreamsCard[] }> = {}
          await Promise.all(cloudLists.map(async (list) => {
            const cardRes = await fetch(`/api/dreams-cards?listId=${list.id}`, { cache: 'no-store' })
            if (cardRes.ok) {
              const cardData = await cardRes.json()
              const cards: DreamsCard[] = cardData.cards || []
              saveDreamsCards(list.id, cards)
              cloudCounts[list.id] = { 
                count: cards.reduce((a, c) => a + c.quantity, 0), 
                previews: cards.slice(0, 5) 
              }
            }
          }))
          setCardCounts(prev => ({ ...prev, ...cloudCounts }))
        }
      } catch (err) {
        console.error("Sync failed:", err)
      } finally {
        setIsSyncing(false)
      }
    }
    syncWithCloud()
  }, [])

  const handleCreate = async () => {
    if (!newName.trim()) return
    const created = createDreamsList(newName, newDesc)
    setLists((prev) => [created, ...prev])
    setCardCounts((prev) => ({ ...prev, [created.id]: { count: 0, previews: [] } }))
    setNewName("")
    setNewDesc("")
    setShowCreate(false)

    try {
      await fetch('/api/dreams-lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: created.id, name: created.name, description: created.description })
      })
    } catch (err) { console.error(err) }
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    if (!confirm("Delete this wishlist?")) return
    deleteDreamsList(id)
    setLists((prev) => prev.filter((l) => l.id !== id))
    try {
      await fetch('/api/dreams-lists', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
    } catch (err) { console.error(err) }
  }

  const totalCards = Object.values(cardCounts).reduce((a, v) => a + v.count, 0)

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-xs font-semibold tracking-widest uppercase text-primary">Poke Dreams</span>
              {isSyncing && <Spinner className="h-3 w-3 ml-2" />}
            </div>
            <h1 className="text-4xl font-bold tracking-tight">My Wishlists</h1>
            <p className="mt-2 text-muted-foreground">
              {lists.length === 0 ? "Create a wishlist to start." : `${lists.length} lists · ${totalCards} cards`}
            </p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="h-4 w-4" /> New Wishlist
          </Button>
        </div>

        {showCreate && (
          <div className="mb-8 rounded-xl border bg-card p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">New Wishlist</h2>
              <button onClick={() => setShowCreate(false)}><X className="h-5 w-5" /></button>
            </div>
            <div className="flex flex-col gap-3">
              <Input placeholder="Name" value={newName} onChange={e => setNewName(e.target.value)} />
              <Input placeholder="Description" value={newDesc} onChange={e => setNewDesc(e.target.value)} />
              <div className="flex gap-2">
                <Button onClick={handleCreate} disabled={!newName.trim()}>Create</Button>
                <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lists.map((list) => {
            const info = cardCounts[list.id] ?? { count: 0, previews: [] }
            return (
              <Link key={list.id} href={`/dreams/${list.id}`} className="group block">
                <div className="relative rounded-xl border bg-card overflow-hidden transition-all hover:border-primary/50 hover:shadow-lg">
                  <div className="h-28 bg-secondary/30 relative flex items-center justify-center gap-1">
                    {info.previews.length === 0 ? <Heart className="h-8 w-8 opacity-20" /> : 
                      info.previews.map((card, i) => (
                        <div key={card.id} className="relative rounded shadow-md" style={{ width: 45, height: 63, transform: `rotate(${(i-2)*5}deg)`, marginLeft: i > 0 ? -15 : 0 }}>
                          <Image src={card.imageSmall} alt="" fill className="object-cover" sizes="45px" />
                        </div>
                      ))
                    }
                    <button onClick={(e) => handleDelete(list.id, e)} className="absolute top-2 right-2 p-1.5 rounded-md bg-background/80 opacity-0 group-hover:opacity-100"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold truncate">{list.name}</h3>
                    <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                      <span>{info.count} cards</span>
                      <span>{new Date(list.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </main>
    </div>
  )
}
