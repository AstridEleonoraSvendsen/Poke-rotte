import { NextResponse } from "next/server"

interface PokemonSet {
  id: string
  name: string
  series: string
  printedTotal: number
  total: number
  releaseDate: string
  images: {
    symbol: string
    logo: string
  }
}

export async function GET() {
  try {
    const response = await fetch(
      "https://api.pokemontcg.io/v2/sets?orderBy=-releaseDate",
      {
        headers: {
          "Content-Type": "application/json",
        },
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    )

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch sets" },
        { status: 500 }
      )
    }

    const data = await response.json()
    const sets: PokemonSet[] = data.data || []

    // Group sets by series
    const seriesGroups = sets.reduce((acc, set) => {
      const series = set.series || "Other"
      if (!acc[series]) {
        acc[series] = []
      }
      acc[series].push(set)
      return acc
    }, {} as Record<string, PokemonSet[]>)

    return NextResponse.json({ sets, seriesGroups })
  } catch (error) {
    console.error("Error fetching Pokemon sets:", error)
    return NextResponse.json(
      { error: "Failed to fetch sets" },
      { status: 500 }
    )
  }
}
