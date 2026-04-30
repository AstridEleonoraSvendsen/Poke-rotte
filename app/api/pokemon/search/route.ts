import { NextResponse } from "next/server"

// The exact same rarity safeguards we built for Master Sets
const NO_REVERSE_HOLO_RARITIES = new Set([
  "Rare Holo EX", "Rare Ultra", "Rare Secret", "Rare Holo GX", "Rare Holo V",
  "Rare Holo VMAX", "Rare VSTAR", "Rare Shiny", "Rare Shiny GX", "Rare Shining",
  "Rare Rainbow", "Rare Prism Star", "LEGEND", "Amazing Rare", "Radiant Rare",
  "Double Rare", "Illustration Rare", "Special Illustration Rare", "Hyper Rare",
  "Ultra Rare", "Shiny Rare", "Shiny Ultra Rare", "ACE SPEC Rare",
  "Trainer Gallery Rare Holo",
])

// The exact same era logic to prevent reverse holos in vintage sets
function setSupportsReverseHolos(series?: string, setName?: string) {
  if (!series || !setName) return true;
  if (series === "Gym" || series === "Neo" || series === "e-Card") {
     if (series === "Gym" || series === "Neo") return false;
  }
  if (series === "Base" && setName !== "Legendary Collection") return false;
  return true;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q")
  const sort = searchParams.get("sort") || "releaseDate-desc"
  const page = searchParams.get("page") || "1"
  const pageSize = 30 

  if (!q) {
    return NextResponse.json({ cards: [], total: 0, hasMore: false })
  }

  // Map frontend sort to official TCG API format
  let apiSort = "-set.releaseDate"
  if (sort === "releaseDate-desc") apiSort = "-set.releaseDate"
  if (sort === "releaseDate-asc") apiSort = "set.releaseDate"
  if (sort === "price-desc") apiSort = "-cardmarket.prices.trendPrice"
  if (sort === "price-asc") apiSort = "cardmarket.prices.trendPrice"

  try {
    const apiKey = process.env.POKEMON_TCG_API_KEY
    const headers: HeadersInit = { "Content-Type": "application/json" }
    if (apiKey) headers["X-Api-Key"] = apiKey

    // Clean up the query and wrap it in asterisks for broad searching
    const searchQuery = `name:"*${q.replace(/['"*?\\]/g, "").trim()}*"`

    const res = await fetch(
      `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(searchQuery)}&orderBy=${apiSort}&pageSize=${pageSize}&page=${page}`,
      { headers, cache: "no-store" }
    )

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch from TCG API" }, { status: res.status })
    }

    const data = await res.json()
    const apiCards = data.data || []
    
    const finalCards: any[] = []

    for (const card of apiCards) {
      // 1. Resolve Best Market Price (Using our TCGPlayer fallback logic)
      let marketPrice = null;
      if (card.cardmarket?.prices?.trendPrice) marketPrice = card.cardmarket.prices.trendPrice;
      else if (card.cardmarket?.prices?.averageSellPrice) marketPrice = card.cardmarket.prices.averageSellPrice;
      else if (card.tcgplayer?.prices) {
         const p = card.tcgplayer.prices;
         marketPrice = p.holofoil?.market || p.normal?.market || p.reverseHolofoil?.market || p['1stEditionHolofoil']?.market || null;
      }

      const standardCard = {
        id: card.id,
        name: card.name,
        number: card.number,
        rarity: card.rarity || "Unknown",
        supertype: card.supertype,
        subtypes: card.subtypes || [],
        set: {
          id: card.set.id,
          name: card.set.name,
          series: card.set.series,
          releaseDate: card.set.releaseDate,
        },
        images: {
          small: card.images?.small || "",
          large: card.images?.large || "",
        },
        marketPrice
      }
      
      // Push the standard card to results
      finalCards.push(standardCard)

      // 2. Strict Reverse Holo Generation Check!
      const num = parseInt(card.number.replace(/\D/g, "")) || 0
      const printedTotal = card.set.printedTotal || 0
      const supportsReverses = setSupportsReverseHolos(card.set.series, card.set.name)

      // ONLY clone if it passes all rarity and era checks, AND is within the standard set numbering
      if (supportsReverses && num <= printedTotal && !NO_REVERSE_HOLO_RARITIES.has(card.rarity)) {
        
        let revPrice = null;
        if (card.tcgplayer?.prices?.reverseHolofoil?.market) {
           revPrice = card.tcgplayer.prices.reverseHolofoil.market;
        } else {
           revPrice = marketPrice; 
        }

        finalCards.push({
          ...standardCard,
          id: `${card.id}-reverse`,
          name: `${card.name}`,
          rarity: "Reverse Holo", // This gives it the proper Reverse Holo tag on the UI!
          marketPrice: revPrice
        })
      }
    }

    return NextResponse.json({
      cards: finalCards,
      total: data.totalCount || 0,
      hasMore: (data.page * data.pageSize) < data.totalCount
    })

  } catch (err) {
    console.error("Search API Error:", err)
    return NextResponse.json({ error: "Failed to search cards" }, { status: 500 })
  }
}
