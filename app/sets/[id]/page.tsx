"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import Image from "next/image"
import { Header } from "@/components/header"
import { BinderView } from "@/components/binder-view"
import { RarityBreakdown } from "@/components/rarity-breakdown"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { ArrowLeft, Search, Trash2, ArrowUpDown, Heart, AlertTriangle } from "lucide-react"
import { loadOwnedCards, saveOwnedCards, loadWishlist, saveWishlist } from "@/lib/collection"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

type SortOption = "number-asc" | "number-desc" | "alpha" | "owned" | "missing"

interface PokemonCard {
  id: string
  name: string
  number: string
  rarity: string
  variant: "standard" | "reverse_holo"
  isReverseHolo: boolean
  images: {
    small: string
    large: string
  }
}

interface PokemonSet {
  id: string
  name: string
  series: string
  printedTotal: number
  total: number
  releaseDate: string
  images: {
    symbol: string
    logo: string
  }
}

interface SetStats {
  totalCards: number
  regularCards: number
  secretCards: number
}

export default function SetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const setId = resolvedParams.id

  const [set, setSet] = useState<PokemonSet | null>(null)
  const [cards, setCards] = useState<PokemonCard[]>([])
  const [stats, setStats] = useState<SetStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ownedCards, setOwnedCards] = useState<Set<string>>(new Set())
  const [wishlist, setWishlist] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "binder">("grid")
  const [sortBy, setSortBy] = useState<SortOption>("number-asc")
  const [showWishlistOnly, setShowWishlistOnly] = useState(false)
  const [saveIndicator, setSaveIndicator] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // --- BLOCK 1: Syncs your checkmarks with the Cloud ---
  useEffect(() => {
    // 1. Instantly load from local storage so the page doesn't feel slow
    setOwnedCards(loadOwnedCards(setId))
    setWishlist(loadWishlist(setId))

    // 2. Secretly fetch the real data from the Cloud in the background
    async function fetchCloudOwned() {
      try {
        const res = await fetch(`/api/owned-cards?setId=${setId}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data.cards) {
            const cloudSet = new Set<string>(data.cards);
            setOwnedCards(cloudSet);
            saveOwnedCards(setId, cloudSet); // Update local backup with cloud truth
          }
        }
      } catch (e) {
        console.error("Failed to sync with cloud", e);
      }
    }
    fetchCloudOwned();
  }, [setId])

  // --- BLOCK 2: Fetches the actual Pokemon Cards and STOPS the spinner! ---
  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(`/api/pokemon/sets/${setId}`)
        if (!response.ok) throw new Error("Failed to fetch set data")
        const data = await response.json()
        setSet(data.set)
        setCards(data.cards || [])
        setStats(data.stats)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false) // THIS turns off the infinite spinner!
      }
    }
    fetchData()
  }, [setId])

  const flashSaveIndicator = () => {
    setSaveIndicator(true)
    setTimeout(() => setSaveIndicator(false), 1200)
  }

  const toggleOwned = async (cardId: string) => {
    setOwnedCards((prev) => {
      const next = new Set(prev)
      const isAdding = !next.has(card
