"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { ArrowLeft, Search, Plus, Grid3X3, List, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner" // Ensure sonner is installed

interface PokemonCard {
  id: string
  name: string
  number: string
  rarity: string
  images: {
    small: string
    large: string
  }
  types?: string[]
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

function getRarityColor(rarity: string) {
  const r = rarity?.toLowerCase() || ""
  if (r.includes("secret") || r.includes("hyper")) return "bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500"
  if (r.includes("ultra") || r.includes("illustration")) return "bg-yellow-500"
  if (r.includes("holo") || r.includes("rare")) return "bg-cyan-400"
  if (r.includes("uncommon")) return "bg-green-500"
  return "bg-muted-foreground"
}

export default function DatabaseSetPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [set, setSet] = useState<PokemonSet | null>(null)
  const [cards, setCards] = useState<PokemonCard[]>([])
  const [stats, setStats] = useState<SetStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  const [isMasterSet, setIsMasterSet] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(`/api/pokemon/sets/${resolvedParams.id}`)
        if (!response.ok) throw new Error("Failed to fetch set data")
        const data = await response.json()
        setSet(data.set)
        setCards(data.cards)
        setStats(data.stats)

        const masterRes = await fetch('/api/master-sets', { cache: 'no-store' })
        if (masterRes.ok) {
          const masterData = await masterRes.json()
          if (masterData.masterSets?.includes(resolvedParams.id)) {
            setIsMasterSet(true)
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [resolvedParams.id])

  const handleAddToMasterSet = async () => {
    if (isMasterSet) {
        // If already a master set, navigate to the collection view
        router.push(`/sets/${resolvedParams.id}`);
        return;
    }
    
    setIsSaving(true)
    try {
      const res = await fetch('/api/master-sets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setId: resolvedParams.id })
      })

      if (res.ok) {
        setIsMasterSet(true)
        toast.success(`${set?.name || "Set"} added to Master Sets!`)
        // Optionally redirect immediately:
        // router.push(`/sets/${resolvedParams.id}`)
      } else {
        toast.error("Failed to add to master sets")
      }
    } catch (err) {
      console.error("Error saving master set:", err)
      toast.error("An error occurred while saving.")
    } finally {
      setIsSaving(false)
    }
  }

  const filteredCards = cards.filter((card) =>
    card.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    card.number.includes(searchQuery)
  )

if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-32">
          <div className="flex flex-col items-center gap-4">
            <PokeballSpinner className="h-14 w-14 text-foreground shadow-xl drop-shadow-md" />
            <p className="text-muted-foreground font-medium tracking-wide">Loading rat data from the shadows...</p>
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
          <Link href="/database" className="mt-4 inline-block text-primary hover:underline">
            Back to Database
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <Link
          href="/database"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Database
        </Link>

        <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between border-b pb-8">
          <div className="flex items-start gap-4">
            {set.images?.logo && (
              <div className="relative h-20 w-20 flex-shrink-0 bg-secondary/30 rounded-xl p-2 border">
                <Image src={set.images.logo} alt={set.name} fill className="object-contain p-2" />
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-primary mb-1 uppercase tracking-wider">{set.series}</p>
              <h1 className="text-3xl font-bold tracking-tight mb-4">{set.name}</h1>
              
              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground text-xs uppercase tracking-wider">Release Date</span>
                  <span className="font-semibold">{formatDate(set.releaseDate)}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground text-xs uppercase tracking-wider">Total Cards</span>
                  <span className="font-semibold">{stats?.totalCards || cards.length}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground text-xs uppercase tracking-wider">Regular Set</span>
                  <span className="font-semibold">{stats?.regularCards || set.printedTotal}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground text-xs uppercase tracking-wider">Secret Rares</span>
                  <span className="font-semibold">{stats?.secretCards || 0}</span>
                </div>
              </div>
            </div>
          </div>
          
          <Button 
            className="gap-2 w-fit shrink-0 mt-4 sm:mt-0 transition-all duration-300"
            onClick={handleAddToMasterSet}
            disabled={isSaving}
            variant={isMasterSet ? "secondary" : "default"}
          >
            {isSaving ? (
              <Spinner className="h-4 w-4" />
            ) : isMasterSet ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {isSaving ? "Saving..." : isMasterSet ? "View Collection" : "Add to Master Sets"}
          </Button>
        </div>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search cards in this set..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex rounded-md border bg-secondary/50 p-1 w-fit">
            <Button
              variant="ghost"
              size="sm"
              className={cn("px-3 rounded-sm transition-colors", viewMode === "grid" ? "bg-background shadow-sm" : "hover:bg-transparent text-muted-foreground")}
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="h-4 w-4 mr-2" />
              Grid
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn("px-3 rounded-sm transition-colors", viewMode === "list" ? "bg-background shadow-sm" : "hover:bg-transparent text-muted-foreground")}
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4 mr-2" />
              List
            </Button>
          </div>
        </div>

        {viewMode === "grid" ? (
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {filteredCards.map((card) => (
              <div key={card.id} className="group flex flex-col hover:opacity-90 transition-opacity cursor-pointer">
                <div className="relative aspect-[2.5/3.5] rounded-lg overflow-hidden shadow-sm border bg-secondary/20 group-hover:shadow-xl transition-all">
                  <Image src={card.images.small} alt={card.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 16vw" />
                </div>
                <div className="mt-2 flex flex-col gap-0.5 px-1">
                  <p className="text-[12px] font-bold truncate">{card.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{card.number} · {card.rarity || "Unknown"}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-secondary/50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Card</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">#</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Rarity</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCards.map((card) => (
                    <tr key={card.id} className="border-b last:border-0 hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-2 w-16">
                        <div className="relative h-16 w-11 rounded border bg-secondary/20 overflow-hidden shadow-sm">
                          <Image src={card.images.small} alt={card.name} fill className="object-cover" sizes="44px" />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground font-medium">{card.number}</td>
                      <td className="px-4 py-3"><span className="font-bold">{card.name}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={cn("h-2.5 w-2.5 rounded-full shadow-sm border border-black/10", getRarityColor(card.rarity))} />
                          <span className="text-sm font-medium text-muted-foreground">{card.rarity || "Unknown"}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {filteredCards.length === 0 && (
          <div className="py-24 text-center border rounded-xl bg-secondary/20 border-dashed mt-4">
            <p className="text-muted-foreground font-medium">No cards found matching "{searchQuery}"</p>
          </div>
        )}
      </main>
    </div>
  )
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
  } catch {
    return dateString
  }
}
