"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowLeft, ShoppingCart, Sparkles, Star, Shield, Zap, Sword, ChevronDown, ChevronUp, X } from "lucide-react"
import { useSession } from "next-auth/react"
import { toast } from "@/hooks/use-toast"

type RarityBucket =
  | "Common"
  | "Uncommon"
  | "Rare"
  | "SuperRare"
  | "UltraRare"
  | "Epic"
  | "Legendary"
  | "Mythic"

type CategorySlug = "anime-collection" | "star-collection" | "car-collection"

interface ShopCard {
  id: string
  name: string
  series: string
  rarity: string
  price: number
  image: string
  description: string
  category: CategorySlug
  specialAbility?: string | null
  // Powers
  attackPower?: number | null
  defense?: number | null
  speed?: number | null
  element?: string | null
  // Secure image URLs from API (for lightbox/preview)
  securePreviewUrl?: string
  secureFullImageUrl?: string
}


const rarityStyles: Record<
  RarityBucket,
  {
    badge: string
    ring: string
    glow: string
    icon: string
  }
> = {
  Common: {
    badge: "bg-gradient-to-r from-slate-200 to-slate-300 text-slate-800 shadow-sm",
    ring: "ring-1 ring-slate-300",
    glow: "shadow-[0_0_0_0_rgba(0,0,0,0)]",
    icon: "⚪",
  },
  Uncommon: {
    badge: "bg-gradient-to-r from-emerald-400 to-green-500 text-white shadow-md",
    ring: "ring-2 ring-emerald-400",
    glow: "shadow-[0_0_20px_0_rgba(16,185,129,0.35)]",
    icon: "🟢",
  },
  Rare: {
    badge: "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md",
    ring: "ring-2 ring-blue-400",
    glow: "shadow-[0_0_20px_0_rgba(59,130,246,0.35)]",
    icon: "🔷",
  },
  SuperRare: {
    badge: "bg-gradient-to-r from-indigo-500 to-pink-500 text-white shadow-md",
    ring: "ring-2 ring-indigo-400",
    glow: "shadow-[0_0_24px_0_rgba(99,102,241,0.35)]",
    icon: "🟪",
  },
  UltraRare: {
    badge: "bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md",
    ring: "ring-2 ring-teal-400",
    glow: "shadow-[0_0_24px_0_rgba(20,184,166,0.35)]",
    icon: "💎",
  },
  Epic: {
    badge: "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-md",
    ring: "ring-2 ring-violet-400",
    glow: "shadow-[0_0_24px_0_rgba(139,92,246,0.35)]",
    icon: "💠",
  },
  Legendary: {
    badge: "bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500 text-black font-semibold shadow-md",
    ring: "ring-2 ring-amber-400",
    glow: "shadow-[0_0_28px_0_rgba(245,158,11,0.35)]",
    icon: "🌟",
  },
  Mythic: {
    badge: "bg-gradient-to-r from-rose-600 via-red-500 to-orange-500 text-white font-semibold shadow-md",
    ring: "ring-2 ring-rose-500",
    glow: "shadow-[0_0_32px_0_rgba(244,63,94,0.40)]",
    icon: "🔶",
  },
}

// Treat series values that look like category labels/slugs as category-like, so we can hide them
function isCategoryLike(value?: string | null): boolean {
  if (!value) return false
  const v = value.trim().toLowerCase().replace(/[_-]+/g, " ")
  const known = new Set<string>([
    "anime collection",
    "star collection",
    "car collection",
    "anime",
    "star",
    "car",
  ])
  return known.has(v)
}

// Element icon styles (show colored icon instead of raw text like AIR/ICE/EARTH)
function getElementStyle(el?: string | null) {
  const v = (el || "").toLowerCase().trim()

  // Synonym normalization
  if (["flame", "ember", "inferno"].includes(v)) return { icon: "🔥", bg: "bg-red-500/90", ring: "ring-1 ring-red-400/70" }
  if (["ocean", "sea", "aqua"].includes(v)) return { icon: "💧", bg: "bg-blue-500/90", ring: "ring-1 ring-blue-400/70" }
  if (["rock", "stone", "ground", "terra"].includes(v)) return { icon: "🪨", bg: "bg-amber-700/90", ring: "ring-1 ring-amber-600/70" }
  if (["wind", "breeze", "sky"].includes(v)) return { icon: "🌬️", bg: "bg-sky-400/90", ring: "ring-1 ring-sky-300/70" }
  if (["frost", "snow", "glacier"].includes(v)) return { icon: "❄️", bg: "bg-cyan-500/90", ring: "ring-1 ring-cyan-300/70" }
  if (["holy", "radiant"].includes(v)) return { icon: "☀️", bg: "bg-yellow-400/90", ring: "ring-1 ring-yellow-300/70" }
  if (["dark", "void"].includes(v)) return { icon: "🌑", bg: "bg-gray-800/90", ring: "ring-1 ring-gray-600/70" }
  if (["electric", "thunder", "storm", "lightning"].includes(v)) return { icon: "⚡", bg: "bg-yellow-500/90", ring: "ring-1 ring-yellow-400/70" }

  switch (v) {
    case "fire":
      return { icon: "🔥", bg: "bg-red-500/90", ring: "ring-1 ring-red-400/70" }
    case "water":
      return { icon: "💧", bg: "bg-blue-500/90", ring: "ring-1 ring-blue-400/70" }
    case "earth":
      return { icon: "🪨", bg: "bg-amber-700/90", ring: "ring-1 ring-amber-600/70" }
    case "air":
      return { icon: "🌬️", bg: "bg-sky-400/90", ring: "ring-1 ring-sky-300/70" }
    case "ice":
      return { icon: "❄️", bg: "bg-cyan-500/90", ring: "ring-1 ring-cyan-300/70" }
    case "light":
      return { icon: "☀️", bg: "bg-yellow-400/90", ring: "ring-1 ring-yellow-300/70" }
    case "shadow":
      return { icon: "🌑", bg: "bg-gray-800/90", ring: "ring-1 ring-gray-600/70" }
    case "neutral":
      return { icon: "⚪", bg: "bg-slate-400/90", ring: "ring-1 ring-slate-300/70" }
    default:
      // Fallback to a Neutral look so every card always has an element chip
      return { icon: "⚪", bg: "bg-slate-400/90", ring: "ring-1 ring-slate-300/70" }
  }
}

// Normalize upstream rarity strings to our style keys
function normalizeRarityBucket(r: string | undefined | null): RarityBucket {
  const raw = (r || "").toString().trim()
  const v = raw.replace(/[_-]+/g, " ").replace(/\s+/g, " ").toUpperCase()

  // Map a wide range of inputs to our style buckets
  const map: Record<string, RarityBucket> = {
    COMMON: "Common",
    NORMAL: "Common",
    N: "Common",

    UNCOMMON: "Uncommon",
    UC: "Uncommon",

    RARE: "Rare",
    R: "Rare",

    "SUPER RARE": "SuperRare",
    SUPERRARE: "SuperRare",
    SR: "SuperRare",

    "ULTRA RARE": "UltraRare",
    ULTRARARE: "UltraRare",
    UR: "UltraRare",

    EPIC: "Epic",
    E: "Epic",
    SSR: "Epic",

    LEGENDARY: "Legendary",
    LEGEND: "Legendary",

    MYTHIC: "Mythic",
    MYTHICAL: "Mythic",
  }

  return map[v] ?? "Common"
}

export default function ShopPage() {
  const { data: session, update } = useSession()
  const [userDiamonds, setUserDiamonds] = useState<number | null>(null)
  const [ownedCards, setOwnedCards] = useState<string[]>([])
  const [purchaseLoadingId, setPurchaseLoadingId] = useState<string | null>(null)
  const categories: { value: CategorySlug; label: string }[] = [
    { value: "anime-collection", label: "Anime Collection" },
    { value: "star-collection", label: "Star Collection" },
    { value: "car-collection", label: "Car Collection" },
  ]

  const [selectedCategory, setSelectedCategory] = useState<CategorySlug>("anime-collection")
  const [categoryPreviews, setCategoryPreviews] = useState<Record<CategorySlug, string>>({
    "anime-collection": "/placeholder.svg",
    "star-collection": "/placeholder.svg",
    "car-collection": "/placeholder.svg",
  })
  const [cards, setCards] = useState<ShopCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(12)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Lightbox for image expand
  const [lightbox, setLightbox] = useState<{ open: boolean; src: string; alt: string }>({
    open: false,
    src: "",
    alt: "",
  })

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setLightbox({ open: false, src: "", alt: "" })
      }
    }
    if (lightbox.open) {
      window.addEventListener("keydown", onKey)
    }
    return () => window.removeEventListener("keydown", onKey)
  }, [lightbox.open])

  // Prefetch one thumbnail per category to use as the tile background
  useEffect(() => {
    let isCancelled = false
    async function loadPreviews() {
      try {
        const results = await Promise.all(
          categories.map(async (cat) => {
            try {
              const res = await fetch(`/api/cards?category=${cat.value}&page=1&pageSize=1`, { cache: "no-store" })
              if (!res.ok) return { slug: cat.value, img: "/placeholder.svg" }
              const data = await res.json()
              const first = data.items?.[0]
              return { slug: cat.value, img: first?.image || "/placeholder.svg" }
            } catch {
              return { slug: cat.value, img: "/placeholder.svg" }
            }
          }),
        )
        if (!isCancelled) {
          const next: any = {}
          results.forEach((r) => (next[r.slug as CategorySlug] = r.img))
          setCategoryPreviews((prev) => ({ ...prev, ...next }))
        }
      } catch {
        // ignore
      }
    }
    loadPreviews()
    return () => {
      isCancelled = true
    }
  }, [])

  // Initialize diamonds from session (when available)
  useEffect(() => {
    const cd = (session?.user as any)?.currentDiamonds
    if (typeof cd === "number") setUserDiamonds(cd)
  }, [session])

  // Load owned card ids for current user
  useEffect(() => {
    let cancelled = false
    async function loadOwned() {
      try {
        const res = await fetch("/api/user/cards", { cache: "no-store" })
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled && Array.isArray(data.items)) setOwnedCards(data.items)
      } catch {
        // ignore
      }
    }
    // only fetch when we have a session (authenticated)
    if (session?.user) loadOwned()
    return () => {
      cancelled = true
    }
  }, [session])

  useEffect(() => {
    setLoading(true)
    setError(null)
    const url = `/api/cards?category=${selectedCategory}&page=${page}&pageSize=${pageSize}`
    fetch(url, { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data) => {
        setCards(data.items ?? [])
        setTotal(data.total ?? 0)
        setTotalPages(data.totalPages ?? 1)
      })
      .catch((err) => {
        console.error("Failed to load cards", err)
        setError("Failed to load cards")
      })
      .finally(() => setLoading(false))
  }, [selectedCategory, page, pageSize])

  // Reset to first page when category changes
  useEffect(() => {
    setPage(1)
  }, [selectedCategory])

  const filteredCards = cards

  const handlePurchase = async (card: ShopCard) => {
    if (purchaseLoadingId) return
    const canAfford = (userDiamonds ?? 0) >= card.price
    if (ownedCards.includes(card.id)) {
      toast({ title: "Already owned", description: `You already own ${card.name}.` })
      return
    }
    if (!canAfford) {
      toast({
        title: "Not enough diamonds",
        description: "Earn more diamonds in Activities to buy this card.",
        variant: "destructive",
      } as any)
      return
    }
    try {
      setPurchaseLoadingId(card.id)
      const res = await fetch("/api/cards/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId: card.id }),
      })
      if (!res.ok) {
        let msg = "Purchase failed. Please try again."
        try {
          const err = await res.json()
          if (err?.error) msg = err.error
        } catch {}
        toast({ title: "Purchase failed", description: msg, variant: "destructive" } as any)
        return
      }
      const data = await res.json()
      const newDiamonds = data?.currentDiamonds
      if (typeof newDiamonds === "number") {
        setUserDiamonds(newDiamonds)
        // propagate to session so other parts of app update
        try {
          await update?.({ user: { currentDiamonds: newDiamonds } } as any)
        } catch {
          // ignore
        }
      }
      setOwnedCards((prev) => (prev.includes(card.id) ? prev : [...prev, card.id]))
      toast({ title: "Purchased", description: `${card.name} added to your collection! 💎` })
    } catch (e) {
      toast({ title: "Network error", description: "Could not complete purchase.", variant: "destructive" } as any)
    } finally {
      setPurchaseLoadingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-6 md:hidden">
        <div className="max-w-md mx-auto flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-primary">Card Shop</h1>
            <p className="text-sm text-muted-foreground">Spend your diamonds on awesome cards!</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto md:max-w-4xl lg:max-w-6xl px-4 py-8 space-y-6">
        {/* Diamond Balance */}
        <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-lg font-bold text-yellow-800">{typeof userDiamonds === "number" ? userDiamonds : "—"} 💎</p>
                  <p className="text-sm text-yellow-600">Available Diamonds</p>
                </div>
              </div>
              <Link href="/activities">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-yellow-300 text-yellow-700 hover:bg-yellow-50 bg-transparent"
                >
                  Earn More
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Category Selector (image tiles) */}
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          {categories.map((c) => (
            <button
              key={c.value}
              onClick={() => {
                setSelectedCategory(c.value)
                setPage(1)
              }}
              className={`relative aspect-[16/9] rounded-lg overflow-hidden border transition-all ${
                selectedCategory === c.value ? "ring-2 ring-primary shadow-lg" : "hover:shadow-md"
              }`}
            >
              <img
                src={categoryPreviews[c.value] || "/placeholder.svg"}
                alt={c.label}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                <span className="text-white font-semibold drop-shadow">{c.label}</span>
                {selectedCategory === c.value && (
                  <Badge className="bg-primary text-primary-foreground border-0">Selected</Badge>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Cards */}
        <div className="mt-6">
          {error && <div className="text-sm text-red-600 mb-3">Failed to load cards. Please try again.</div>}
          {loading && <div className="text-sm text-muted-foreground mb-3">Loading cards...</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {filteredCards.map((card) => {
              const isOwned = ownedCards.includes(card.id)
              const canAfford = (userDiamonds ?? 0) >= card.price
              const displayRarity = (card.rarity ?? "Common").toString().trim()
              const bucket = normalizeRarityBucket(card.rarity as string)
              const rs = rarityStyles[bucket] ?? rarityStyles["Common"]
              const es = getElementStyle(card.element)

              return (
                <Card
                  key={card.id}
                  className={`relative overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5 ${rs.ring} ${rs.glow} ${
                    isOwned ? "ring-2 ring-green-500" : "border"
                  }`}
                >
                  {isOwned && (
                    <div className="absolute top-2 right-2 z-10">
                      <Badge className="bg-green-500 text-white">✓ Owned</Badge>
                    </div>
                  )}

                  <div
                    className="aspect-[3/4] relative overflow-hidden cursor-zoom-in"
                    onClick={() => {
                      // Prefer secure preview/full for lightbox
                      const preview = (card as any).securePreviewUrl || (card as any).secureFullImageUrl || card.image
                      if (!preview || preview.includes("placeholder.svg")) return
                      setLightbox({ open: true, src: preview, alt: card.name })
                    }}
                    role="button"
                    aria-label={`Expand image for ${card.name}`}
                  >
                    <img
                      src={card.image || "/placeholder.svg"}
                      alt={card.name}
                      className="w-full h-full object-cover transform transition-transform duration-300 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                    <div className="absolute top-2 left-2">
                      <Badge className={`${rs.badge} border-0`}>
                        {rs.icon} {displayRarity}
                      </Badge>
                    </div>
                    {/* Price pill overlay */}
                    <div className="absolute bottom-2 right-2">
                      <div className="flex items-center gap-1 rounded-full bg-yellow-500/95 text-white px-3 py-1.5 shadow-md">
                        <Sparkles className="w-4 h-4" />
                        <span className="font-semibold">{card.price}</span>
                      </div>
                    </div>
                  </div>

                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{card.name}</CardTitle>
                    {!isCategoryLike(card.series) && (
                      <CardDescription className="text-sm">{card.series}</CardDescription>
                    )}
                  </CardHeader>

                  <CardContent className="pt-0">
                    {/* Short description */}
                    {card.description && card.description.trim().length > 0 && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{card.description}</p>
                    )}

                    {/* Special Ability block */}
                    {card.specialAbility && card.specialAbility.trim().length > 0 && (
                      <div className="mb-3 rounded-md border border-purple-200 bg-purple-50 px-3 py-2">
                        <div className="flex items-center gap-2 text-purple-700 font-semibold text-[11px] uppercase tracking-wide">
                          <Sparkles className="w-3 h-3" />
                          <span>Special Ability</span>
                        </div>
                        <div className="mt-1 text-sm text-purple-900">
                          {card.specialAbility}
                        </div>
                      </div>
                    )}

                    {/* Powers row */}
                    {(card.attackPower != null || card.defense != null || card.speed != null || card.element) && (
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        {card.attackPower != null && (
                          <div className="inline-flex items-center gap-1 rounded-md bg-slate-50 border border-slate-200 px-2 py-1 text-xs text-slate-700">
                            <Sword className="w-3.5 h-3.5 text-slate-600" />
                            <span className="font-semibold">{card.attackPower}</span>
                          </div>
                        )}
                        {card.defense != null && (
                          <div className="inline-flex items-center gap-1 rounded-md bg-slate-50 border border-slate-200 px-2 py-1 text-xs text-slate-700">
                            <Shield className="w-3.5 h-3.5 text-slate-600" />
                            <span className="font-semibold">{card.defense}</span>
                          </div>
                        )}
                        {card.speed != null && (
                          <div className="inline-flex items-center gap-1 rounded-md bg-slate-50 border border-slate-200 px-2 py-1 text-xs text-slate-700">
                            <Zap className="w-3.5 h-3.5 text-slate-600" />
                            <span className="font-semibold">{card.speed}</span>
                          </div>
                        )}
                        {es && (
                          <div className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-white ${es.bg} ${es.ring}`}>
                            <span>{es.icon}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Purchase row (price shown in image overlay now) */}
                    <div className="flex items-center justify-end">
                      <Button
                        onClick={() => handlePurchase(card)}
                        disabled={isOwned || !canAfford || purchaseLoadingId === card.id}
                        size="sm"
                        className={`${isOwned ? "bg-green-500 hover:bg-green-600" : ""}`}
                      >
                        {isOwned ? (
                          <>✓ Owned</>
                        ) : !canAfford ? (
                          <>💎 Need More</>
                        ) : purchaseLoadingId === card.id ? (
                          <>Processing…</>
                        ) : (
                          <>
                            <ShoppingCart className="w-4 h-4 mr-1" />
                            Buy
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Page {page} of {totalPages} • {total} items
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(1)}
                disabled={page === 1 || loading}
                aria-label="Go to first page"
                title="First"
              >
                First
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                aria-label="Go to previous page"
                title="Previous"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
                aria-label="Go to next page"
                title="Next"
              >
                Next
              </Button>
            </div>
          </div>
        </div>

        {/* Collection Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              Your Collection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{ownedCards.length}</p>
                <p className="text-sm text-muted-foreground">Cards Owned</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-secondary">{total}</p>
                <p className="text-sm text-muted-foreground">Total Cards</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">
                  {total ? Math.round((ownedCards.length / total) * 100) : 0}%
                </p>
                <p className="text-sm text-muted-foreground">Collection</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {
                    ownedCards.filter(
                      (id) =>
                        cards.find((c) => c.id === id)?.rarity === "Legendary" ||
                        cards.find((c) => c.id === id)?.rarity === "Mythic",
                    ).length
                  }
                </p>
                <p className="text-sm text-muted-foreground">Rare Cards</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Lightbox overlay for expanded image */}
      {lightbox.open && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4"
          onClick={() => setLightbox({ open: false, src: "", alt: "" })}
          aria-modal="true"
          role="dialog"
          aria-label="Expanded card image"
        >
          <div
            className="relative max-w-7xl w-full max-h-[92vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-2 right-2 rounded-full bg-white/90 hover:bg-white text-slate-800 p-1 shadow"
              onClick={() => setLightbox({ open: false, src: "", alt: "" })}
              aria-label="Close"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={lightbox.src}
              alt={lightbox.alt}
              className="max-w-[95vw] max-h-[90vh] w-auto h-auto object-contain rounded-md shadow-lg"
            />
          </div>
        </div>
      )}

    </div>
  )
}
