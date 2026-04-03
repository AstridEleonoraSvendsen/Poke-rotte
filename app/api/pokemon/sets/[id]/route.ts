import { NextResponse } from "next/server"

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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    // ── 1. Fetch set info ────────────────────────────────────────────────────
    const setRes = await fetch(
      `https://api.pokemontcg.io/v2/sets/${id}`,
      { headers: apiHeaders(), cache: "no-store" }
    )
    if (!setRes.ok) {
      return NextResponse.json({ error: `Set not found (${setRes.status})` }, { status: 404 })
    }
    const set = (await setRes.json()).data

    // ── 2. Fetch cards — all pages, but bail after 5 pages to avoid timeout ──
    let allCards: any[] = []
    const pageSize = 250

    for (let page = 1; page <= 5; page++) {
      const cardsRes = await fetch(
        `https://api.pokemontcg.io/v2/cards?q=set.id:${id}&orderBy=number&pageSize=${pageSize}&page=${page}`,
        { headers: apiHeaders(), cache: "no-store" }
      )
      if (!cardsRes.ok) break

      const batch = (await cardsRes.json()).data || []
      allCards = allCards.concat(batch)
      if (batch.length < pageSize) break  // no more pages
    }

    // ── 3. Sort ──────────────────────────────────────────────────────────────
    allCards.sort((a, b) => {
      const na = parseInt(a.number.replace(/\D/g, "")) || 0
      const nb = parseInt(b.number.replace(/\D/g, "")) || 0
      return na !== nb ? na - nb : a.number.localeCompare(b.number)
    })

    // ── 4. Build master set (standard + reverse holos) ───────────────────────
    const printedTotal = set.printedTotal || 0
    const masterCards: any[] = []

    for (const card of allCards) {
      masterCards.push({
        id: card.id, name: card.name, number: card.number,
        rarity: card.rarity || "Unknown", variant: "standard",
        isReverseHolo: false, images: card.images,
      })

      const num = parseInt(card.number.replace(/\D/g, "")) || 0
      if (num <= printedTotal && !NO_REVERSE_HOLO_RARITIES.has(card.rarity)) {
        masterCards.push({
          id: `${card.id}-reverse`,
          name: `${card.name} Reverse Holo`,
          number: card.number, rarity: "Reverse Holo",
          variant: "reverse_holo", isReverseHolo: true, images: card.images,
        })
      }
    }

    const secretCount = allCards.filter(c =>
      (parseInt(c.number.replace(/\D/g, "")) || 0) > printedTotal
    ).length

    return NextResponse.json({
      set,
      cards: masterCards,
      stats: {
        totalCards: masterCards.length,
        regularCards: allCards.length - secretCount,
        secretCards: secretCount,
      },
    })
  } catch (err) {
    console.error("Set route error:", err)
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 })
  }
}
