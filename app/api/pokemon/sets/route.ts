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

  const orderByMap: Record<string, string> = {
    "releaseDate-desc": "-set.releaseDate",
    "releaseDate-asc":  "set.releaseDate",
    "price-desc":       "-cardmarket.prices.averageSellPrice",
    "price-asc":        "cardmarket.prices.averageSellPrice",
  }
  const orderBy = orderByMap[sort] || "-set.releaseDate"

  // IMPORTANT: Build the URL manually so the q param is not double-encoded.
  // The TCG API needs q=name:mewtwo* NOT q=name%3Amewtwo*
  const cleanQuery = query.trim().replace(/['"]/g, "")
  const apiUrl = new URL("https://api.pokemontcg.io/v2/cards")
  apiUrl.searchParams.set("orderBy", orderBy)
  apiUrl.searchParams.set("pageSize", String(pageSize))
  apiUrl.searchParams.set("page", String(page))
  // Set q manually to avoid encodeURIComponent turning : and * into %3A and %2A
  const rawUrl = `${apiUrl.toString()}&q=name:${encodeURIComponent(cleanQuery)}*`

  try {
    const response = await fetch(rawUrl, {
      headers: { "Content-Type": "application/json" },
      // No caching — search must always be fresh
      cache: "no-store",
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("TCG API error:", response.status, errorText)
      return NextResponse.json({ error: "Search failed", detail: errorText }, { status: 500 })
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
      },
      images: card.images,
      marketPrice:
        card.cardmarket?.prices?.trendPrice ??
        card.cardmarket?.prices?.averageSellPrice ??
        null,
    }))

    return NextResponse.json({
      cards,
      total: data.totalCount ?? cards.length,
      page,
      pageSize,
      hasMore: (data.totalCount ?? 0) > page * pageSize,
    })
  } catch (error) {
    console.error("Search fetch error:", error)
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}
