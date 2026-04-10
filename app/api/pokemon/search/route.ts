import { NextResponse } from "next/server"

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
  const pageSize = 24

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

  // Build URL — CRITICAL: the colon in name: and the * wildcard must NOT be percent-encoded
  // We append q manually after the other params so they don't get double-encoded
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
  } catch (err) {
    console.error("Search route error:", err)
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}
