import Link from "next/link"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Search, Plus } from "lucide-react"

// Sample card data for database view
const SAMPLE_CARDS = [
  { id: "1", name: "Weedle", number: "001/164", rarity: "Common", type: "Grass" },
  { id: "2", name: "Kakuna", number: "002/164", rarity: "Uncommon", type: "Grass" },
  { id: "3", name: "Beedrill", number: "003/164", rarity: "Rare", type: "Grass" },
  { id: "4", name: "Shroomish", number: "004/164", rarity: "Common", type: "Grass" },
  { id: "5", name: "Breloom", number: "005/164", rarity: "Uncommon", type: "Grass/Fighting" },
  { id: "6", name: "Treecko", number: "006/164", rarity: "Common", type: "Grass" },
  { id: "7", name: "Grovyle", number: "007/164", rarity: "Uncommon", type: "Grass" },
  { id: "8", name: "Sceptile", number: "008/164", rarity: "Rare Holo", type: "Grass" },
  { id: "9", name: "Lotad", number: "009/164", rarity: "Common", type: "Water/Grass" },
  { id: "10", name: "Lombre", number: "010/164", rarity: "Uncommon", type: "Water/Grass" },
  { id: "11", name: "Ludicolo", number: "011/164", rarity: "Rare", type: "Water/Grass" },
  { id: "12", name: "Seedot", number: "012/164", rarity: "Common", type: "Grass" },
  { id: "13", name: "Nuzleaf", number: "013/164", rarity: "Uncommon", type: "Grass/Dark" },
  { id: "14", name: "Shiftry", number: "014/164", rarity: "Rare", type: "Grass/Dark" },
  { id: "15", name: "Tropius", number: "015/164", rarity: "Uncommon", type: "Grass" },
  { id: "16", name: "Turtwig", number: "016/164", rarity: "Common", type: "Grass" },
  { id: "17", name: "Grotle", number: "017/164", rarity: "Uncommon", type: "Grass" },
  { id: "18", name: "Torterra", number: "018/164", rarity: "Rare Holo", type: "Grass" },
  { id: "85", name: "Kyogre EX", number: "085/164", rarity: "Rare Ultra", type: "Water" },
  { id: "86", name: "Primal Kyogre EX", number: "086/164", rarity: "Rare Ultra", type: "Water" },
]

function getRarityColor(rarity: string) {
  switch (rarity.toLowerCase()) {
    case "common":
      return "bg-muted-foreground"
    case "uncommon":
      return "bg-green-500"
    case "rare":
      return "bg-blue-500"
    case "rare holo":
      return "bg-cyan-400"
    case "rare ultra":
      return "bg-yellow-500"
    case "secret rare":
      return "bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500"
    default:
      return "bg-muted-foreground"
  }
}

export default function DatabaseSetPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Back Link */}
        <Link
          href="/database"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Database
        </Link>

        {/* Set Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">XY Series</p>
            <h1 className="text-3xl font-bold tracking-tight">Primal Clash</h1>
            <p className="mt-2 text-muted-foreground">
              Released February 2015 | 164 cards
            </p>
          </div>
          <Button className="gap-2 w-fit">
            <Plus className="h-4 w-4" />
            Add to Master Sets
          </Button>
        </div>

        {/* Search */}
        <div className="mb-6 relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search cards..."
            className="pl-10"
          />
        </div>

        {/* Cards Table */}
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-secondary/50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Rarity
                  </th>
                </tr>
              </thead>
              <tbody>
                {SAMPLE_CARDS.map((card) => (
                  <tr
                    key={card.id}
                    className="border-b last:border-0 hover:bg-secondary/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {card.number}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium">{card.name}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {card.type}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2 w-2 rounded-full ${getRarityColor(card.rarity)}`}
                        />
                        <span className="text-sm">{card.rarity}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
