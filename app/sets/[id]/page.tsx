import { getSet, getSetCards } from "@/lib/pokemon"
import Link from "next/link"

// We use "any" for the types here to ensure it doesn't fail on TypeScript errors 
// during your build, since I cannot see your exact Type definitions.
export default async function SetPage(props: { params: Promise<{ id: string }> }) {
  // FIX 1: Explicitly await params for Next.js 15 compatibility
  const params = await props.params;
  const id = params.id;

  try {
    // FIX 2: Fetch both at once to stay under the 10-second Vercel timeout
    const [set, cards] = await Promise.all([
      getSet(id),
      getSetCards(id)
    ])

    if (!set) {
      return <div className="flex items-center justify-center min-h-screen text-white">Set not found</div>
    }

    return (
      <main className="min-h-screen bg-black text-white p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Simple Back Button using standard CSS */}
          <Link href="/" className="inline-block mb-6 text-sm text-gray-400 hover:text-white transition-colors">
            ← Back to Master Sets
          </Link>

          {/* Header Section */}
          <div className="flex flex-col md:flex-row items-center gap-6 mb-12 pb-8 border-b border-gray-800">
            {set.images?.logo && (
              <img 
                src={set.images.logo} 
                alt={set.name} 
                className="h-20 md:h-32 w-auto object-contain" 
              />
            )}
            <div className="text-center md:text-left">
              <h1 className="text-3xl md:text-5xl font-bold mb-2">{set.name}</h1>
              <p className="text-gray-400 uppercase tracking-widest text-sm">
                {set.series} Series • {cards?.length || 0} Cards
              </p>
            </div>
          </div>

          {/* Card Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {cards && cards.map((card: any) => (
              <div 
                key={card.id} 
                className="group relative bg-gray-900 rounded-lg overflow-hidden border border-gray-800 transition-all hover:border-gray-600 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]"
              >
                <div className="aspect-[2.5/3.5] relative">
                  <img
                    src={card.images?.small}
                    alt={card.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    loading="lazy"
                  />
                </div>
                <div className="p-3 bg-gray-900">
                  <p className="text-[10px] md:text-xs font-bold truncate text-gray-100">{card.name}</p>
                  <p className="text-[9px] md:text-[10px] text-gray-500 mt-1">
                    #{card.number} / {set.printedTotal}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    )
  } catch (error) {
    // FIX 3: Robust Error handling so the WHOLE site doesn't crash if one set fails
    console.error("Failed to load set:", error);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-6 text-center">
        <h2 className="text-2xl font-bold mb-4">Set Data Unavailable</h2>
        <p className="text-gray-400 max-w-md mb-6">
          The Pokémon API is taking too long to respond for {id}. This often happens with very large sets like Primal Clash.
        </p>
        <Link href="/" className="px-6 py-2 bg-white text-black rounded-full font-bold hover:bg-gray-200 transition-colors">
          Go Back
        </Link>
      </div>
    )
  }
}
