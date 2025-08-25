"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"

export type RewardTotals = { xp: number; diamonds: number } | null

// Optional card payload when a card is granted as part of rewards
export type GrantedCard = {
  id: string
  name: string
  rarity: string
  category?: string | null
  image: string
  securePreviewUrl?: string
  secureFullImageUrl?: string
} | null

export type PostSessionArgs = {
  gameKey: string
  score?: number
  correctCount?: number
  durationSec?: number
  bonusXP?: number
  // allow passing additional fields like difficulty, etc.
  extra?: Record<string, any>
}

export function useGameRewards() {
  const { data: session, update } = useSession()
  const { toast } = useToast()

  const [reward, setReward] = useState<RewardTotals>(null)
  const [showReward, setShowReward] = useState(false)
  const [prevXP, setPrevXP] = useState<number | null>(null)
  const [prevDiamonds, setPrevDiamonds] = useState<number | null>(null)

  // Card reward flow
  const [grantedCard, setGrantedCard] = useState<GrantedCard>(null)
  const [showCardReveal, setShowCardReveal] = useState(false)

  const postSession = async ({ gameKey, score = 0, correctCount = 0, durationSec = 0, bonusXP, extra = {} }: PostSessionArgs) => {
    // Open modal immediately with current totals; server values will replace shortly
    setPrevXP((session?.user as any)?.experience ?? 0)
    setPrevDiamonds((session?.user as any)?.currentDiamonds ?? 0)
    setShowReward(true)

    try {
      const res = await fetch("/api/games/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameKey, score, correctCount, durationSec, ...(typeof bonusXP === "number" ? { bonusXP } : {}), ...extra }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data = await res.json().catch(() => ({}))
      const xp = data?.rewards?.xp ?? 0
      const diamonds = data?.rewards?.diamonds ?? 0
      const beforeXP = data?.totals?.before?.xp
      const beforeDiamonds = data?.totals?.before?.diamonds
      const afterXP = data?.totals?.after?.xp
      const afterDiamonds = data?.totals?.after?.diamonds

      setReward({ xp, diamonds })
      if (typeof beforeXP === "number") setPrevXP(beforeXP)
      if (typeof beforeDiamonds === "number") setPrevDiamonds(beforeDiamonds)

      try {
        if (typeof afterXP === "number" || typeof afterDiamonds === "number") {
          await update?.({
            experience: typeof afterXP === "number" ? afterXP : ((session?.user as any)?.experience ?? 0) + xp,
            currentDiamonds: typeof afterDiamonds === "number" ? afterDiamonds : ((session?.user as any)?.currentDiamonds ?? 0) + diamonds,
          })
        } else {
          const curXP = (session?.user as any)?.experience ?? 0
          const curDiamonds = (session?.user as any)?.currentDiamonds ?? 0
          await update?.({ experience: curXP + xp, currentDiamonds: curDiamonds + diamonds })
        }
      } catch {
        // keep modal open even if update fails
      }
    } catch (e) {
      console.error("Failed to post game session", e)
      toast({
        title: "Session save failed",
        description: "We couldn't record your game session. Your progress may not update.",
        variant: "destructive",
      })
    }
  }

  /**
   * Optionally grant a card after a game is completed.
   * Does not auto-open the XP/diamonds modal; call postSession() for that.
   */
  const grantCardReward = async ({ category, sourceGame }: { category?: string; sourceGame?: string } = {}) => {
    try {
      const res = await fetch("/api/cards/grant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, sourceGame }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        if (res.status === 429) {
          toast({
            title: "Daily limit reached",
            description: "You can earn up to 3 card rewards per day. Come back tomorrow!",
            variant: "destructive",
          })
          return
        }
        throw new Error(err?.error || `HTTP ${res.status}`)
      }
      const data = await res.json().catch(() => ({}))
      const card = data?.card
      if (card) {
        setGrantedCard({
          id: card.id,
          name: card.name,
          rarity: card.rarity,
          category: card.category,
          image: card.image,
          securePreviewUrl: card.securePreviewUrl,
          secureFullImageUrl: card.secureFullImageUrl,
        })
        setShowCardReveal(true)
      }
    } catch (e) {
      console.error("Failed to grant card", e)
      toast({
        title: "Card reward failed",
        description: "We couldn't grant a card reward right now. Please try again later.",
        variant: "destructive",
      })
    }
  }

  return {
    // state
    reward,
    showReward,
    setShowReward,
    prevXP,
    prevDiamonds,
    grantedCard,
    showCardReveal,
    setShowCardReveal,
    // actions
    postSession,
    grantCardReward,
  }
}
