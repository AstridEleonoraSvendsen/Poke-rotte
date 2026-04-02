"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { Header } from "@/components/header"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Search, ChevronRight, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface PokemonSet {
  id: string
  name: string
  series: string
  printedTotal: number
  total: number
  releaseDate: string
  images: { symbol: string; logo: string }
}

interface SearchCard {
  id: string
  name: string
  number: string
  rarity: string
  set: { id: string; name: string }
  images: { small: string }
  marketPrice: number | null
}

const SERIES_ORDER = [
  "Scarlet & Violet", "Sword & Shield", "Sun & Moon", "XY",
  "Black & White", "HeartGold & SoulSilver", "Platinum",
  "Diamond & Pearl", "EX", "e-Card", "Neo", "Gym", "Base", "Other",
]

function formatDate(d: string) {
  try { return new Date(d).toLocaleDateString("en-GB", { month: "short", year: "numeric" }) }
  catch { return d }
}

export default function DatabasePage() {
  const [sets, setSets] = useState<Record<string, PokemonSet[]>>({})
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>("Scarlet & Violet")
  const [query, setQuery] = useState("")
  const [cardResults, setCardResults] = useState<SearchCard[]>([])
  const [setResults, setSetResults] = useState<PokemonSet[]>([])
  const [searching, setSearching] = useState(false)
  const [searched, setSearched] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const allSets = useRef<PokemonSet[]>([])

  useEffect(() => {
    fetch("/api/pokemon/sets")
      .then(r => r.json())
      .then(data => {
        // Guard: data.seriesGroups may be undefined if API fails
        const groups = data?.seriesGroups ?? {}
        setSets(groups)
        allSets.current = data?.sets ?? []
        // Auto-expand first available series
        const first = SERIES_ORDER.find(s => groups[s])
        if (first) setExpanded(first)
      })
      .catch(() => setSets({}))
      .finally(() => setLoading(false))
  }, [])

  // Search across cards and sets when query changes
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.trim().length < 2) {
      setCardResults([]); setSetResults([]); setSearched(false); return
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true); setSearched(true)
      // Search sets locally (already loaded)
      const q = query.toLowerCase()
      setSetResults(allSets.current.filter(s => s.name.toLowerCase().includes(q)).slice(0, 6))
      // Search cards via API
      try {
        const res = await fetch(`/api/pokemon/search?q=${encodeURIComponent(query.trim())}&sort=releaseDate-desc&page=1`)
        const data = await res.json()
        setCardResults(data.cards ?? [])
      } catch { setCardResults([]) }
      finally { setSearching(false) }
    }, 400)
  }, [query])

  const sortedSeries = Object.keys(sets).sort((a, b) => {
    const ai = SERIES_ORDER.indexOf(a), bi = SERIES_ORDER.indexOf(b)
    if (ai === -1 && bi === -1) return a.localeCompare(b)
    if (ai === -1) return 1; if (bi === -1) return -1
    return ai - bi
  })

  const showSearch = query.trim().length >= 2

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-5xl">

        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Card Database</h1>
          <p className="mt-1 text-muted-foreground">Browse all Pokémon TCG sets and cards</p>
        </div>

        {/* Search */}
        <div className="relative mb-8 max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search any card or set name..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="pl-11 h-12 text-base bg-card"
          />
          {query && (
            <button onClick={() => { setQuery(""); setCardResults([]); setSetResults([]); setSearched(false) }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* ── SEARCH RESULTS ── */}
        {showSearch && (
          <div className="mb-10">
            {searching && (
              <div className="flex items-center gap-3 py-6">
                <Spinner className="h-5 w-5" />
                <span className="text-muted-foreground text-sm">Searching...</span>
              </div>
            )}

            {!searching && searched && (
              <>
                {/* Matching sets */}
                {setResults.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Sets</h2>
                    <div className="flex flex-col gap-1">
                      {setResults.map(set => (
                        <Link key={set.id} href={`/database/${set.id}`}
                          className="flex items-center gap-4 rounded-xl border bg-card px-4 py-3 hover:border-primary/50 hover:bg-secondary/30 transition-all">
                          {set.images?.symbol && (
                            <div className="relative h-8 w-8 flex-shrink-0">
                              <Image src={set.images.symbol} alt="" fill className="object-contain" sizes="32px" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">{set.name}</p>
                            <p className="text-xs text-muted-foreground">{set.series} · {set.total || set.printedTotal} cards</p>
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(set.releaseDate)}</span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Matching cards */}
                {cardResults.length > 0 && (
                  <div>
                    <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                      Cards — {cardResults.length} found
                    </h2>
                    <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                      {cardResults.map(card => (
                        <Link key={card.id} href={`/database/${card.set.id}`}
                          className="group flex flex-col hover:opacity-90 transition-opacity">
                          <div className="relative aspect-[2.5/3.5] rounded-lg overflow-hidden shadow-md group-hover:shadow-xl transition-shadow">
                            <Image src={card.images.small} alt={card.name} fill
                              className="object-cover group-hover:scale-105 transition-transform duration-200"
                              sizes="(max-width: 640px) 45vw, 16vw" />
                          </div>
                          <div className="mt-1.5 flex flex-col gap-px">
                            <p className="text-[11px] font-bold truncate">{card.name}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{card.set.name} #{card.number}</p>
                            <p className="text-[11px] font-semibold text-primary">
                              {card.marketPrice != null ? `€${card.marketPrice.toFixed(2)}` : "—"}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {setResults.length === 0 && cardResults.length === 0 && (
                  <div className="py-10 text-center text-muted-foreground">No results for "{query}"</div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── SET BROWSER (shown when not searching) ── */}
        {!showSearch && (
          <>
            {loading && (
              <div className="flex items-center justify-center py-16">
                <div className="flex flex-col items-center gap-4">
                  <Spinner className="h-8 w-8" />
                  <p className="text-muted-foreground text-sm">Loading sets...</p>
                </div>
              </div>
            )}

            {!loading && Object.keys(sets).length === 0 && (
              <div className="py-12 text-center text-muted-foreground">
                Failed to load sets. Please refresh the page.
              </div>
            )}

            {!loading && Object.keys(sets).length > 0 && (
              <div className="space-y-2">
                {sortedSeries.map(series => {
                  const seriesSets = sets[series]
                  const isOpen = expanded === series
                  return (
                    <div key={series} className="rounded-xl border bg-card overflow-hidden">
                      <button
                        onClick={() => setExpanded(isOpen ? null : series)}
                        className="flex w-full items-center justify-between p-4 text-left hover:bg-secondary/40 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-semibold">{series}</span>
                          <span className="text-sm text-muted-foreground">{seriesSets.length} sets</span>
                        </div>
                        <ChevronRight className={cn("h-5 w-5 text-muted-foreground transition-transform", isOpen && "rotate-90")} />
                      </button>

                      {isOpen && (
                        <div className="border-t px-4 py-3 space-y-1">
                          {seriesSets.map(set => (
                            <Link key={set.id} href={`/database/${set.id}`}
                              className="flex items-center gap-4 rounded-lg p-3 hover:bg-secondary/50 transition-colors">
                              {set.images?.symbol && (
                                <div className="relative h-8 w-8 flex-shrink-0">
                                  <Image src={set.images.symbol} alt="" fill className="object-contain" sizes="32px" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{set.name}</p>
                                <p className="text-sm text-muted-foreground">{set.total || set.printedTotal} cards</p>
                              </div>
                              <span className="text-sm text-muted-foreground whitespace-nowrap">{formatDate(set.releaseDate)}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
