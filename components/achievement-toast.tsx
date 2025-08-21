"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"

interface AchievementToastProps {
  achievement: {
    title: string
    description: string
    icon: string
    xp: number
  } | null
  onClose: () => void
}

export function AchievementToast({ achievement, onClose }: AchievementToastProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (achievement) {
      setIsVisible(true)
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(onClose, 300) // Wait for animation to complete
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [achievement, onClose])

  if (!achievement) return null

  return (
    <div
      className={`fixed top-4 left-4 right-4 z-50 transition-all duration-300 ${
        isVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
      }`}
    >
      <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                <span className="text-2xl">{achievement.icon}</span>
              </div>
              <div>
                <p className="font-medium text-sm">Achievement Unlocked!</p>
                <p className="text-xs font-bold">{achievement.title}</p>
                <p className="text-xs text-muted-foreground">{achievement.description}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <button onClick={() => setIsVisible(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
              <Badge variant="secondary" className="text-xs">
                +{achievement.xp} XP
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
