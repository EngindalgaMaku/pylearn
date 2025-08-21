"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, Share2, CheckCircle, Code, Calendar, Trophy } from "lucide-react"

interface PythonTip {
  id: string
  title: string
  content: string
  codeExample: string
  category: string
  difficulty: "Beginner" | "Intermediate" | "Advanced"
  xpReward: number
  isLiked?: boolean
  isCompleted?: boolean
}

interface PythonTipWidgetProps {
  tip: PythonTip
}

export default function PythonTipWidget({ tip }: PythonTipWidgetProps) {
  const [isLiked, setIsLiked] = useState(tip.isLiked || false)
  const [isCompleted, setIsCompleted] = useState(tip.isCompleted || false)
  const [showCode, setShowCode] = useState(false)

  const handleInteraction = (type: "view" | "like" | "share" | "complete") => {
    console.log(`[v0] Daily tip interaction: ${type} on tip ${tip.id}`)

    if (type === "like") {
      setIsLiked(!isLiked)
    } else if (type === "complete") {
      setIsCompleted(true)
    }

    // In real app, this would call an API to update user progress
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner":
        return "bg-green-100 text-green-800"
      case "Intermediate":
        return "bg-yellow-100 text-yellow-800"
      case "Advanced":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card className="w-full bg-gradient-to-br from-slate-900 to-slate-800 text-white border-slate-700">
      <CardHeader className="p-4 md:p-6 pb-2 md:pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3 md:h-4 md:w-4 text-blue-400" />
            <span className="text-xs md:text-sm text-blue-400 font-medium">Daily Python Tip</span>
          </div>
          <Badge className={getDifficultyColor(tip.difficulty)}>{tip.difficulty}</Badge>
        </div>
        <CardTitle className="text-base md:text-lg font-semibold text-white">{tip.title}</CardTitle>
        <Badge variant="outline" className="w-fit text-[10px] md:text-xs px-1.5 py-0.5 border-slate-600 text-slate-300">
          {tip.category}
        </Badge>
      </CardHeader>

      <CardContent className="p-4 md:p-6 space-y-3 md:space-y-4">
        <p className="text-slate-300 text-xs md:text-sm leading-relaxed">{tip.content}</p>

        <div className="space-y-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCode(!showCode)}
            className="w-full h-9 md:h-10 text-xs md:text-sm border-slate-300 bg-white text-slate-900 hover:bg-slate-100 font-semibold"
          >
            <Code className="h-4 w-4 mr-2" />
            {showCode ? "Hide Code" : "Show Code Example"}
          </Button>

          {showCode && (
            <div className="bg-slate-950 rounded-lg p-3 md:p-4 border border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex gap-1">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <span className="text-xs text-slate-400 ml-2">Python</span>
              </div>
              <pre className="text-xs md:text-sm text-green-400 font-mono overflow-x-auto">
                <code>{tip.codeExample}</code>
              </pre>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-1 md:pt-2 border-t border-slate-700">
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleInteraction("like")}
              className={`text-slate-400 hover:text-red-400 ${isLiked ? "text-red-400" : ""}`}
            >
              <Heart className={`h-4 w-4 mr-1 ${isLiked ? "fill-current" : ""}`} />
              Like
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleInteraction("share")}
              className="text-slate-400 hover:text-blue-400"
            >
              <Share2 className="h-4 w-4 mr-1" />
              Share
            </Button>

            {!isCompleted && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleInteraction("complete")}
                className="text-slate-400 hover:text-green-400"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Complete
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isCompleted && (
              <Badge className="bg-green-600 text-white">
                <Trophy className="h-3 w-3 mr-1" />
                Completed
              </Badge>
            )}
            <span className="text-[10px] md:text-xs text-slate-400">+{tip.xpReward} XP</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
