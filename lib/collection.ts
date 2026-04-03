// Collection storage helpers

const STORAGE_PREFIX = "owned:"
const WISHLIST_PREFIX = "wishlist:"
const DREAMS_LISTS_KEY = "dreams:lists"
const DREAMS_CARDS_PREFIX = "dreams:cards:"

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DreamsList {
  id: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
}

export interface DreamsCard {
  id: string
  listId: string
  name: string
  number: string
  rarity: string
  supertype: string
  setName: string
  setId: string
  imageSmall: string
  imageLarge: string
  quantity: number
  addedAt: string
  marketPrice?: number
}

// ─── Owned cards ─────────────────────────────────────────────────────────────

export function loadOwnedCards(setId: string): Set<string> {
  if (typeof window === "undefined") return new Set()
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + setId)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw)
    return new Set(Array.isArray(parsed) ? parsed : [])
  } catch { return new Set() }
}

export function saveOwnedCards(setId: string, owned: Set<string>): void {
  if (typeof window === "undefined") return
  try { localStorage.setItem(STORAGE_PREFIX + setId, JSON.stringify([...owned])) } catch {}
}

// ─── Per-set wishlist ─────────────────────────────────────────────────────────

export function loadWishlist(setId: string): Set<string> {
  if (typeof window === "undefined") return new Set()
  try {
    const raw = localStorage.getItem(WISHLIST_PREFIX + setId)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw)
    return new Set(Array.isArray(parsed) ? parsed : [])
  } catch { return new Set() }
}

export function saveWishlist(setId: string, wishlist: Set<string>): void {
  if (typeof window === "undefined") return
  try { localStorage.setItem(WISHLIST_PREFIX + setId, JSON.stringify([...wishlist])) } catch {}
}

// ─── Summary ──────────────────────────────────────────────────────────────────

export function getOwnedCount(setId: string): number {
  return loadOwnedCards(setId).size
}

export function getAllOwnedCounts(): Record<string, number> {
  if (typeof window === "undefined") return {}
  const result: Record<string, number> = {}
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith(STORAGE_PREFIX)) {
      const setId = key.slice(STORAGE_PREFIX.length)
      result[setId] = getOwnedCount(setId)
    }
  }
  return result
}

// ─── Dreams: Lists CRUD ───────────────────────────────────────────────────────

export function getDreamsLists(): DreamsList[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(DREAMS_LISTS_KEY)
    if (!raw) return []
    return JSON.parse(raw) as DreamsList[]
  } catch { return [] }
}

export function saveDreamsLists(lists: DreamsList[]): void {
  if (typeof window === "undefined") return
  try { localStorage.setItem(DREAMS_LISTS_KEY, JSON.stringify(lists)) } catch {}
}

export function createDreamsList(name: string, description: string): DreamsList {
  const lists = getDreamsLists()
  const newList: DreamsList = {
    id: `list_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: name.trim(),
    description: description.trim(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  saveDreamsLists([...lists, newList])
  return newList
}

export function updateDreamsList(id: string, updates: Partial<Pick<DreamsList, "name" | "description">>): void {
  const lists = getDreamsLists()
  saveDreamsLists(lists.map((l) => l.id === id ? { ...l, ...updates, updatedAt: new Date().toISOString() } : l))
}

export function deleteDreamsList(id: string): void {
  const lists = getDreamsLists()
  saveDreamsLists(lists.filter((l) => l.id !== id))
  if (typeof window !== "undefined") localStorage.removeItem(DREAMS_CARDS_PREFIX + id)
}

// ─── Dreams: Cards CRUD ───────────────────────────────────────────────────────

export function getDreamsCards(listId: string): DreamsCard[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(DREAMS_CARDS_PREFIX + listId)
    if (!raw) return []
    return JSON.parse(raw) as DreamsCard[]
  } catch { return [] }
}

export function saveDreamsCards(listId: string, cards: DreamsCard[]): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(DREAMS_CARDS_PREFIX + listId, JSON.stringify(cards))
    const lists = getDreamsLists()
    saveDreamsLists(lists.map((l) => l.id === listId ? { ...l, updatedAt: new Date().toISOString() } : l))
  } catch {}
}

export function addCardToDreamsList(listId: string, card: Omit<DreamsCard, "listId" | "addedAt" | "quantity">): void {
  const cards = getDreamsCards(listId)
  const existing = cards.find((c) => c.id === card.id)
  if (existing) {
    saveDreamsCards(listId, cards.map((c) => c.id === card.id ? { ...c, quantity: c.quantity + 1 } : c))
  } else {
    saveDreamsCards(listId, [...cards, { ...card, listId, quantity: 1, addedAt: new Date().toISOString() }])
  }
}

export function removeCardFromDreamsList(listId: string, cardId: string): void {
  saveDreamsCards(listId, getDreamsCards(listId).filter((c) => c.id !== cardId))
}

export function updateDreamsCardQuantity(listId: string, cardId: string, quantity: number): void {
  const cards = getDreamsCards(listId)
  if (quantity <= 0) {
    saveDreamsCards(listId, cards.filter((c) => c.id !== cardId))
  } else {
    saveDreamsCards(listId, cards.map((c) => c.id === cardId ? { ...c, quantity } : c))
  }
}

export function isCardInDreamsList(listId: string, cardId: string): boolean {
  return getDreamsCards(listId).some((c) => c.id === cardId)
}

// ─── Active Master Sets ────────────────────────────────────────────────────────
const ACTIVE_SETS_KEY = "active_master_sets"

export interface ActiveSet {
  id: string;
  name: string;
  series: string;
  totalCards: number;
  releaseDate: string;
}

// Default sets to show the first time a user visits
const DEFAULT_SETS: ActiveSet[] = [
  { id: "xy5",       name: "Primal Clash",       series: "XY Series",        totalCards: 164, releaseDate: "Feb 2015" },
  { id: "base1",     name: "Base Set",           series: "Base Series",      totalCards: 102, releaseDate: "Jan 1999" },
  { id: "sv8pt5",    name: "Prismatic Evolutions", series: "Scarlet & Violet", totalCards: 258, releaseDate: "Jan 2025" },
]

export function getActiveSets(): ActiveSet[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(ACTIVE_SETS_KEY)
    if (!raw) {
      // Save and return the defaults on first load
      saveActiveSets(DEFAULT_SETS)
      return DEFAULT_SETS
    }
    return JSON.parse(raw) as ActiveSet[]
  } catch { 
    return DEFAULT_SETS 
  }
}

export function saveActiveSets(sets: ActiveSet[]): void {
  if (typeof window === "undefined") return
  try { localStorage.setItem(ACTIVE_SETS_KEY, JSON.stringify(sets)) } catch {}
}

export function removeActiveSet(setId: string): void {
  const currentSets = getActiveSets();
  const updatedSets = currentSets.filter(set => set.id !== setId);
  saveActiveSets(updatedSets);
}
