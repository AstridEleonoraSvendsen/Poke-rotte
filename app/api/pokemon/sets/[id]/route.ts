import { NextResponse } from "next/server"

interface PokemonCardRaw {
  id: string
  name: string
  number: string
  rarity: string
  supertype: string
  subtypes?: string[]
  images: {
    small: string
    large: string
  }
}

interface PokemonCard {
  id: string
  name: string
  number: string
  rarity: string
  variant: "standard" | "reverse_holo"
  isReverseHolo: boolean
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
  stats: {
    totalCards: number
    regularCards: number
    secretCards: number
  }
}

// Rarities that typically have reverse holo variants
const REVERSE_HOLO_ELIGIBLE_RARITIES = [
  "Common",
  "Uncommon",
  "Rare",
  "Rare Holo",
]

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
    const set = setData.data as PokemonSet

    // Fetch all cards in the set (handle pagination for large sets)
    let allCards: PokemonCardRaw[] = []
    let page = 1
    const pageSize = 250

    while (true) {
      const cardsResponse = await fetch(
        `https://api.pokemontcg.io/v2/cards?q=set.id:${id}&orderBy=number&pageSize=${pageSize}&page=${page}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
          next: { revalidate: 3600 },
        }
      )

      const cardsData = await cardsResponse.json()
      const cards = cardsData.data || []
      allCards = allCards.concat(cards)

      if (cards.length < pageSize) break
      page++
    }

    // Generate master set cards including reverse holos
    const masterSetCards: PokemonCard[] = []

    // Sort cards by number (handle numeric and alphanumeric)
    allCards.sort((a, b) => {
      const numA = parseInt(a.number.replace(/\D/g, '')) || 0
      const numB = parseInt(b.number.replace(/\D/g, '')) || 0
      if (numA !== numB) return numA - numB
      return a.number.localeCompare(b.number)
    })

    for (const card of allCards) {
      // Add standard version
      masterSetCards.push({
        id: card.id,
        name: card.name,
        number: card.number,
        rarity: card.rarity || "Unknown",
        variant: "standard",
        isReverseHolo: false,
        images: card.images,
      })

      // Add reverse holo variant if eligible
      // Reverse holos exist for most Pokemon cards with Common, Uncommon, Rare rarities
      // Trainer/Energy cards also sometimes have reverse holos
      const isEligibleForReverseHolo = 
        REVERSE_HOLO_ELIGIBLE_RARITIES.includes(card.rarity) &&
        card.supertype === "Pokémon"

      if (isEligibleForReverseHolo) {
        masterSetCards.push({
          id: `${card.id}-reverse`,
          name: `${card.name} Reverse Holo`,
          number: card.number,
          rarity: "Reverse Holo",
          variant: "reverse_holo",
          isReverseHolo: true,
          images: card.images, // Same image, but we mark it as reverse holo
        })
      }
    }

    // Calculate stats
    const printedTotal = set.printedTotal || 0
    const secretCards = allCards.filter(c => {
      const num = parseInt(c.number.replace(/\D/g, '')) || 0
      return num > printedTotal
    }).length

    const response: ApiResponse = {
      set,
      cards: masterSetCards,
      stats: {
        totalCards: masterSetCards.length,
        regularCards: allCards.length - secretCards,
        secretCards,
      },
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
