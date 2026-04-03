"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Header } from "@/components/header"
import { MasterSetCard } from "@/components/master-set-card"
import { Button } from "@/components/ui/button"
import { Plus, Search, X } from "lucide-react"
import { getAllOwnedCounts, getActiveSets, saveActiveSets, type ActiveSet } from "@/lib/collection"

export default function HomePage() {
  const [ownedCounts, setOwnedCounts] = useState<Record<string, number>>({})
  const [activeSets, setActiveSets] = useState<ActiveSet[]>([])
  
  // States for the "Add New Set" popup
  const [isAddingSet, setIsAddingSet] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<ActiveSet[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Load the sets and card counts when the page opens
  useEffect(() => {
    setOwnedCounts(getAllOwnedCounts())
    setActiveSets(getActiveSets())
  }, [])

  // The Search Function for the API
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      // Call the Pokemon TCG API
      const res = await fetch(`https://api.pokemontcg.io/v2/sets?q=name:"*${searchQuery}*"&orderBy=-releaseDate`);
      const data = await res.json();
      
      // Format the results to match our ActiveSet type
      const formattedResults = data.data.map((apiSet: any) => ({
        id: apiSet.id,
        name: apiSet.name,
        series: apiSet.series,
        totalCards: apiSet.printedTotal,
        releaseDate: apiSet.releaseDate
      }));
      
      setSearchResults(formattedResults);
    } catch (error) {
      console.error("Failed to search sets", error);
    } finally {
      setIsSearching(false);
    }
  }

  // Add the chosen set to the dashboard
  const handleAddSet = (newSet: ActiveSet) => {
    // Check if it's already on the dashboard
    if (activeSets.some(s => s.id === newSet.id)) {
      alert("This set is already on your dashboard!");
      return;
    }
    
    const updatedSets = [...activeSets, newSet];
    setActiveSets(updatedSets);
    saveActiveSets(updatedSets);
    setIsAddingSet(false);
    setSearchQuery("");
    setSearchResults([]);
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
                  className="flex-1 px-4 py-2 rounded-md bg-background border text-sm"
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
          {/* FIXED: Button now opens the search modal */}
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
          {setsWithOwned.length === 0 && (
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
