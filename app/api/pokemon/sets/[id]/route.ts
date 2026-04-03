import { NextResponse } from "next/server"

const NO_REVERSE_HOLO_RARITIES = [
  "Rare Holo EX", "Rare Ultra", "Rare Secret", "Rare Holo GX", "Rare Holo V",
  "Rare Holo VMAX", "Rare VSTAR", "Rare Shiny", "Rare Shiny GX", "Rare Shining",
  "Rare Rainbow", "Rare Prism Star", "LEGEND", "Amazing Rare", "Radiant Rare",
  "Double Rare", "Illustration Rare", "Special Illustration Rare", "Hyper Rare",
  "Ultra Rare", "Shiny Rare", "Shiny Ultra Rare", "ACE SPEC Rare",
  "Trainer Gallery Rare Holo",
]

// Build headers — include API key if set in environment
function apiHeaders(): HeadersInit {
  const headers: HeadersInit = { "Content-Type": "application/json" }
  if (process.env.POKEMON_TCG_API_KEY) {
    headers["X-Api-Key"] = process.env.POKEMON_TCG_API_KEY
  }
  return headers
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    // ── Fetch set details ───────────────────────────────────────────────────
    const setResponse = await fetch(
      `https://api.pokemontcg.io/v2/sets/${id}`,
      {
        headers: apiHeaders(),
        // Use cache: "force-cache" with revalidate via Next.js config instead
        // of next: { revalidate } which hangs in API routes on Vercel
        cache: "force-cache",
      }
    )

    if (!setResponse.ok) {
      const text = await setResponse.text()
      console.error(`Set fetch failed: ${setResponse.status}`, text)
      return NextResponse.json(
        { error: `Set not found (${setResponse.status})` },
        { status: setResponse.status }
      )
    }

    const setData = await setResponse.json()
    const set = setData.data

    if (!set) {
      return NextResponse.json({ error: "Set data missing" }, { status: 404 })
    }

    // ── Fetch all cards (paginated) ─────────────────────────────────────────
    let allCards: any[] = []
    let page = 1
    const pageSize = 250

    while (true) {
      const cardsResponse = await fetch(
        `https://api.pokemontcg.io/v2/cards?q=set.id:${id}&orderBy=number&pageSize=${pageSize}&page=${page}`,
        {
          headers: apiHeaders(),
          cache: "force-cache",
        }
      )

      if (!cardsResponse.ok) {
        const text = await cardsResponse.text()
        console.error(`Cards fetch failed page ${page}: ${cardsResponse.status}`, text)
        // Return what we have so far rather than crashing
        break
      }

      const cardsData = await cardsResponse.json()
      const cards = cardsData.data || []
      allCards = allCards.concat(cards)

      if (cards.length < pageSize) break
      page++
    }

    // ── Sort cards ──────────────────────────────────────────────────────────
    allCards.sort((a, b) => {
      const numA = parseInt(a.number.replace(/\D/g, "")) || 0
      const numB = parseInt(b.number.replace(/\D/g, "")) || 0
      if (numA !== numB) return numA - numB
      return a.number.localeCompare(b.number)
    })

    // ── Build master set (standard + reverse holos) ─────────────────────────
    const masterSetCards: any[] = []
    const printedTotal = set.printedTotal || 0

    for (const card of allCards) {
      masterSetCards.push({
        id: card.id,
        name: card.name,
        number: card.number,
        rarity: card.rarity || "Unknown",
        variant: "standard",
        isReverseHolo: false,
        images: card.images,
      })

      const cardNumber = parseInt(card.number.replace(/\D/g, "")) || 0
      const isSecretRare = cardNumber > printedTotal
      const isUltraRare = NO_REVERSE_HOLO_RARITIES.includes(card.rarity)

      if (!isSecretRare && !isUltraRare) {
        masterSetCards.push({
          id: `${card.id}-reverse`,
          name: `${card.name} Reverse Holo`,
          number: card.number,
          rarity: "Reverse Holo",
          variant: "reverse_holo",
          isReverseHolo: true,
          images: card.images,
        })
      }
    }

    // ── Stats ───────────────────────────────────────────────────────────────
    const secretCards = allCards.filter(c => {
      const num = parseInt(c.number.replace(/\D/g, "")) || 0
      return num > printedTotal
    }).length

    return NextResponse.json({
      set,
      cards: masterSetCards,
      stats: {
        totalCards: masterSetCards.length,
        regularCards: allCards.length - secretCards,
        secretCards,
      },
    })
  } catch (error) {
    console.error("Error fetching Pokemon data:", error)
    return NextResponse.json(
      { error: "Failed to fetch data", detail: String(error) },
      { status: 500 }
    )
  }
}
