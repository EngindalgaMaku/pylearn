"use client"

import Image from "next/image"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

export type GrantedCard = {
  id: string
  name: string
  rarity: string
  category?: string | null
  image: string
  securePreviewUrl?: string
  secureFullImageUrl?: string
}

type CardRevealDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  card: GrantedCard | null
  onPrimary?: () => void
  primaryLabel?: string
  secondaryLabel?: string
  onSecondary?: () => void
}

export default function CardRevealDialog({
  open,
  onOpenChange,
  card,
  onPrimary,
  onSecondary,
  primaryLabel = "Add to Collection",
  secondaryLabel = "View Collection",
}: CardRevealDialogProps) {
  const [revealed, setRevealed] = useState(false)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    if (!open) {
      setRevealed(false)
      setAnimating(false)
    }
  }, [open])

  useEffect(() => {
    // reset when a new card arrives
    setRevealed(false)
    setAnimating(false)
  }, [card?.id])

  const rarity = (card?.rarity || "Common").toString()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">Anime Card Reward ✨</DialogTitle>
          <DialogDescription className="text-center">{rarity} • {card?.category || "Anime Collection"}</DialogDescription>
        </DialogHeader>
        {card && (
          <div className="space-y-4">
            {/* Reveal Area */}
            <div className="rounded-xl border bg-gradient-to-br from-purple-600/10 via-pink-500/10 to-amber-500/10 p-4">
              {!revealed ? (
                <button
                  onClick={() => {
                    setAnimating(true)
                    setTimeout(() => setRevealed(true), 450)
                  }}
                  className={`w-full h-[340px] rounded-lg bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),rgba(255,255,255,0)_60%),linear-gradient(120deg,rgba(147,51,234,0.18),rgba(219,39,119,0.18),rgba(245,158,11,0.18))] border shadow-inner flex flex-col items-center justify-center gap-3 text-center transition-transform duration-500 ${animating ? "scale-105 rotate-1" : "hover:scale-[1.02]"}`}
                >
                  <div className="text-5xl select-none">🎴✨</div>
                  <div className="font-semibold">Sürpriz Anime Kart Paketi</div>
                  <div className="text-xs text-muted-foreground">Açmak için tıklayın</div>
                </button>
              ) : (
                <div className="rounded-lg overflow-hidden border bg-muted/10 animate-in fade-in slide-in-from-top-2 duration-300">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={card.securePreviewUrl || card.image}
                    alt={card.name}
                    className="w-full h-[320px] object-contain bg-background"
                  />
                  <div className="p-3 text-center">
                    <div className="text-lg font-semibold">{card.name}</div>
                    <div className="text-xs text-muted-foreground">{rarity}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {!revealed ? (
                <>
                  <Button className="flex-1" onClick={() => { setAnimating(true); setTimeout(() => setRevealed(true), 450) }}>Hemen Aç</Button>
                  <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Sonra</Button>
                </>
              ) : (
                <>
                  <Button className="flex-1" onClick={onPrimary ?? (() => onOpenChange(false))}>{primaryLabel}</Button>
                  <Button variant="outline" className="flex-1" onClick={onSecondary}>{secondaryLabel}</Button>
                </>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
