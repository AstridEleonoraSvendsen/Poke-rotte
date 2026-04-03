import { Suspense } from "react"
import { getSet, getSetCards } from "@/lib/pokemon"
import { Loader2 } from "lucide-react"

// 1. THIS IS THE "BRAIN" OF THE PAGE
export default async function SetPage({ params }: { params: Promise<{ id: string }> }) {
  // Fix for Next.js 15: We MUST await params
  const { id } = await params

  try {
    const [set, cards] = await Promise.all([getSet(id), getSetCards(id)])

    if (!set) return <div className="p-10 text-center">Set not found.</div>

    return (
      <main className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{set.name}</h1>
          <p className="text-muted-foreground">{cards?.length || 0} Cards in this set</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {cards?.map((card: any) => (
            <div key={card.id} className="border rounded-lg overflow-hidden bg-card">
              <img 
                src={card.images?.small} 
                alt={card.name} 
                className="w-full h-auto hover:scale-105 transition-transform"
                loading="lazy" 
              />
              <div className="p-2 text-xs font-medium truncate">{card.name}</div>
            </div>
          ))}
        </div>
      </main>
    )
  } catch (error) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-xl font-bold">Failed to load {id}</h2>
        <button onClick={() => window.location.reload()} className="mt-4 underline">Retry</button>
      </div>
    )
  }
}
