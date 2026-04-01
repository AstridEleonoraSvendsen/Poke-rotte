import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q")
  const sort = searchParams.get("sort") || "releaseDate-desc"
  const page = parseInt(searchParams.get("page") || "1")
  const pageSize = 24

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ cards: [], total: 0, page: 1, pageSize })
  }

  // Map our sort param to TCG API orderBy
  const orderByMap: Record<string, string> = {
    "releaseDate-desc": "-set.releaseDate",
    "releaseDate-asc":  "set.releaseDate",
    "price-desc":       "-cardmarket.prices.averageSellPrice",
    "price-asc":        "cardmarket.prices.averageSellPrice",
  }
  const orderBy = orderByMap[sort] || "-set.releaseDate"

  // Use wildcard search: name:mew* finds "Mew", "Mew ex", "Mewtwo", etc.
  // But we only want cards whose name STARTS WITH or IS the query — use name:query*
  const searchTerm = `name:${query.trim()}*`

  try {
    const url = `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(searchTerm)}&orderBy=${orderBy}&pageSize=${pageSize}&page=${page}`

    const response = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 300 },
    })

    if (!response.ok) {
      return NextResponse.json({ error: "Search failed" }, { status: 500 })
    }

    const data = await response.json()

    const cards = (data.data || []).map((card: any) => ({
      id: card.id,
      name: card.name,
      number: card.number,
      rarity: card.rarity || "Unknown",
      supertype: card.supertype,
      subtypes: card.subtypes || [],
      set: {
        id: card.set?.id,
        name: card.set?.name,
        series: card.set?.series,
        releaseDate: card.set?.releaseDate,
        images: card.set?.images,
      },
      images: card.images,
      // Prefer cardmarket (EUR) prices
      marketPrice: card.cardmarket?.prices?.trendPrice
        ?? card.cardmarket?.prices?.averageSellPrice
        ?? null,
    }))

    return NextResponse.json({
      cards,
      total: data.totalCount ?? cards.length,
      page,
      pageSize,
      hasMore: (data.totalCount ?? 0) > page * pageSize,
    })
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}
