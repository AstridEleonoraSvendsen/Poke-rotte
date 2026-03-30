import { Header } from "@/components/header"
import { MasterSetCard } from "@/components/master-set-card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

// Sample master sets data
const MASTER_SETS = [
  {
    id: "xy5",
    name: "Primal Clash",
    series: "XY Series",
    totalCards: 164,
    ownedCards: 89,
    releaseDate: "Feb 2015",
  },
  {
    id: "base-set",
    name: "Base Set",
    series: "Base Series",
    totalCards: 102,
    ownedCards: 102,
    releaseDate: "Jan 1999",
  },
  {
    id: "sv-prismatic",
    name: "Prismatic Evolutions",
    series: "Scarlet & Violet",
    totalCards: 258,
    ownedCards: 45,
    releaseDate: "Jan 2025",
  },
  {
    id: "sm-hidden",
    name: "Hidden Fates",
    series: "Sun & Moon",
    totalCards: 163,
    ownedCards: 78,
    releaseDate: "Aug 2019",
  },
  {
    id: "swsh-crown",
    name: "Crown Zenith",
    series: "Sword & Shield",
    totalCards: 230,
    ownedCards: 156,
    releaseDate: "Jan 2023",
  },
  {
    id: "xy-evolutions",
    name: "Evolutions",
    series: "XY Series",
    totalCards: 113,
    ownedCards: 67,
    releaseDate: "Nov 2016",
  },
]

export default function HomePage() {
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

        {/* Stats Overview */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Total Sets</p>
            <p className="mt-1 text-2xl font-bold">{MASTER_SETS.length}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Cards Collected</p>
            <p className="mt-1 text-2xl font-bold">
              {MASTER_SETS.reduce((acc, set) => acc + set.ownedCards, 0)}
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Total Cards</p>
            <p className="mt-1 text-2xl font-bold">
              {MASTER_SETS.reduce((acc, set) => acc + set.totalCards, 0)}
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Completion</p>
            <p className="mt-1 text-2xl font-bold text-primary">
              {Math.round(
                (MASTER_SETS.reduce((acc, set) => acc + set.ownedCards, 0) /
                  MASTER_SETS.reduce((acc, set) => acc + set.totalCards, 0)) *
                  100
              )}
              %
            </p>
          </div>
        </div>

        {/* Master Sets Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {MASTER_SETS.map((set) => (
            <MasterSetCard key={set.id} {...set} />
          ))}
        </div>
      </main>
    </div>
  )
}
