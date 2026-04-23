"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Header } from "@/components/header"
import { MasterSetCard } from "@/components/master-set-card"
import { Button } from "@/components/ui/button"
import { Plus, Search, X } from "lucide-react"
import { getAllOwnedCounts, getActiveSets, saveActiveSets, type ActiveSet } from "@/lib/collection"
import { toast } from "sonner"

export default function HomePage() {
  const [ownedCounts, setOwnedCounts] = useState<Record<string, number>>({})
  const [activeSets, setActiveSets] = useState<ActiveSet[]>([])
  // Start loading as FALSE so the local storage instantly shows on screen!
  const [isLoadingSets, setIsLoadingSets] = useState(false) 
  
  // States for the "Add New Set" popup
  const [isAddingSet, setIsAddingSet] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<ActiveSet[]>([])
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    // 1. INSTANT LOAD: Grab data from local storage so the screen paints immediately
    setOwnedCounts(getAllOwnedCounts())
    const localSets = getActiveSets()
    setActiveSets(localSets)

    // 2. BACKGROUND SYNC: Fetch the cloud data to make sure we are perfectly up to date
    async function syncWithCloud() {
      try {
        // Use Promise.all to fetch the DB and the Pokemon Catalog at the EXACT SAME TIME
        const [cloudRes, catalogRes] = await Promise.all([
          fetch('/api/master-sets', { cache: 'no-store' }),
          fetch('/api/pokemon/sets', { next: { revalidate: 3600 } }) // Cache catalog for 1 hour to speed it up!
        ]);

        if (!cloudRes.ok || !catalogRes.ok) return;

        const cloudData = await cloudRes.json();
        const catalogData = await catalogRes.json();

        const ownedIds: string[] = cloudData.masterSets || [];
        const allSets = catalogData.sets || [];

        // If the cloud is empty, but we have local sets, the user probably just cleared their cloud.
        if (ownedIds.length === 0 && localSets.length === 0) {
          return;
        }

        // Match Cloud IDs with the Catalog to build the fresh list
        const mappedSets: ActiveSet[] = ownedIds.map(id => {
          const found = allSets.find((s: any) => s.id === id)
          if (found) {
            return {
              id: found.id,
              name: found.name,
              series: found.series,
              totalCards: found.printedTotal || found.total,
              releaseDate: found.releaseDate,
              logoUrl: found.images?.logo
            }
          }
          return null
        }).filter(Boolean) as ActiveSet[]

        // Update the screen and local backup silently
        setActiveSets(mappedSets);
        saveActiveSets(mappedSets); 

      } catch (err) {
        console.error("Background sync failed", err);
      }
    }

    syncWithCloud();
  }, [])

  // The Search Function for the API
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
        totalCards: apiSet.printedTotal,
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

  // Add the chosen set to the dashboard AND save to Postgres Cloud
  const handleAddSet = async (newSet: ActiveSet) => {
    if (activeSets.some(s => s.id === newSet.id)) {
      toast.info("This set is already on your dashboard!");
      return;
    }
    
    // Update UI instantly
    const updatedSets = [...activeSets, newSet];
    setActiveSets(updatedSets);
    saveActiveSets(updatedSets); // Save locally instantly
    
    setIsAddingSet(false);
    setSearchQuery("");
    setSearchResults([]);
    toast.success(`${newSet.name} added to Master Sets!`);

    // Save to Postgres silently in the background
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

  // Calculate stats for the dashboard
  const setsWithOwned = activeSets.map((set) => ({
    ...set,
    ownedCards: ownedCounts[set.id] ?? 0,
  }))

  const totalOwned = setsWithOwned.reduce((acc, s) => acc + s.ownedCards, 0)
  const totalCards = setsWithOwned.reduce((acc, s) => acc + s.totalCards, 0)
  const completionPct = totalCards > 0 ? Math.round((totalOwned / totalCards) * 100) : 0

  return (
    <div className="min-h-screen bg-background relative">
      <Header />

      {/* Add New Set Modal popup */}
      {isAddingSet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[80vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-bold">Add a Master Set</h2>
              <Button variant="ghost" size="icon" onClick={() => setIsAddingSet(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Search Bar */}
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
            
            {/* Search Results List */}
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
                    <p className="text-xs text-muted-foreground">{set.series} • {set.totalCards} Cards</p>
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
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
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
          {setsWithOwned.map((set) => (
            <MasterSetCard key={set.id} {...set} />
          ))}
          
          {isLoadingSets && (
            <div className="col-span-full py-20 text-center text-muted-foreground">
              Loading rat data from the shadows...
            </div>
          )}

          {!isLoadingSets && setsWithOwned.length === 0 && (
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
