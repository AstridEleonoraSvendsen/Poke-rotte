import { Suspense } from "react"
import { getSet, getSetCards } from "@/lib/pokemon" // Ensure this path matches your project
import { CardGrid } from "@/components/card-grid"
import { SetHeader } from "@/components/set-header"
import { LoadingSpinner } from "@/components/loading-spinner"

// This part makes sure the "id" is handled correctly in Next.js 15
export default async function SetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    // Fetching data with a fallback in case the API is slow
    const [set, cards] = await Promise.all([
      getSet(id),
      getSetCards(id)
    ])

    if (!set) {
      return <div className="p-10 text-center">Set not found.</div>
    }

    return (
      <main className="container mx-auto py-8 px-4">
        <SetHeader set={set} cardCount={cards?.length || 0} />
        <Suspense fallback={<LoadingSpinner />}>
          <CardGrid cards={cards || []} />
        </Suspense>
      </main>
    )
  } catch (error) {
    console.error("Error loading set:", error)
    return (
      <div className="p-10 text-center">
        <h2 className="text-2xl font-bold">Oops! Something went wrong.</h2>
        <p className="text-muted-foreground mt-2">
          We couldn't load the cards for this set. This often happens if the API is busy or the set is very large.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-md"
        >
          Try Again
        </button>
      </div>
    )
  }
}
