"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Header } from "@/components/header"
import { MasterSetCard } from "@/components/master-set-card"
import { Button } from "@/components/ui/button"
import { Plus, Search, X, ArrowUpDown, MousePointer2 } from "lucide-react"
import { PokeballSpinner } from "@/components/ui/pokeball-spinner"
import { getAllOwnedCounts, getActiveSets, saveActiveSets, type ActiveSet } from "@/lib/collection"
import { toast } from "sonner"

// 1 EUR = 7.46 DKK
const EUR_TO_DKK = 7.46;
type Currency = "EUR" | "DKK"

export default function HomePage() {
  const [ownedCounts, setOwnedCounts] = useState<Record<string, number>>({})
  const [activeSets, setActiveSets] = useState<ActiveSet[]>([])
  const [isLoadingSets, setIsLoadingSets] = useState(false) 
  
  // Global Pricing State
  const [setValues, setSetValues] = useState<Record<string, { eur: number, dkk: number }>>({})
  const [displayCurrency, setDisplayCurrency] = useState<Currency>("EUR")
  
  // Cursor Toggle State
  const [cursorPref, setCursorPref] = useState<"fun" | "boring">("fun")

  // States for the "Add New Set" popup
  const [isAddingSet, setIsAddingSet] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<ActiveSet[]>([])
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    // 1. INSTANT LOAD: Grab data from local storage
    setOwnedCounts(getAllOwnedCounts())
    const localSets = getActiveSets()
    setActiveSets(localSets)

    // Load Cursor Preference
    const savedCursor = localStorage.getItem('ratCursor')
    if (savedCursor === 'boring') {
      setCursorPref('boring')
    }

    // Calculate Prices from LocalStorage instantly
    const calculatedValues: Record<string, { eur: number, dkk: number }> = {}
    localSets.forEach(set => {
      try {
        const localPrices = localStorage.getItem(`prices:${set.id}`)
        if (localPrices) {
          const prices = JSON.parse(localPrices)
          let eur = 0, dkk = 0;
          Object.values(prices).forEach((p: any) => {
            if (p.currency === "DKK") dkk += p.price;
            else eur += p.price;
          });
          calculatedValues[set.id] = { eur, dkk }
        }
      } catch {}
    })
    setSetValues(calculatedValues)

    // 2. BACKGROUND SYNC: Fetch the cloud data and correct the "Master Set Totals"
    async function syncWithCloud() {
      try {
        const [cloudRes, catalogRes] = await Promise.all([
          fetch('/api/master-sets', { cache: 'no-store' }),
          fetch('/api/pokemon/sets', { next: { revalidate: 3600 } })
        ]);

        if (!cloudRes.ok || !catalogRes.ok) return;

        const cloudData = await cloudRes.json();
        const catalogData = await catalogRes.json();

        const ownedIds: string[] = cloudData.masterSets || [];
        const allSets = catalogData.sets || [];

        if (ownedIds.length === 0 && localSets.length === 0) return;

        let mappedSets: ActiveSet[] = ownedIds.map(id => {
          const found = allSets.find((s: any) => s.id === id)
          const existingLocal = localSets.find(s => s.id === id)
          
          if (found) {
            return {
              id: found.id,
              name: found.name,
              series: found.series,
              totalCards: existingLocal ? existingLocal.totalCards : found.total,
              releaseDate: found.releaseDate,
              logoUrl: found.images?.logo
            }
          }
          return null
        }).filter(Boolean) as ActiveSet[]

        setActiveSets(mappedSets);

        const freshValues: Record<string, { eur: number, dkk: number }> = {}
        let updatedTrueTotals = false;

        await Promise.all(mappedSets.map(async (set) => {
          // A. Fetch Prices
          const res = await fetch(`/api/owned-cards?setId=${set.id}`, { cache: 'no-store' })
          if (res.ok) {
            const data = await res.json()
            if (data.cardData) {
               let eur = 0, dkk = 0;
               const pricesToSave: Record<string, any> = {}
               data.cardData.forEach((row: any) => {
                 if (row.paidPrice != null) {
                   const numPrice = Number(row.paidPrice)
                   pricesToSave[row.cardId] = { price: numPrice, currency: row.currency || "EUR" }
                   if (row.currency === "DKK") dkk += numPrice;
                   else eur += numPrice;
                 }
               })
               freshValues[set.id] = { eur, dkk }
               localStorage.setItem(`prices:${set.id}`, JSON.stringify(pricesToSave))
            }
          }

          // B. Fetch True Master Set Total
          try {
            const setRes = await fetch(`/api/pokemon/sets/${set.id}`);
            if (setRes.ok) {
               const setData = await setRes.json();
               if (setData.cards && setData.cards.length !== set.totalCards) {
                  set.totalCards = setData.cards.length; 
                  updatedTrueTotals = true;
               }
            }
          } catch(e) {}
        }))

        setSetValues(freshValues)
        
        if (updatedTrueTotals) {
          setActiveSets([...mappedSets]);
          saveActiveSets(mappedSets); 
        }

      } catch (err) {
        console.error("Background sync failed", err);
      }
    }

    syncWithCloud();
  }, [])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const res = await fetch(`https://api.pokemontcg.io/v2/sets?q=name:"*${searchQuery}*"&orderBy=-releaseDate`);
      const data = await res.json();
      
      const formattedResults = data.data.map((apiSet: any) => ({
        id: apiSet.id,
        name: apiSet.name,
        series: apiSet.series,
        totalCards: apiSet.total || apiSet.printedTotal, 
        releaseDate: apiSet.releaseDate,
        logoUrl: apiSet.images?.logo
      }));
      
      setSearchResults(formattedResults);
    } catch (error) {
      console.error("Failed to search sets", error);
      toast.error("Search failed. Please try again.")
    } finally {
      setIsSearching(false);
    }
  }

  const handleAddSet = async (newSet: ActiveSet) => {
    if (activeSets.some(s => s.id === newSet.id)) {
      toast.info("This set is already on your dashboard!");
      return;
    }
    
    setIsAddingSet(false);
    setSearchQuery("");
    setSearchResults([]);
    toast.info(`Calculating True Master Set size for ${newSet.name}...`);

    let finalTotalCards = newSet.totalCards;
    
    try {
       const res = await fetch(`/api/pokemon/sets/${newSet.id}`);
       if (res.ok) {
          const data = await res.json();
          if (data.cards) finalTotalCards = data.cards.length;
       }
    } catch(e) {}

    const setWithTrueTotal = { ...newSet, totalCards: finalTotalCards };
    
    const updatedSets = [...activeSets, setWithTrueTotal];
    setActiveSets(updatedSets);
    saveActiveSets(updatedSets); 
    
    toast.success(`${newSet.name} added with ${finalTotalCards} cards!`);

    try {
      await fetch('/api/master-sets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setId: newSet.id })
      })
    } catch (err) {
      console.error("Failed to save to cloud", err)
      toast.error("Warning: Failed to save to cloud.")
    }
  }

  // --- CURSOR TOGGLE LOGIC ---
  const toggleCursor = () => {
    const newVal = cursorPref === "fun" ? "boring" : "fun"
    setCursorPref(newVal)
    localStorage.setItem("ratCursor", newVal)
    if (newVal === "fun") {
      document.documentElement.classList.add("fun-cursor")
    } else {
      document.documentElement.classList.remove("fun-cursor")
    }
  }

  const setsWithStats = activeSets.map((set) => {
    const val = setValues[set.id] || { eur: 0, dkk: 0 };
    const totalVal = displayCurrency === "EUR" 
        ? val.eur + (val.dkk / EUR_TO_DKK)
        : val.dkk + (val.eur * EUR_TO_DKK);

    return {
        ...set,
        ownedCards: ownedCounts[set.id] ?? 0,
        value: totalVal
    }
  })

  const totalOwned = setsWithStats.reduce((acc, s) => acc + s.ownedCards, 0)
  const totalCards = setsWithStats.reduce((acc, s) => acc + s.totalCards, 0)
  const completionPct = totalCards > 0 ? Math.round((totalOwned / totalCards) * 100) : 0

  const grandTotalValue = setsWithStats.reduce((acc, s) => acc + s.value, 0)

  return (
    <div className="min-h-screen bg-background relative">
      <Header />

      {/* FLOATING CURSOR TOGGLE (Only on the Master Sets Page) */}
      <div className="fixed right-4 top-1/2 -translate-y-1/2 z-40 hidden sm:flex flex-col items-center gap-2 bg-card/40 backdrop-blur-md p-3 rounded-xl border shadow-sm opacity-50 hover:opacity-100 transition-opacity">
        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground text-center leading-tight">Cursor<br/>Setting</span>
        <button
          onClick={toggleCursor}
          className="relative flex h-10 w-10 items-center justify-center rounded-full bg-background hover:bg-secondary transition-colors border shadow-sm"
          title="Toggle Cursor"
        >
           {cursorPref === "fun" ? (
             <Image src="/pokeball-normal.png" alt="Fun" width={16} height={16} className="object-contain drop-shadow-sm" />
           ) : (
             <MousePointer2 className="h-4 w-4 text-muted-foreground" />
           )}
        </button>
        <span className="text-[10px] font-medium text-center text-muted-foreground">
          {cursorPref === "fun" ? "Fun Rat" : "Boring Rat"}
        </span>
      </div>

      {/* Add New Set Modal popup */}
      {isAddingSet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-bold">Add a Master Set</h2>
              <Button variant="ghost" size="icon" onClick={() => setIsAddingSet(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="p-4 border-b bg-muted/30">
              <form onSubmit={handleSearch} className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Search set name (e.g. 'Evolutions', '151')" 
                  className="flex-1 px-4 py-2 rounded-md bg-background border text-sm focus:outline-ring"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button type="submit" disabled={isSearching}>
                  {isSearching ? "..." : <Search className="h-4 w-4" />}
                </Button>
              </form>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
              {searchResults.length === 0 && !isSearching && (
                <div className="text-center py-10 text-muted-foreground text-sm">
                  Search for a Pokémon set to add it to your dashboard.
                </div>
              )}
              
              {searchResults.map(set => (
                <div key={set.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                  <div>
                    <p className="font-bold text-sm">{set.name}</p>
                    <p className="text-xs text-muted-foreground">{set.series} • {set.totalCards} Official Cards</p>
                  </div>
                  <Button size="sm" onClick={() => handleAddSet(set)}>Add</Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Master Sets</h1>
            <p className="mt-1 text-muted-foreground">
              Track and complete your Pokemon card collections
            </p>
          </div>
          <Button className="gap-2 w-fit" onClick={() => setIsAddingSet(true)}>
            <Plus className="h-4 w-4" />
            New Master Set
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="mb-8 grid gap-4 sm:grid-cols-4">
          
          <div className="relative rounded-lg border bg-card p-4 overflow-hidden">
            <p className="text-sm text-muted-foreground">Total Sets</p>
            <p className="mt-1 text-2xl font-bold">{activeSets.length}</p>
            <div className="absolute right-0 bottom-0 top-0 flex items-center pr-3 pointer-events-none select-none">
              <div className="relative h-16 w-16 opacity-90">
                <Image src="/char.png" alt="Charmander" fill className="object-contain drop-shadow-sm" sizes="64px"/>
              </div>
            </div>
          </div>

          <div className="relative rounded-lg border bg-card p-4 overflow-hidden">
            <p className="text-sm text-muted-foreground">Cards Collected</p>
            <p className="mt-1 text-2xl font-bold">{totalOwned}</p>
            <div className="absolute right-0 bottom-0 top-0 flex items-center pr-3 pointer-events-none select-none">
              <div className="relative h-16 w-16 opacity-90">
                <Image src="/Squr.png" alt="Squirtle" fill className="object-contain drop-shadow-sm" sizes="64px"/>
              </div>
            </div>
          </div>

          {/* Value Block */}
          <div 
            className="relative rounded-lg border bg-card p-4 overflow-hidden cursor-pointer group hover:border-primary/50 transition-colors"
            onClick={() => setDisplayCurrency(prev => prev === "EUR" ? "DKK" : "EUR")}
            title="Click to toggle currency"
          >
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              Value <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </p>
            <p className="mt-1 text-2xl font-bold text-primary transition-transform group-active:scale-95">
              {displayCurrency === "EUR" ? "€" : "kr "}{grandTotalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          <div className="relative rounded-lg border bg-card p-4 overflow-hidden">
            <p className="text-sm text-muted-foreground">Completion</p>
            <p className="mt-1 text-2xl font-bold">{completionPct}%</p>
            <div className="absolute right-0 bottom-0 top-0 flex items-center pr-3 pointer-events-none select-none">
              <div className="relative h-16 w-16 opacity-90">
                <Image src="/Bulba.png" alt="Bulbasaur" fill className="object-contain drop-shadow-sm" sizes="64px"/>
              </div>
            </div>
          </div>

        </div>

        {/* Master Sets Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {setsWithStats.map((set) => (
            <MasterSetCard 
              key={set.id} 
              {...set} 
              value={set.value} 
              displayCurrency={displayCurrency} 
            />
          ))}
          
          {isLoadingSets && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-muted-foreground">
               <PokeballSpinner className="h-12 w-12 text-foreground mb-4 shadow-lg" />
               <p className="font-medium tracking-wide">Loading rat data from the shadows...</p>
             </div>
          )}

          {!isLoadingSets && setsWithStats.length === 0 && (
             <div className="col-span-full py-20 text-center border-2 border-dashed rounded-xl border-muted-foreground/20">
               <p className="text-muted-foreground font-medium mb-4">You have no master sets on your dashboard.</p>
               <Button onClick={() => setIsAddingSet(true)}>Add your first set</Button>
             </div>
          )}
        </div>
      </main>
    </div>
  )
}
