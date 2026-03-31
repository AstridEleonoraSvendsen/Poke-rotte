// Collection storage helpers
// Owned cards are saved per-set in localStorage under the key "owned:{setId}"
// e.g. "owned:xy5" => ["xy5-1", "xy5-2-reverse", ...]

const STORAGE_PREFIX = "owned:"
const WISHLIST_PREFIX = "wishlist:"

// ─── Owned cards ────────────────────────────────────────────────────────────

export function loadOwnedCards(setId: string): Set<string> {
  if (typeof window === "undefined") return new Set()
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + setId)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw)
    return new Set(Array.isArray(parsed) ? parsed : [])
  } catch {
    return new Set()
  }
}

export function saveOwnedCards(setId: string, owned: Set<string>): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_PREFIX + setId, JSON.stringify([...owned]))
  } catch {
    // localStorage can be unavailable in some browser configs — fail silently
  }
}

// ─── Wishlist ────────────────────────────────────────────────────────────────

export function loadWishlist(setId: string): Set<string> {
  if (typeof window === "undefined") return new Set()
  try {
    const raw = localStorage.getItem(WISHLIST_PREFIX + setId)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw)
    return new Set(Array.isArray(parsed) ? parsed : [])
  } catch {
    return new Set()
  }
}

export function saveWishlist(setId: string, wishlist: Set<string>): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(WISHLIST_PREFIX + setId, JSON.stringify([...wishlist]))
  } catch {}
}

// ─── Summary (for homepage stats) ───────────────────────────────────────────

/** Returns how many cards are owned for a given set, reading from localStorage. */
export function getOwnedCount(setId: string): number {
  return loadOwnedCards(setId).size
}

/**
 * Reads all "owned:*" keys from localStorage and returns a map of
 * setId → ownedCount. Useful for the homepage overview.
 */
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
