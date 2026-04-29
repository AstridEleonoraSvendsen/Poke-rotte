"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PokeballSpinner } from "@/components/ui/pokeball-spinner"
import { Spinner } from "@/components/ui/spinner"
import { Plus, Search, X, ArrowLeft, Coins, ArrowUpDown, Trash2, Edit, RefreshCw, TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const EUR_TO_DKK = 7.46;
type Currency = "EUR" | "DKK"
type AcquiredMethod = "pulled" | "purchased"

// --- DATA MODELS ---
interface PortfolioCard {
  uniqueId: string 
  cardId: string
  name: string
  number: string
  rarity: string
  setId: string
  setName: string
  images: { small: string }
  marketPrice: number | null
  paidPrice: number | null
  currency: Currency
  acquiredMethod: AcquiredMethod
}

interface ValueSnapshot {
  date: number
  valueEur: number
}

interface Portfolio {
  id: string
  name: string
  createdAt: number
  cards: PortfolioCard[]
  history: ValueSnapshot[]
}

// --- MINI STOCK CHART COMPONENT ---
function PortfolioChart({ history, displayCurrency }: { history: ValueSnapshot[], displayCurrency: Currency }) {
  if (!history || history.length === 0) return null;

  // Scaled down dimensions for the header row
  const width = 240;
  const height = 60;
  const padding = 10;

  const data = history.map(h => ({
    date: h.date,
    value: displayCurrency === "EUR" ? h.valueEur : h.valueEur * EUR_TO_DKK
  }));

  const chartData = data.length === 1 
    ? [{ date: data[0].date - 86400000, value: data[0].value }, data[0]] 
    : data;

  const minVal = Math.min(...chartData.map(d => d.value));
  const maxVal = Math.max(...chartData.map(d => d.value));
  const minDate = chartData[0].date;
  const maxDate = chartData[chartData.length - 1].date;

  const rangeVal = maxVal - minVal === 0 ? 1 : maxVal - minVal;
  const rangeDate = maxDate - minDate === 0 ? 1 : maxDate - minDate;

  const points = chartData.map((d) => {
    const x = padding + ((d.date - minDate) / rangeDate) * (width - padding * 2);
    const y = height - padding - ((d.value - minVal) / rangeVal) * (height - padding * 2);
    return `${x},${y}`;
  }).join(" ");

  const isUp = chartData[chartData.length - 1].value >= chartData[0].value;
  const strokeColor = isUp ? "#22c55e" : "#ef4444"; 
  const gradientId = isUp ? "gradUp" : "gradDown";

  const startVal = chartData[0].value;
  const currentVal = chartData[chartData.length - 1].value;
  const pctChange = startVal === 0 ? 0 : ((currentVal - startVal) / startVal) * 100;

  return (
    <div className="w-full lg:w-[320px] xl:w-[380px] bg-secondary/30 border rounded-xl p-3 flex items-center gap-4">
      <div className="flex-shrink-0 min-w-[70px]">
        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Return</p>
        <div className={cn("flex items-center gap-0.5 text-lg font-bold leading-none", isUp ? "text-green-500" : "text-red-500")}>
          {isUp ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          {isUp ? "+" : ""}{pctChange.toFixed(2)}%
        </div>
      </div>

      <div className="flex-1 relative h-[45px]">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
          <defs>
            <linearGradient id="gradUp" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="gradDown" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon points={`${padding},${height - padding} ${points} ${width - padding},${height - padding}`} fill={`url(#${gradientId})`} />
          <polyline fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={points} />
          <circle 
            cx={padding + ((chartData[chartData.length - 1].date - minDate) / rangeDate) * (width - padding * 2)} 
            cy={height - padding - ((chartData[chartData.length - 1].value - minVal) / rangeVal) * (height - padding * 2)} 
            r="3.5" fill={strokeColor} className="animate-pulse"
          />
        </svg>
      </div>
    </div>
  );
}

export default function PortfolioPage() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [activePortfolioId, setActivePortfolioId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [displayCurrency, setDisplayCurrency] = useState<Currency>("EUR")

  const [isCreating, setIsCreating] = useState(false)
  const [newPortfolioName, setNewPortfolioName] = useState("")
  
  const [isAddingCard, setIsAddingCard] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [editingCard, setEditingCard] = useState<PortfolioCard | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)

  // --- INITIAL LOAD ---
  useEffect(() => {
    const localData = localStorage.getItem("ratPortfolios")
    if (localData) {
      const parsed: Portfolio[] = JSON.parse(localData).map((p: any) => ({
        ...p,
        history: p.history || []
      }))
      setPortfolios(parsed)
    }
    setLoading(false)

    async function syncCloud() {
      try {
        const res = await fetch('/api/portfolios')
        if (res.ok) {
          const cloudData = await res.json()
          if (cloudData && cloudData.length > 0) {
            const parsed = cloudData.map((p: any) => ({ ...p, history: p.history || [] }))
            setPortfolios(parsed)
            localStorage.setItem("ratPortfolios", JSON.stringify(parsed))
          }
        }
      } catch (e) {
        console.log("Cloud sync not ready, using local storage.")
      }
    }
    syncCloud()
  }, [])

  const savePortfolios = (newPortfolios: Portfolio[]) => {
    setPortfolios(newPortfolios)
    localStorage.setItem("ratPortfolios", JSON.stringify(newPortfolios))
    fetch('/api/portfolios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ portfolios: newPortfolios })
    }).catch(() => {})
  }

  const handleCreatePortfolio = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPortfolioName.trim()) return
    const newPort: Portfolio = { id: `port_${Date.now()}`, name: newPortfolioName.trim(), createdAt: Date.now(), cards: [], history: [] }
    savePortfolios([...portfolios, newPort])
    setNewPortfolioName("")
    setIsCreating(false)
    toast.success("Portfolio created!")
  }

  const handleDeletePortfolio = (id: string) => {
    if (!confirm("Are you sure you want to delete this portfolio? This cannot be undone.")) return
    savePortfolios(portfolios.filter(p => p.id !== id))
    if (activePortfolioId === id) setActivePortfolioId(null)
    toast.success("Portfolio deleted.")
  }

  const runSearch = async (query: string) => {
    if (query.length < 3) { setSearchResults([]); setIsSearching(false); return }
    setIsSearching(true)
    try {
      const clean = query.replace(/['"*?\\]/g, "").trim()
      const res = await fetch(`https://api.pokemontcg.io/v2/cards?q=name:${clean}*&orderBy=-set.releaseDate&pageSize=30`, {
        headers: process.env.NEXT_PUBLIC_POKEMON_TCG_API_KEY ? { "X-Api-Key": process.env.NEXT_PUBLIC_POKEMON_TCG_API_KEY } : {}
      })
      const data = await res.json()
      setSearchResults(data.data || [])
    } catch (e) {
      toast.error("Failed to search cards.")
    } finally {
      setIsSearching(false)
    }
  }

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => runSearch(searchQuery), 500)
  }, [searchQuery])

  const getMarketPrice = (apiCard: any) => {
    if (apiCard.cardmarket?.prices?.trendPrice) return apiCard.cardmarket.prices.trendPrice;
    if (apiCard.cardmarket?.prices?.averageSellPrice) return apiCard.cardmarket.prices.averageSellPrice;
    if (apiCard.tcgplayer?.prices) {
      const p = apiCard.tcgplayer.prices;
      const fallback = p.holofoil?.market || p.normal?.market || p.reverseHolofoil?.market || p['1stEditionHolofoil']?.market;
      if (fallback) return fallback;
    }
    return 0;
  }

  const calculateCardValue = (card: PortfolioCard, targetCurrency: Currency) => {
    let baseValue = card.paidPrice !== null ? card.paidPrice : (card.marketPrice || 0)
    let baseCurrency = card.paidPrice !== null ? card.currency : "EUR"
    if (baseCurrency === targetCurrency) return baseValue
    if (baseCurrency === "EUR" && targetCurrency === "DKK") return baseValue * EUR_TO_DKK
    if (baseCurrency === "DKK" && targetCurrency === "EUR") return baseValue / EUR_TO_DKK
    return baseValue
  }

  const calculateTotalValue = (cards: PortfolioCard[], targetCurrency: Currency = "EUR") => {
    return cards.reduce((sum, card) => sum + calculateCardValue(card, targetCurrency), 0)
  }

  const handleAddCard = (apiCard: any) => {
    if (!activePortfolioId) return
    const newCard: PortfolioCard = {
      uniqueId: `c_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      cardId: apiCard.id, name: apiCard.name, number: apiCard.number,
      rarity: apiCard.rarity || "Unknown Rarity", setId: apiCard.set.id, setName: apiCard.set.name,
      images: { small: apiCard.images?.small || "" }, marketPrice: getMarketPrice(apiCard),
      paidPrice: null, currency: "EUR", acquiredMethod: "pulled", 
    }
    const updated = portfolios.map(p => {
      if (p.id !== activePortfolioId) return p;
      const updatedCards = [...p.cards, newCard];
      const newTotalEur = calculateTotalValue(updatedCards, "EUR");
      const newHistory = [...(p.history || []), { date: Date.now(), valueEur: newTotalEur }];
      return { ...p, cards: updatedCards, history: newHistory };
    })
    savePortfolios(updated)
    toast.success(`${newCard.name} added to portfolio!`)
    setIsAddingCard(false); setSearchQuery(""); setSearchResults([])
  }

  const handleSaveCardEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCard || !activePortfolioId) return
    const updated = portfolios.map(p => {
      if (p.id !== activePortfolioId) return p
      const updatedCards = p.cards.map(c => c.uniqueId === editingCard.uniqueId ? editingCard : c);
      const newTotalEur = calculateTotalValue(updatedCards, "EUR");
      const newHistory = [...(p.history || []), { date: Date.now(), valueEur: newTotalEur }];
      return { ...p, cards: updatedCards, history: newHistory }
    })
    savePortfolios(updated)
    setEditingCard(null)
    toast.success("Card details updated!")
  }

  const handleRemoveCard = (uniqueId: string) => {
    if (!activePortfolioId) return
    const updated = portfolios.map(p => {
      if (p.id !== activePortfolioId) return p
      const updatedCards = p.cards.filter(c => c.uniqueId !== uniqueId);
      const newTotalEur = calculateTotalValue(updatedCards, "EUR");
      const newHistory = [...(p.history || []), { date: Date.now(), valueEur: newTotalEur }];
      return { ...p, cards: updatedCards, history: newHistory }
    })
    savePortfolios(updated)
    toast.info("Card removed.")
  }

  const syncMarketPrices = async () => {
    if (!activePortfolioId) return;
    const p = portfolios.find(p => p.id === activePortfolioId);
    if (!p || p.cards.length === 0) { toast.info("Add some cards first!"); return; }

    setIsSyncing(true);
    toast.info("Fetching live market prices...");

    try {
      const cardIds = Array.from(new Set(p.cards.map(c => c.cardId)));
      const queryParts = cardIds.map(id => `id:${id}`);
      
      let allFreshCards: any[] = [];
      const batchSize = 40;
      for (let i = 0; i < queryParts.length; i += batchSize) {
        const batchQuery = queryParts.slice(i, i + batchSize).join(" OR ");
        const res = await fetch(`https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(batchQuery)}`, {
          headers: process.env.NEXT_PUBLIC_POKEMON_TCG_API_KEY ? { "X-Api-Key": process.env.NEXT_PUBLIC_POKEMON_TCG_API_KEY } : {}
        });
        const data = await res.json();
        if (data.data) allFreshCards = allFreshCards.concat(data.data);
      }

      const freshPriceMap: Record<string, number> = {};
      allFreshCards.forEach(apiCard => { freshPriceMap[apiCard.id] = getMarketPrice(apiCard); });

      const updatedCards = p.cards.map(card => {
        const freshPrice = freshPriceMap[card.cardId];
        if (freshPrice !== undefined) return { ...card, marketPrice: freshPrice };
        return card;
      });

      const newTotalEur = calculateTotalValue(updatedCards, "EUR");
      const newHistory = [...(p.history || []), { date: Date.now(), valueEur: newTotalEur }];

      const updatedPortfolios = portfolios.map(port => 
        port.id === activePortfolioId ? { ...port, cards: updatedCards, history: newHistory } : port
      );
      savePortfolios(updatedPortfolios);
      toast.success("Market prices updated successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to sync prices. Try again later.");
    } finally {
      setIsSyncing(false);
    }
  }

  const activePortfolio = portfolios.find(p => p.id === activePortfolioId)

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-32">
          <div className="flex flex-col items-center gap-4">
            <PokeballSpinner className="h-14 w-14 text-foreground shadow-xl drop-shadow-md" />
            <p className="text-muted-foreground font-medium tracking-wide">Loading portfolio data...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background relative">
      <Header />

      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">New Portfolio</h2>
              <button onClick={() => setIsCreating(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleCreatePortfolio} className="flex flex-col gap-4">
              <Input placeholder="e.g., Charizard Collection, Top Hits..." value={newPortfolioName} onChange={e => setNewPortfolioName(e.target.value)} autoFocus />
              <Button type="submit" className="w-full bg-[#4f5f4f] hover:bg-[#4f5f4f]/90 text-white">Create</Button>
            </form>
          </div>
        </div>
      )}

      {isAddingCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-bold">Add Card to {activePortfolio?.name}</h2>
              <button onClick={() => {setIsAddingCard(false); setSearchQuery(""); setSearchResults([])}} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-4 border-b bg-muted/30">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search any Pokémon card..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" autoFocus />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {isSearching ? (
                <div className="flex justify-center py-10"><PokeballSpinner className="h-8 w-8 text-[#4f5f4f]" /></div>
              ) : searchResults.length > 0 ? (
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 md:grid-cols-5">
                  {searchResults.map(card => (
                    <div key={card.id} className="flex flex-col gap-2 group">
                      <div className="relative aspect-[2.5/3.5] rounded-lg overflow-hidden border">
                        <Image src={card.images?.small || ""} alt={card.name} fill className="object-cover" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Button size="sm" className="bg-[#4f5f4f] hover:bg-[#4f5f4f]/90 text-white" onClick={() => handleAddCard(card)}>Add</Button>
                        </div>
                      </div>
                      <p className="text-[10px] font-bold truncate leading-none">{card.name}</p>
                      <p className="text-[9px] text-muted-foreground truncate leading-none">{card.set.name}</p>
                    </div>
                  ))}
                </div>
              ) : searchQuery.length >= 3 ? (
                <div className="text-center py-10 text-muted-foreground">No cards found.</div>
              ) : (
                <div className="text-center py-10 text-muted-foreground">Type at least 3 characters to search...</div>
              )}
            </div>
          </div>
        </div>
      )}

      {editingCard && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex justify-between items-start mb-6 border-b pb-4">
              <div className="flex gap-4 items-center">
                <div className="relative h-16 w-12 rounded overflow-hidden border">
                  <Image src={editingCard.images.small} alt={editingCard.name} fill className="object-cover" />
                </div>
                <div>
                  <h2 className="text-base font-bold leading-tight">{editingCard.name}</h2>
                  <p className="text-xs text-muted-foreground">{editingCard.setName}</p>
                  <p className="text-[10px] text-muted-foreground">{editingCard.rarity}</p>
                </div>
              </div>
              <button onClick={() => setEditingCard(null)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleSaveCardEdit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">How did you get it?</label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setEditingCard({...editingCard, acquiredMethod: "pulled"})} className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all border-2", editingCard.acquiredMethod === "pulled" ? "bg-red-500 border-red-500 text-white shadow-md scale-[1.02]" : "bg-transparent border-border text-muted-foreground hover:border-red-500/50")}>RIPPED</button>
                  <button type="button" onClick={() => setEditingCard({...editingCard, acquiredMethod: "purchased"})} className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all border-2", editingCard.acquiredMethod === "purchased" ? "bg-blue-600 border-blue-600 text-white shadow-md scale-[1.02]" : "bg-transparent border-border text-muted-foreground hover:border-blue-600/50")}>PURCHASED</button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider flex justify-between">
                  <span>Custom Value / Paid Price</span>
                  <span className="text-[10px] font-normal lowercase">(Optional)</span>
                </label>
                <div className="flex gap-2">
                  <Input type="number" step="0.01" placeholder={editingCard.marketPrice?.toString() || "0.00"} value={editingCard.paidPrice !== null ? editingCard.paidPrice : ""} onChange={e => setEditingCard({...editingCard, paidPrice: e.target.value === "" ? null : parseFloat(e.target.value)})} />
                  <select className="bg-secondary rounded-md px-3 border border-input text-sm font-medium focus:outline-ring" value={editingCard.currency} onChange={e => setEditingCard({...editingCard, currency: e.target.value as Currency})}>
                    <option value="EUR">€ EUR</option>
                    <option value="DKK">kr DKK</option>
                  </select>
                </div>
                <p className="text-[10px] text-muted-foreground">If left blank, it uses current market value (€{editingCard.marketPrice || "0.00"}).</p>
              </div>

              <div className="pt-4 flex justify-between items-center border-t">
                <Button type="button" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => {handleRemoveCard(editingCard.uniqueId); setEditingCard(null)}}><Trash2 className="h-4 w-4 mr-2" /> Remove</Button>
                <Button type="submit" className="bg-[#4f5f4f] hover:bg-[#4f5f4f]/90 text-white">Save Changes</Button>
              </div>
            </form>
          </div>
        </div>
      )}


      <main className="container mx-auto px-4 py-8 max-w-6xl">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Portfolios</h1>
            <p className="mt-1 text-muted-foreground">Track your best pulls and custom collections</p>
          </div>
          
          <div 
            className="flex items-center gap-2 cursor-pointer hover:bg-secondary/40 p-2 rounded-lg transition-colors border shadow-sm w-fit bg-card"
            onClick={() => setDisplayCurrency(prev => prev === "EUR" ? "DKK" : "EUR")}
            title="Toggle Currency"
          >
            <Coins className="h-4 w-4 text-[#4f5f4f]" />
            <span className="text-sm font-bold text-foreground">
              {displayCurrency === "EUR" ? "EUR (€)" : "DKK (kr)"}
            </span>
            <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
          </div>
        </div>

        {!activePortfolioId && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Your Collections</h2>
              <Button onClick={() => setIsCreating(true)} className="gap-2 bg-[#4f5f4f] hover:bg-[#4f5f4f]/90 text-white"><Plus className="h-4 w-4"/> New Portfolio</Button>
            </div>

            {portfolios.length === 0 ? (
              <div className="text-center py-24 border-2 border-dashed rounded-xl bg-secondary/10">
                <p className="text-muted-foreground font-medium mb-4">You haven't created any portfolios yet.</p>
                <Button onClick={() => setIsCreating(true)} variant="outline" className="border-[#4f5f4f] text-[#4f5f4f] hover:bg-[#4f5f4f]/10">Create your first Portfolio</Button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {portfolios.map(port => {
                  const totalVal = calculateTotalValue(port.cards, displayCurrency)
                  return (
                    <div 
                      key={port.id} 
                      onClick={() => setActivePortfolioId(port.id)}
                      className="group flex flex-col p-5 rounded-xl border bg-card hover:border-[#4f5f4f]/50 hover:shadow-md transition-all cursor-pointer relative"
                    >
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeletePortfolio(port.id); }}
                        className="absolute top-3 right-3 p-1.5 rounded-md bg-destructive/10 text-destructive opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-white"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <h3 className="font-bold text-lg mb-1 pr-6 truncate">{port.name}</h3>
                      <p className="text-xs text-muted-foreground mb-4">{port.cards.length} Cards</p>
                      <div className="mt-auto pt-4 border-t">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Value</p>
                        <p className="text-xl font-bold text-[#4f5f4f]">
                          {displayCurrency === "EUR" ? "€" : "kr "}
                          {totalVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* --- REFORMATTED ACTIVE PORTFOLIO HEADER --- */}
        {activePortfolioId && activePortfolio && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button 
              onClick={() => setActivePortfolioId(null)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Portfolios
            </button>

            {/* 3-Column Layout: Title -> Mini-Chart -> Value & Buttons */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b pb-6">
              
              {/* Left: Title & Count */}
              <div className="flex-1 min-w-0">
                <h2 className="text-3xl font-bold truncate">{activePortfolio.name}</h2>
                <p className="text-sm text-muted-foreground mt-1">{activePortfolio.cards.length} Cards in collection</p>
              </div>

              {/* Middle: Compact Sparkline Chart */}
              {activePortfolio.cards.length > 0 && (
                <div className="flex-shrink-0 w-full lg:w-auto flex justify-start lg:justify-center">
                  <PortfolioChart history={activePortfolio.history} displayCurrency={displayCurrency} />
                </div>
              )}

              {/* Right: Scaled-Down Value & Buttons */}
              <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-start sm:items-center lg:items-end xl:items-center gap-4 flex-shrink-0">
                <div className="text-left sm:text-right">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Portfolio Value</p>
                  <p className="text-2xl font-bold text-[#4f5f4f]">
                    {displayCurrency === "EUR" ? "€" : "kr "}
                    {calculateTotalValue(activePortfolio.cards, displayCurrency).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button 
                    onClick={syncMarketPrices} 
                    variant="outline" 
                    size="sm"
                    className="gap-2 flex-1 sm:flex-none border-[#4f5f4f] text-[#4f5f4f] hover:bg-[#4f5f4f]/10"
                    disabled={isSyncing}
                  >
                    {isSyncing ? <Spinner className="h-3.5 w-3.5" /> : <RefreshCw className="h-3.5 w-3.5" />}
                    Sync Market
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => setIsAddingCard(true)} 
                    className="gap-2 flex-1 sm:flex-none bg-[#4f5f4f] hover:bg-[#4f5f4f]/90 text-white"
                  >
                    <Plus className="h-4 w-4"/> Add Card
                  </Button>
                </div>
              </div>

            </div>

            {/* --- CARDS GRID --- */}
            {activePortfolio.
