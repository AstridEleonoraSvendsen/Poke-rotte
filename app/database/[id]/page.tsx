"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import Image from "next/image"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { ArrowLeft, Search, Plus, LayoutGrid, List } from "lucide-react"
import { cn } from "@/lib/utils"

interface PokemonCard {
  id: string
  name: string
  number: string
  rarity: string
  isReverseHolo?: boolean
  images: { small: string; large: string }
}

interface PokemonSet {
  id: string
  name: string
  series: string
  printedTotal: number
  total: number
  releaseDate: string
  images: { symbol: string; logo: string }
}

interface SetStats {
  totalCards: number
  regularCards: number
  secretCards: number
}

function getRarityColor(rarity: string) {
  const r = rarity?.toLowerCase() || ""
  if (r.includes("secret") || r.includes("hyper")) return "bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500"
  if (r.includes("ultra") || r.includes("illustration")) return "bg-yellow-500"
  if (r.includes("holo") || r.includes("rare")) return "bg-cyan-400"
  if (r.includes("uncommon")) return "bg-green-500"
  return "bg-muted-foreground"
}

function formatDate(d: string) {
  try { return new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) }
  catch { return d }
}

export default function DatabaseSetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [set, setSet] = useState<PokemonSet | null>(null)
  const [cards, setCards] = useState<PokemonCard[]>([])
  const [stats, setStats] = useState<SetStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/pokemon/sets/${id}`)
        if (!res.ok) throw new Error("Failed to fetch set data")
        const data = await res.json()
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
  }, [id])

  const filteredCards = cards.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.number.includes(searchQuery)
  )

  if (loading) return (
    <div className="min-h-screen bg-background"><Header />
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="h-8 w-8" />
          <p className="text-muted-foreground">Loading set data...</p>
        </div>
      </div>
    </div>
  )

  if (error || !set) return (
    <div className="min-h-screen bg-background"><Header />
      <div className="container mx-auto px-4 py-24 text-center">
        <p className="text-destructive">{error || "Set not found"}</p>
        <Link href="/database" className="mt-4 inline-block text-primary hover:underline">Back to Database</Link>
      </div>
    </div>
  )

  const regularCards = stats?.regularCards ?? set.printedTotal
  const secretCards  = stats?.secretCards ?? (set.total - set.printedTotal)
  const reverseHolos = cards.filter(c => c.isReverseHolo).length
  const totalMaster  = cards.length

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-7xl">

        <Link href="/database" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />Back to Database
        </Link>

        {/* ── Set Header ─────────────────────────────────────────────────── */}
        <div className="mb-8 rounded-xl border bg-card p-6">
          <div className="flex flex-col lg:flex-row lg:items-start gap-6 justify-between">
            {/* Logo + name */}
            <div className="flex items-start gap-4">
              {set.images?.logo && (
                <div className="relative h-16 w-20 flex-shrink-0">
                  <Image src={set.images.logo} alt={set.name} fill className="object-contain" />
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">{set.series}</p>
                <h1 className="text-3xl font-bold tracking-tight">{set.name}</h1>
                <p className="mt-1 text-sm text-muted-foreground">Released {formatDate(set.releaseDate)}</p>
              </div>
            </div>

            {/* Stats row — pokedata style */}
            <div className="flex flex-wrap gap-3">
              <div className="rounded-lg border bg-background px-4 py-2.5 text-center min-w-[80px]">
                <p className="text-xl font-bold">{totalMaster}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">Total</p>
              </div>
              <div className="rounded-lg border bg-background px-4 py-2.5 text-center min-w-[80px]">
                <p className="text-xl font-bold">{regularCards}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">Cards</p>
              </div>
              <div className="rounded-lg border bg-background px-4 py-2.5 text-center min-w-[80px]">
                <p className="text-xl font-bold">{reverseHolos}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">Rev. Holo</p>
              </div>
              {secretCards > 0 && (
                <div className="rounded-lg border bg-background px-4 py-2.5 text-center min-w-[80px]">
                  <p className="text-xl font-bold">{secretCards}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">Secret</p>
                </div>
              )}
              <div className="flex items-center ml-2">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />Add to Master Sets
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Toolbar ─────────────────────────────────────────────────────── */}
        <div className="mb-6 flex gap-3 items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search cards..." value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)} className="pl-10 bg-card" />
          </div>
          <div className="flex rounded-lg border bg-card p-1 gap-0.5">
            <button onClick={() => setViewMode("grid")}
              className={cn("p-2 rounded-md transition-colors", viewMode === "grid" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground")}>
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button onClick={() => setViewMode("list")}
              className={cn("p-2 rounded-md transition-colors", viewMode === "list" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground")}>
              <List className="h-4 w-4" />
            </button>
          </div>
          <p className="text-sm text-muted-foreground whitespace-nowrap">
            {filteredCards.length} {filteredCards.length === 1 ? "card" : "cards"}
          </p>
        </div>

        {/* ── Grid view ───────────────────────────────────────────────────── */}
        {viewMode === "grid" ? (
          <div className="grid gap-x-3 gap-y-5 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
            {filteredCards.map(card => (
              <div key={card.id} className="group flex flex-col">
                <div className="relative aspect-[2.5/3.5] rounded-lg overflow-hidden shadow-md hover:scale-105 hover:z-10 hover:shadow-xl transition-all cursor-pointer">
                  <Image src={card.images.small} alt={card.name} fill
                    className="object-cover" sizes="(max-width: 640px) 30vw, (max-width: 1024px) 20vw, 12vw" />
                  {card.isReverseHolo && (
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent pointer-events-none" />
                  )}
                </div>
                {/* Card name below — pokedata style */}
                <div className="mt-1.5 flex flex-col gap-px">
                  <p className="text-[10px] font-semibold leading-tight truncate">
                    {card.isReverseHolo ? card.name.replace(" Reverse Holo", "") : card.name}
                  </p>
                  <p className="text-[9px] text-muted-foreground">
                    #{card.number}{card.isReverseHolo ? " · RH" : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ── List view ─────────────────────────────────────────────────── */
          <div className="rounded-xl border bg-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-secondary/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Card</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">#</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Rarity</th>
                </tr>
              </thead>
              <tbody>
                {filteredCards.map(card => (
                  <tr key={card.id} className="border-b last:border-0 hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-2">
                      <div className="relative h-14 w-10 rounded overflow-hidden shadow">
                        <Image src={card.images.small} alt={card.name} fill className="object-cover" sizes="40px" />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{card.number}</td>
                    <td className="px-4 py-3 font-medium text-sm">{card.name}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={cn("h-2 w-2 rounded-full flex-shrink-0", getRarityColor(card.rarity))} />
                        <span className="text-sm">{card.rarity || "Unknown"}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filteredCards.length === 0 && (
          <div className="py-12 text-center"><p className="text-muted-foreground">No cards found</p></div>
        )}
      </main>
    </div>
  )
}
