"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { MasterSetCard } from "@/components/master-set-card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { getAllOwnedCounts } from "@/lib/collection"

const MASTER_SETS = [
  { id: "xy5",       name: "Primal Clash",        series: "XY Series",        totalCards: 164, releaseDate: "Feb 2015" },
  { id: "base1",     name: "Base Set",             series: "Base Series",      totalCards: 102, releaseDate: "Jan 1999" },
  { id: "sv8pt5",    name: "Prismatic Evolutions", series: "Scarlet & Violet", totalCards: 258, releaseDate: "Jan 2025" },
  { id: "sm35",      name: "Hidden Fates",         series: "Sun & Moon",       totalCards: 163, releaseDate: "Aug 2019" },
  { id: "swsh12pt5", name: "Crown Zenith",         series: "Sword & Shield",   totalCards: 230, releaseDate: "Jan 2023" },
  { id: "xy12",      name: "Evolutions",           series: "XY Series",        totalCards: 113, releaseDate: "Nov 2016" },
]

export default function HomePage() {
  const [ownedCounts, setOwnedCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    setOwnedCounts(getAllOwnedCounts())
  }, [])

  const setsWithOwned = MASTER_SETS.map((set) => ({
    ...set,
    ownedCards: ownedCounts[set.id] ?? 0,
  }))

  const totalOwned = setsWithOwned.reduce((acc, s) => acc + s.ownedCards, 0)
  const totalCards = setsWithOwned.reduce((acc, s) => acc + s.totalCards, 0)

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Master Sets</h1>
            <p className="mt-1 text-muted-foreground">
              Track and complete your Pokemon card collections
            </p>
          </div>
          <Button className="gap-2 w-fit">
            <Plus className="h-4 w-4" />
            New Master Set
          </Button>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Total Sets</p>
            <p className="mt-1 text-2xl font-bold">{MASTER_SETS.length}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Cards Collected</p>
            <p className="mt-1 text-2xl font-bold">{totalOwned}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Total Cards</p>
            <p className="mt-1 text-2xl font-bold">{totalCards}</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {setsWithOwned.map((set) => (
            <MasterSetCard key={set.id} {...set} />
          ))}
        </div>
      </main>
    </div>
  )
}
