import { getSet, getSetCards } from "@/lib/pokemon"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

export default async function SetPage({ params }: { params: Promise<{ id: string }> }) {
  // This 'await' is the most important fix for Next.js 15
  const { id } = await params

  try {
    // We fetch both at the same time to be fast
    const [set, cards] = await Promise.all([
      getSet(id),
      getSetCards(id)
    ])

    if (!set) {
      return <div className="p-20 text-center">Set not found.</div>
    }

    return (
      <main className="container mx-auto py-8 px-4">
        {/* Back Button */}
        <Link href="/" className="flex items-center text-sm text-muted-foreground hover:text-primary mb-6">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Master Sets
        </Link>

        {/* Header Section */}
        <div className="flex items-center gap-6 mb-10 border-b pb-8">
          {set.images?.logo && (
            <img src={set.images.logo} alt={set.name} className="h-24 w-auto object-contain" />
          )}
          <div>
            <h1 className="text-4xl font-bold tracking-tight">{set.name}</h1>
            <p className="text-lg text-muted-foreground">
              {set.series} Series • {cards?.length || 0} Cards
            </p>
          </div>
        </div>

        {/* The Grid of Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {cards && cards.length > 0 ? (
            cards.map((card: any) => (
              <div key={card.id} className="group relative bg-card rounded-xl overflow-hidden border transition-all hover:shadow-xl hover:-translate-y-1">
                <div className="aspect-[2.5/3.5] overflow-hidden">
                  <img
                    src={card.images?.small}
                    alt={card.name}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <div className="p-3">
                  <p className="text-xs font-bold truncate">{card.name}</p>
                  <p className="text-[10px] text-muted-foreground">{card.number}/{set.printedTotal}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="col-span-full text-center py-10">No cards found for this set.</p>
          )}
        </div>
      </main>
    )
  } catch (error) {
    console.error("Error loading set:", error)
    return (
      <div className="p-20 text-center">
        <h2 className="text-2xl font-bold">Error loading set data</h2>
        <p className="mt-2 text-muted-foreground">The Pokémon API might be having trouble. Please try again later.</p>
        <Link href="/" className="mt-4 inline-block text-blue-500 underline">Return Home</Link>
      </div>
    )
  }
}
