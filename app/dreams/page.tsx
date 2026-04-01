"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  getDreamsLists,
  getDreamsCards,
  createDreamsList,
  deleteDreamsList,
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

  useEffect(() => {
    const loaded = getDreamsLists()
    setLists(loaded)
    const counts: Record<string, { count: number; previews: DreamsCard[] }> = {}
    loaded.forEach((list) => {
      const cards = getDreamsCards(list.id)
      counts[list.id] = { count: cards.reduce((a, c) => a + c.quantity, 0), previews: cards.slice(0, 5) }
    })
    setCardCounts(counts)
  }, [])

  const handleCreate = () => {
    if (!newName.trim()) return
    const created = createDreamsList(newName, newDesc)
    setLists((prev) => [...prev, created])
    setCardCounts((prev) => ({ ...prev, [created.id]: { count: 0, previews: [] } }))
    setNewName("")
    setNewDesc("")
    setShowCreate(false)
  }

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    if (!confirm("Delete this wishlist? This cannot be undone.")) return
    deleteDreamsList(id)
    setLists((prev) => prev.filter((l) => l.id !== id))
  }

  const totalCards = Object.values(cardCounts).reduce((a, v) => a + v.count, 0)

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-5xl">

        {/* Page header */}
        <div className="mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-xs font-semibold tracking-widest uppercase text-primary">Poke Dreams</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight">My Wishlists</h1>
            <p className="mt-2 text-muted-foreground">
              {lists.length === 0
                ? "Create your first wishlist to start tracking cards you're hunting."
                : `${lists.length} list${lists.length !== 1 ? "s" : ""} · ${totalCards} card${totalCards !== 1 ? "s" : ""} total`}
            </p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="gap-2 w-fit">
            <Plus className="h-4 w-4" />
            New Wishlist
          </Button>
        </div>

        {/* Create form */}
        {showCreate && (
          <div className="mb-8 rounded-xl border bg-card p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">New Wishlist</h2>
              <button onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Name *</label>
                <Input
                  placeholder="e.g. Hidden Fates Shiny Vault, Grail Cards..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Description (optional)</label>
                <Input
                  placeholder="What are you chasing?"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                />
              </div>
              <div className="flex gap-2 pt-1">
                <Button onClick={handleCreate} disabled={!newName.trim()} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Wishlist
                </Button>
                <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {lists.length === 0 && !showCreate && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <Heart className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No wishlists yet</h2>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Create a wishlist to track cards you're hunting. Search any Pokémon card and add it.
            </p>
            <Button onClick={() => setShowCreate(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create your first wishlist
            </Button>
          </div>
        )}

        {/* Lists grid */}
        {lists.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lists.map((list) => {
              const info = cardCounts[list.id] ?? { count: 0, previews: [] }
              return (
                <Link key={list.id} href={`/dreams/${list.id}`} className="group block">
                  <div className="relative rounded-xl border bg-card overflow-hidden transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
                    {/* Card previews strip */}
                    <div className="h-28 bg-secondary/30 relative overflow-hidden flex items-center justify-center gap-1 px-3">
                      {info.previews.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <Heart className="h-8 w-8 opacity-30" />
                          <span className="text-xs">No cards yet</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5">
                          {info.previews.map((card, i) => (
                            <div
                              key={card.id}
                              className="relative rounded shadow-md overflow-hidden flex-shrink-0"
                              style={{
                                width: 52,
                                height: 72,
                                transform: `rotate(${(i - 2) * 4}deg)`,
                                zIndex: i,
                              }}
                            >
                              <Image src={card.imageSmall} alt={card.name} fill className="object-cover" sizes="52px" />
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Delete button */}
                      <button
                        onClick={(e) => handleDelete(list.id, e)}
                        className="absolute top-2 right-2 p-1.5 rounded-md bg-background/80 text-muted-foreground hover:text-destructive hover:bg-background opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-bold text-base truncate">{list.name}</h3>
                          {list.description && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">{list.description}</p>
                          )}
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                      <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3 text-primary" />
                          <span className="font-semibold text-foreground">{info.count}</span> card{info.count !== 1 ? "s" : ""}
                        </span>
                        <span>·</span>
                        <span>
                          Updated {new Date(list.updatedAt).toLocaleDateString("en-DK", { day: "numeric", month: "short" })}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}

            {/* Add new list card */}
            <button
              onClick={() => setShowCreate(true)}
              className="rounded-xl border border-dashed bg-card/50 h-[11.5rem] flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-card transition-all"
            >
              <Plus className="h-8 w-8" />
              <span className="text-sm font-medium">New Wishlist</span>
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
