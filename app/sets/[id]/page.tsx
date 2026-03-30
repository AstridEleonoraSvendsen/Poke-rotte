"use client"

import { useState, use } from "react"
import Link from "next/link"
import { Header } from "@/components/header"
import { PokemonCard } from "@/components/pokemon-card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Search, Filter, Grid3X3, List } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Sample card data for Primal Clash (XY5)
const SAMPLE_CARDS = [
  { id: "xy5-1", name: "Weedle", number: "001/164", rarity: "Common" },
  { id: "xy5-2", name: "Kakuna", number: "002/164", rarity: "Uncommon" },
  { id: "xy5-3", name: "Beedrill", number: "003/164", rarity: "Rare" },
  { id: "xy5-4", name: "Shroomish", number: "004/164", rarity: "Common" },
  { id: "xy5-5", name: "Breloom", number: "005/164", rarity: "Uncommon" },
  { id: "xy5-6", name: "Treecko", number: "006/164", rarity: "Common" },
  { id: "xy5-7", name: "Grovyle", number: "007/164", rarity: "Uncommon" },
  { id: "xy5-8", name: "Sceptile", number: "008/164", rarity: "Rare Holo" },
  { id: "xy5-9", name: "Lotad", number: "009/164", rarity: "Common" },
  { id: "xy5-10", name: "Lombre", number: "010/164", rarity: "Uncommon" },
  { id: "xy5-11", name: "Ludicolo", number: "011/164", rarity: "Rare" },
  { id: "xy5-12", name: "Seedot", number: "012/164", rarity: "Common" },
  { id: "xy5-13", name: "Nuzleaf", number: "013/164", rarity: "Uncommon" },
  { id: "xy5-14", name: "Shiftry", number: "014/164", rarity: "Rare" },
  { id: "xy5-15", name: "Tropius", number: "015/164", rarity: "Uncommon" },
  { id: "xy5-16", name: "Turtwig", number: "016/164", rarity: "Common" },
  { id: "xy5-17", name: "Grotle", number: "017/164", rarity: "Uncommon" },
  { id: "xy5-18", name: "Torterra", number: "018/164", rarity: "Rare Holo" },
  { id: "xy5-19", name: "Cherubi", number: "019/164", rarity: "Common" },
  { id: "xy5-20", name: "Cherrim", number: "020/164", rarity: "Uncommon" },
  { id: "xy5-21", name: "Tangrowth", number: "021/164", rarity: "Rare" },
  { id: "xy5-22", name: "Snivy", number: "022/164", rarity: "Common" },
  { id: "xy5-23", name: "Servine", number: "023/164", rarity: "Uncommon" },
  { id: "xy5-24", name: "Serperior", number: "024/164", rarity: "Rare Holo" },
  { id: "xy5-85", name: "Kyogre EX", number: "085/164", rarity: "Rare Ultra" },
  { id: "xy5-86", name: "Primal Kyogre EX", number: "086/164", rarity: "Rare Ultra" },
  { id: "xy5-149", name: "Aggron EX", number: "149/164", rarity: "Secret Rare" },
  { id: "xy5-150", name: "M Aggron EX", number: "150/164", rarity: "Secret Rare" },
]

// Simulate owned cards
const INITIAL_OWNED = ["xy5-1", "xy5-2", "xy5-6", "xy5-8", "xy5-9", "xy5-16", "xy5-18", "xy5-22"]

export default function SetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [ownedCards, setOwnedCards] = useState<Set<string>>(new Set(INITIAL_OWNED))
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [filterMode, setFilterMode] = useState<"all" | "owned" | "missing">("all")

  const toggleOwned = (cardId: string) => {
    setOwnedCards((prev) => {
      const next = new Set(prev)
      if (next.has(cardId)) {
        next.delete(cardId)
      } else {
        next.add(cardId)
      }
      return next
    })
  }

  const filteredCards = SAMPLE_CARDS.filter((card) => {
    const matchesSearch =
      card.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.number.includes(searchQuery)
    
    const matchesFilter =
      filterMode === "all" ||
      (filterMode === "owned" && ownedCards.has(card.id)) ||
      (filterMode === "missing" && !ownedCards.has(card.id))

    return matchesSearch && matchesFilter
  })

  const progress = Math.round((ownedCards.size / SAMPLE_CARDS.length) * 100)

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Back Link */}
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Sets
        </Link>

        {/* Set Header */}
        <div className="mb-8">
          <p className="text-sm text-muted-foreground mb-1">XY Series</p>
          <h1 className="text-3xl font-bold tracking-tight">Primal Clash</h1>
          <p className="mt-2 text-muted-foreground">
            Released February 2015 | {SAMPLE_CARDS.length} cards
          </p>
        </div>

        {/* Progress Section */}
        <div className="mb-8 rounded-lg border bg-card p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Collection Progress</span>
                <span className="text-sm font-bold text-primary">{progress}%</span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>
            <div className="flex gap-6 sm:pl-8">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{ownedCards.size}</p>
                <p className="text-xs text-muted-foreground">Owned</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{SAMPLE_CARDS.length - ownedCards.size}</p>
                <p className="text-xs text-muted-foreground">Missing</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{SAMPLE_CARDS.length}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search cards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  {filterMode === "all" ? "All Cards" : filterMode === "owned" ? "Owned" : "Missing"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setFilterMode("all")}>
                  All Cards
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterMode("owned")}>
                  Owned
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterMode("missing")}>
                  Missing
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <div className="flex rounded-md border">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="sm"
                className="rounded-r-none"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                className="rounded-l-none"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {filteredCards.map((card) => (
            <PokemonCard
              key={card.id}
              {...card}
              owned={ownedCards.has(card.id)}
              onToggleOwned={toggleOwned}
            />
          ))}
        </div>

        {filteredCards.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">No cards found matching your criteria</p>
          </div>
        )}
      </main>
    </div>
  )
}
