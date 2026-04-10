import { NextResponse } from "next/server"

// 1. Brought over the list of rarities that DO NOT get reverse holos
const NO_REVERSE_HOLO_RARITIES = new Set([
  "Rare Holo EX", "Rare Ultra", "Rare Secret", "Rare Holo GX", "Rare Holo V",
  "Rare Holo VMAX", "Rare VSTAR", "Rare Shiny", "Rare Shiny GX", "Rare Shining",
  "Rare Rainbow", "Rare Prism Star", "LEGEND", "Amazing Rare", "Radiant Rare",
  "Double Rare", "Illustration Rare", "Special Illustration Rare", "Hyper Rare",
  "Ultra Rare", "Shiny Rare", "Shiny Ultra Rare", "ACE SPEC Rare",
  "Trainer Gallery Rare Holo",
])

function apiHeaders(): HeadersInit {
  const h: HeadersInit = { "Content-Type": "application/json" }
  if (process.env.POKEMON_TCG_API_KEY) h["X-Api-Key"] = process.env.POKEMON_TCG_API_KEY
  return h
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q")?.trim() ?? ""
  const sort = searchParams.get("sort") || "releaseDate-desc"
  const page = parseInt(searchParams.get("page") || "1")
  const pageSize = 24 // We ask the API for 24 base cards, but we might return up to 48 if they all have reverse holos

  if (query.length < 2) {
    return NextResponse.json({ cards: [], total: 0, page: 1, pageSize, hasMore: false })
  }

  const orderByMap: Record<string, string> = {
    "releaseDate-desc": "-set.releaseDate",
    "releaseDate-asc":  "set.releaseDate",
    "price-desc":       "-cardmarket.prices.averageSellPrice",
    "price-asc":        "cardmarket.prices.averageSellPrice",
  }
  const orderBy = orderByMap[sort] || "-set.releaseDate"

  const clean = query.replace(/['"*?\\]/g, "").trim()
  const base = `https://api.pokemontcg.io/v2/cards?orderBy=${encodeURIComponent(orderBy)}&pageSize=${pageSize}&page=${page}`
  const url = `${base}&q=name:${clean}*`

  try {
    const res = await fetch(url, { headers: apiHeaders(), cache: "no-store" })

    if (!res.ok) {
      const txt = await res.text()
      console.error("Search API error:", res.status, txt)
      return NextResponse.json({ error: "Search failed", detail: txt }, { status: 500 })
    }

    const data = await res.json()
    const rawCards = data.data || []
    
    // 2. The Cloning Engine: Create an array to hold both standard and reverse holos
    const processedCards: any[] = []

    for (const card of rawCards) {
      // Get the set's printed total (fallback to 999 if unknown so old promos don't break)
      const printedTotal = card.set?.printedTotal || 999
      const num = parseInt(card.number.replace(/\D/g, "")) || 0
      const rarity = card.rarity || "Unknown"

      // Always push the standard card
      processedCards.push({
        id: card.id,
        name: card.name,
        number: card.number,
        rarity: rarity,
        supertype: card.supertype,
        subtypes: card.subtypes || [],
        variant: "standard",
        isReverseHolo: false,
        set: {
          id: card.set?.id,
          name: card.set?.name,
          series: card.set?.series,
          releaseDate: card.set?.releaseDate,
        },
        images: card.images,
        marketPrice:
          card.cardmarket?.prices?.trendPrice ??
          card.cardmarket?.prices?.averageSellPrice ??
          null,
      })

      // If the card is part of the main set (not a secret rare) AND its rarity allows it...
      if (num <= printedTotal && !NO_REVERSE_HOLO_RARITIES.has(rarity)) {
        // Push the cloned Reverse Holo card right underneath it!
        processedCards.push({
          id: `${card.id}-reverse`,
          name: `${card.name} Reverse Holo`,
          number: card.number,
          rarity: "Reverse Holo",
          supertype: card.supertype,
          subtypes: card.subtypes || [],
          variant: "reverse_holo",
          isReverseHolo: true,
          set: {
            id: card.set?.id,
            name: card.set?.name,
            series: card.set?.series,
            releaseDate: card.set?.releaseDate,
          },
          images: card.images,
          marketPrice:
            card.cardmarket?.prices?.reverseHoloTrend ??
            card.cardmarket?.prices?.reverseHoloSell ??
            null, // Try to grab the specific Reverse Holo price if available!
        })
      }
    }

    return NextResponse.json({
      cards: processedCards,
      // The total is tricky now because we artificially doubled the results, 
      // but we still rely on the API's pagination of the BASE cards.
      total: data.totalCount ?? rawCards.length, 
      page,
      pageSize,
      hasMore: (data.totalCount ?? 0) > page * pageSize,
    })
  } catch (err) {
    console.error("Search route error:", err)
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}
