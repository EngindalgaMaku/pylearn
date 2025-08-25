"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export type Reward = { xp: number; diamonds: number } | null

type RewardDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  prevXP: number | null
  prevDiamonds: number | null
  reward: Reward
  primaryLabel?: string
  onPrimary?: () => void
  secondaryLabel?: string
  secondaryHref?: string
}

export default function RewardDialog({
  open,
  onOpenChange,
  prevXP,
  prevDiamonds,
  reward,
  primaryLabel = "Close",
  onPrimary,
  secondaryLabel = "More Games",
  secondaryHref = "/games",
}: RewardDialogProps) {
  const beforeXP = prevXP ?? 0
  const beforeDiamonds = prevDiamonds ?? 0
  const gainedXP = reward?.xp ?? 0
  const gainedDiamonds = reward?.diamonds ?? 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">Rewards Unlocked! 🎉</DialogTitle>
          <DialogDescription className="text-center">Keep playing to earn more XP and diamonds.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <div className="rounded-lg border p-3 bg-primary/5 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><span className="text-2xl">⭐</span><span className="font-medium">XP</span></div>
                <div className="text-right"><div className="text-sm text-muted-foreground">Before</div><div className="font-semibold">{beforeXP}</div></div>
              </div>
              <div className="mt-2 flex items-center justify-center gap-2 text-primary"><span className="text-xs uppercase tracking-wide">+ Gained</span><span className="font-bold">{gainedXP}</span></div>
              <div className="mt-2 text-center text-sm text-muted-foreground">=<span className="ml-2 font-semibold text-foreground">{beforeXP + gainedXP}</span></div>
            </div>
            <div className="rounded-lg border p-3 bg-secondary/10 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><span className="text-2xl">💎</span><span className="font-medium">Diamonds</span></div>
                <div className="text-right"><div className="text-sm text-muted-foreground">Before</div><div className="font-semibold">{beforeDiamonds}</div></div>
              </div>
              <div className="mt-2 flex items-center justify-center gap-2 text-primary"><span className="text-xs uppercase tracking-wide">+ Gained</span><span className="font-bold">{gainedDiamonds}</span></div>
              <div className="mt-2 text-center text-sm text-muted-foreground">=<span className="ml-2 font-semibold text-foreground">{beforeDiamonds + gainedDiamonds}</span></div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={onPrimary ?? (() => onOpenChange(false))}>{primaryLabel}</Button>
            <Link href={secondaryHref} className="flex-1"><Button variant="outline" className="w-full">{secondaryLabel}</Button></Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
