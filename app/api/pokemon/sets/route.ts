import { NextResponse } from "next/server"

function apiHeaders(): HeadersInit {
  const headers: HeadersInit = { "Content-Type": "application/json" }
  if (process.env.POKEMON_TCG_API_KEY) {
    headers["X-Api-Key"] = process.env.POKEMON_TCG_API_KEY
  }
  return headers
}

export async function GET() {
  try {
    const response = await fetch(
      "https://api.pokemontcg.io/v2/sets?orderBy=-releaseDate&pageSize=250",
      {
        headers: apiHeaders(),
        cache: "force-cache",
      }
    )

    if (!response.ok) {
      const text = await response.text()
      console.error("Sets fetch failed:", response.status, text)
      return NextResponse.json({ error: "Failed to fetch sets" }, { status: 500 })
    }

    const data = await response.json()
    const sets = data.data || []

    const seriesGroups = sets.reduce((acc: Record<string, any[]>, set: any) => {
      const series = set.series || "Other"
      if (!acc[series]) acc[series] = []
      acc[series].push(set)
      return acc
    }, {})

    return NextResponse.json({ sets, seriesGroups })
  } catch (error) {
    console.error("Error fetching Pokemon sets:", error)
    return NextResponse.json({ error: "Failed to fetch sets" }, { status: 500 })
  }
}
