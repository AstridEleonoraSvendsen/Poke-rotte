import { NextResponse } from "next/server"

function apiHeaders(): HeadersInit {
  const h: HeadersInit = { "Content-Type": "application/json" }
  if (process.env.POKEMON_TCG_API_KEY) h["X-Api-Key"] = process.env.POKEMON_TCG_API_KEY
  return h
}

export async function GET() {
  try {
    const res = await fetch(
      "https://api.pokemontcg.io/v2/sets?orderBy=-releaseDate&pageSize=250",
      { headers: apiHeaders(), cache: "no-store" }
    )
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch sets" }, { status: 500 })
    }
    const sets = (await res.json()).data || []
    const seriesGroups = sets.reduce((acc: Record<string, any[]>, set: any) => {
      const s = set.series || "Other"
      if (!acc[s]) acc[s] = []
      acc[s].push(set)
      return acc
    }, {})
    return NextResponse.json({ sets, seriesGroups })
  } catch (err) {
    console.error("Sets list error:", err)
    return NextResponse.json({ error: "Failed to fetch sets" }, { status: 500 })
  }
}
