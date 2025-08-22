import { useEffect, useRef, useState } from "react"

/**
 * useSpeedTimer manages per-question countdown and speed bonus accumulation.
 *
 * @param questionTime seconds per question
 * @param started game started flag
 * @param completed game completed flag
 * @param showResult whether current question result is being shown (pauses timer)
 * @param onTimeout callback when time reaches 0 while not showing result
 */
export function useSpeedTimer(
  questionTime: number,
  started: boolean,
  completed: boolean,
  showResult: boolean,
  onTimeout: () => void
) {
  const [timeLeft, setTimeLeft] = useState<number>(questionTime)
  const [bonusXP, setBonusXP] = useState<number>(0)
  const [lastBonus, setLastBonus] = useState<number>(0)
  const qStartRef = useRef<number | null>(null)

  useEffect(() => {
    if (!started || completed) return
    if (timeLeft <= 0 && !showResult) {
      onTimeout()
      return
    }
    if (!showResult) {
      const t = setTimeout(() => setTimeLeft(s => s - 1), 1000)
      return () => clearTimeout(t)
    }
  }, [timeLeft, started, completed, showResult, onTimeout])

  const markQuestionStart = () => {
    qStartRef.current = Date.now()
    setTimeLeft(questionTime)
    setLastBonus(0)
  }

  const resetTimer = () => setTimeLeft(questionTime)

  const registerAnswerCorrect = () => {
    const startedAt = qStartRef.current ?? Date.now()
    const elapsed = Math.max(0, Math.round((Date.now() - startedAt) / 1000))
    const half = Math.floor(questionTime / 2)
    let bonus = 0
    if (elapsed <= half) {
      bonus = Math.max(1, Math.min(5, half - elapsed + 1))
    }
    setLastBonus(bonus)
    if (bonus > 0) setBonusXP(b => b + bonus)
    return bonus
  }

  const resetBonuses = () => {
    setBonusXP(0)
    setLastBonus(0)
    qStartRef.current = null
  }

  return {
    timeLeft,
    setTimeLeft, // expose for rare needs
    bonusXP,
    lastBonus,
    markQuestionStart,
    resetTimer,
    registerAnswerCorrect,
    resetBonuses,
  }
}
