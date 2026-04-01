import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q")

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ cards: [] })
  }

  try {
    const response = await fetch(
      `https://api.pokemontcg.io/v2/cards?q=name:"${encodeURIComponent(query)}"&orderBy=-set.releaseDate&pageSize=30`,
      {
        headers: { "Content-Type": "application/json" },
        next: { revalidate: 300 },
      }
    )

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
      cardmarket: card.cardmarket,
      tcgplayer: card.tcgplayer,
    }))

    return NextResponse.json({ cards })
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}
