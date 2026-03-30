import { NextResponse } from "next/server"

interface PokemonCard {
  id: string
  name: string
  number: string
  rarity: string
  images: {
    small: string
    large: string
  }
}

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

interface ApiResponse {
  set: PokemonSet
  cards: PokemonCard[]
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    // Fetch set details
    const setResponse = await fetch(`https://api.pokemontcg.io/v2/sets/${id}`, {
      headers: {
        "Content-Type": "application/json",
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    })

    if (!setResponse.ok) {
      return NextResponse.json(
        { error: "Set not found" },
        { status: 404 }
      )
    }

    const setData = await setResponse.json()

    // Fetch all cards in the set
    const cardsResponse = await fetch(
      `https://api.pokemontcg.io/v2/cards?q=set.id:${id}&orderBy=number&pageSize=250`,
      {
        headers: {
          "Content-Type": "application/json",
        },
        next: { revalidate: 3600 },
      }
    )

    const cardsData = await cardsResponse.json()

    const response: ApiResponse = {
      set: setData.data,
      cards: cardsData.data || [],
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching Pokemon data:", error)
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    )
  }
}
