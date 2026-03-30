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

// Rarities that DON'T have reverse holo variants (ultra rares, secrets, etc.)
const NO_REVERSE_HOLO_RARITIES = [
  "Rare Holo EX",
  "Rare Ultra",
  "Rare Secret",
  "Rare Holo GX",
  "Rare Holo V",
  "Rare Holo VMAX",
  "Rare VSTAR",
  "Rare Shiny",
  "Rare Shiny GX",
  "Rare Shining",
  "Rare Rainbow",
  "Rare Prism Star",
  "LEGEND",
  "Amazing Rare",
  "Radiant Rare",
  "Double Rare",
  "Illustration Rare",
  "Special Illustration Rare",
  "Hyper Rare",
  "Ultra Rare",
  "Shiny Rare",
  "Shiny Ultra Rare",
  "ACE SPEC Rare",
  "Trainer Gallery Rare Holo",
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
    const printedTotal = set.printedTotal || 0

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
      // Most cards in modern sets (XY onwards) have reverse holos EXCEPT:
      // - Secret rares (card number > printedTotal)
      // - Ultra rares, full arts, rainbow rares, etc.
      const cardNumber = parseInt(card.number.replace(/\D/g, '')) || 0
      const isSecretRare = cardNumber > printedTotal
      const isUltraRareOrHigher = NO_REVERSE_HOLO_RARITIES.includes(card.rarity)
      const isEligibleForReverseHolo = !isSecretRare && !isUltraRareOrHigher

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
