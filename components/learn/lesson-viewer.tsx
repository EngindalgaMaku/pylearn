"use client"

import { useState, type ReactNode } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, CheckCircle, Diamond, Trophy, Lightbulb } from "lucide-react"

// Lightweight rich text renderer with simple heading/list heuristics
function headerColor(label: string) {
  const key = label.trim().toLowerCase()
  if (key.startsWith("objective")) return "text-emerald-600"
  if (key.startsWith("prerequisite")) return "text-amber-600"
  if (key.includes("best") && key.includes("practice")) return "text-indigo-600"
  if (key.includes("pitfall")) return "text-rose-600"
  if (key.includes("reference")) return "text-sky-600"
  if (key.startsWith("cheatsheet") || key.includes("cheat sheet")) return "text-cyan-600"
  if (key.startsWith("function")) return "text-violet-600"
  if (key.startsWith("syntax")) return "text-purple-600"
  if (key.startsWith("example")) return "text-fuchsia-600"
  if (key.startsWith("practice")) return "text-teal-600"
  if (key.startsWith("summary")) return "text-slate-700"
  if (key.startsWith("introduction")) return "text-primary"
  if (key.startsWith("core concept")) return "text-primary"
  return "text-primary"
}

function RichContent({ text, cheatsheetCode, isCoreConcepts }: { text?: string; cheatsheetCode?: string; isCoreConcepts?: boolean }) {
  if (!text) return null

  // Inline header detection for lines like "Objectives: do X", "Prerequisites: ...", or "Functions"
  const INLINE_LABELS = [
    "functions?",
    "objectives?",
    "prerequisites?",
    "best\\s+practices",
    "common\\s+pitfalls",
    "cheatsheet",
    "cheat\\s*sheet",
    "references?",
    "syntax",
    "examples?",
    "practice",
    "summary",
    "introduction",
    "core\\s+concepts?",
  ]
  const INLINE_HEADER_REGEX = new RegExp(`^([\\t ]*)(${INLINE_LABELS.join("|")})(:?)\\s*`, "i")

  // Detect and linkify URLs; open in a new tab/window
  const URL_REGEX = /(https?:\/\/[^\s<>"'()]+)/gi
  function linkifyText(text: string) {
    const nodes: ReactNode[] = []
    let lastIndex = 0
    let match: RegExpExecArray | null
    URL_REGEX.lastIndex = 0
    let linkIdx = 0
    while ((match = URL_REGEX.exec(text)) !== null) {
      const start = match.index
      const raw = match[0]
      if (start > lastIndex) nodes.push(text.slice(lastIndex, start))
      let href = raw
      const trailing = href.match(/[)\].,;!?]+$/)?.[0] ?? ""
      if (trailing) href = href.slice(0, href.length - trailing.length)
      nodes.push(
        <a
          key={`lnk-${linkIdx++}-${start}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sky-600 hover:text-sky-700 underline underline-offset-2"
        >
          {href}
        </a>
      )
      if (trailing) nodes.push(trailing)
      lastIndex = start + raw.length
    }
    if (lastIndex < text.length) nodes.push(text.slice(lastIndex))
    return nodes
  }

  // Split into lines and group lists
  const lines = text.replace(/\r\n/g, "\n").split("\n")

  const blocks: Array<{ type: "heading" | "list" | "para"; content: string | string[]; level?: number; label?: string; ordered?: boolean }> = []
  let i = 0
  while (i < lines.length) {
    const raw = lines[i]
    const line = raw.trim()

    // Skip empty lines (but preserve paragraph breaks via blocks)
    if (line === "") {
      i++
      continue
    }

    // Markdown-style headings: #, ##, ###
    const md = line.match(/^(#{1,6})\s+(.*)$/)
    if (md) {
      const level = md[1].length
      const label = md[2].trim()
      blocks.push({ type: "heading", level, label, content: label })
      i++
      continue
    }

    // Colon headings: Title:
    const colon = line.match(/^(.+?):\s*$/)
    if (colon && colon[1].trim().length <= 80) {
      const label = colon[1].trim()
      blocks.push({ type: "heading", level: 3, label, content: label })
      i++
      continue
    }

    // Bullet/numbered list group
    if (/^[-*]\s+/.test(line) || /^\d+\.\s+/.test(line)) {
      const startIsOrdered = /^\d+\.\s+/.test(line)
      const items: string[] = []
      while (
        i < lines.length &&
        (startIsOrdered ? /^\d+\.\s+/.test(lines[i].trim()) : /^[-*]\s+/.test(lines[i].trim()))
      ) {
        const cur = lines[i].trim()
        items.push(cur.replace(startIsOrdered ? /^\d+\.\s+/ : /^[-*]\s+/, ""))
        i++
      }
      blocks.push({ type: "list", content: items, ordered: startIsOrdered })
      continue
    }

    // Paragraph: greedily collect until blank or next special block
    const paras: string[] = [raw]
    i++
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^(#{1,6})\s+/.test(lines[i].trim()) &&
      !/^(.+?):\s*$/.test(lines[i].trim()) &&
      !/^[-*]\s+/.test(lines[i].trim())
    ) {
      paras.push(lines[i])
      i++
    }
    blocks.push({ type: "para", content: paras.join("\n") })
  }

  return (
    <div className="space-y-3">
      {blocks.map((b, idx) => {
        if (b.type === "heading") {
          const color = headerColor(b.label || "")
          const cls = `mt-4 font-semibold ${color}`
          // render all headings as h4-like for compactness
          {
            const labelText = (b.label || "").trim()
            const isCheatHeading = /^(cheatsheet|cheat\s*sheet)$/i.test(labelText)
            return (
              <div key={idx} className="space-y-2">
                <div className={cls}>{linkifyText(labelText)}</div>
                {isCheatHeading && cheatsheetCode ? (
                  <div className="rounded-lg border border-slate-800 overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 bg-slate-900/70">
                      <span className="text-xs text-slate-300">Cheatsheet</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          try {
                            navigator.clipboard?.writeText(cheatsheetCode)
                          } catch {}
                        }}
                        className="text-xs text-slate-300 hover:text-white"
                      >
                        Copy
                      </Button>
                    </div>
                    <div className="bg-slate-900">
                      <pre className="text-sm text-slate-100 p-4 overflow-x-auto">
                        <code>{cheatsheetCode}</code>
                      </pre>
                    </div>
                  </div>
                ) : null}
              </div>
            )
          }
        }
        if (b.type === "list") {
          const items = b.content as string[]
          const ordered = (b as any).ordered
          return (
            <ul key={idx} className="space-y-2 list-none pl-0">
              {items.map((li, i2) => (
                <li
                  key={i2}
                  className={
                    `flex items-start gap-3 rounded-md px-3 py-2 ` +
                    (isCoreConcepts
                      ? "border border-blue-200/60 bg-blue-50/60 dark:border-blue-800 dark:bg-blue-950/20"
                      : "border border-border/50 bg-muted/30")
                  }
                >
                  <span
                    className={
                      ordered
                        ? `mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-white text-[10px] font-semibold ` +
                          (isCoreConcepts ? "bg-blue-600" : "bg-emerald-600")
                        : `mt-2 inline-flex h-2 w-2 rounded-full flex-shrink-0 ` +
                          (isCoreConcepts ? "bg-blue-500" : "bg-emerald-500")
                    }
                  >
                    {ordered ? i2 + 1 : null}
                  </span>
                  <div className={`text-sm ${isCoreConcepts ? "text-foreground font-medium" : "text-foreground/90"}`}>
                    {linkifyText(li)}
                  </div>
                </li>
              ))}
            </ul>
          )
        }
        // paragraph with inline header highlighting
        {
          const para = String(b.content)
          const plines = para.split("\n")
          return (
            <div key={idx} className="text-muted-foreground leading-relaxed">
              {plines.map((ln, li) => {
                const m = ln.match(INLINE_HEADER_REGEX)
                if (m) {
                  const indent = m[1] ?? ""
                  const labelRaw = m[2] ?? ""
                  const colon = m[3] ?? ""
                  const rest = ln.slice(m[0].length)
                  const color = headerColor(labelRaw)
                  const isCheatsheetHeader = /^(cheatsheet|cheat\s*sheet)$/i.test(labelRaw.trim())
                  return (
                    <div key={li} className="whitespace-pre-wrap">
                      {indent}
                      <span className={`font-semibold ${color}`}>{`${labelRaw.replace(/\s+/g, " ")}`}{colon}</span>
                      {rest ? " " : null}
                      {rest ? linkifyText(rest) : null}
                      {isCheatsheetHeader && cheatsheetCode ? (
                        <div className="rounded-lg border border-slate-800 overflow-hidden mt-2">
                          <div className="flex items-center justify-between px-3 py-2 bg-slate-900/70">
                            <span className="text-xs text-slate-300">Cheatsheet</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                try {
                                  navigator.clipboard?.writeText(cheatsheetCode)
                                } catch {}
                              }}
                              className="text-xs text-slate-300 hover:text-white"
                            >
                              Copy
                            </Button>
                          </div>
                          <div className="bg-slate-900">
                            <pre className="text-sm text-slate-100 p-4 overflow-x-auto">
                              <code>{cheatsheetCode}</code>
                            </pre>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )
                }
                {
                  const isImportant = !!isCoreConcepts && ln.trim() !== ""
                  return (
                    <div
                      key={li}
                      className={
                        isImportant
                          ? "flex items-start gap-2 rounded-md border border-blue-200/60 bg-blue-50/60 dark:border-blue-800 dark:bg-blue-950/20 px-3 py-2 whitespace-pre-wrap"
                          : "whitespace-pre-wrap"
                      }
                    >
                      {isImportant ? (
                        <Lightbulb className="mt-0.5 h-4 w-4 text-blue-600 flex-shrink-0" />
                      ) : null}
                      <div className={isImportant ? "text-sm text-foreground" : undefined}>
                        {linkifyText(ln)}
                      </div>
                    </div>
                  )
                }
              })}
            </div>
          )
        }
      })}
    </div>
  )
}

export type LessonSection = {
  title: string
  content: string
  codeExample?: string
}

export type LessonQuiz = {
  question: string
  options: string[]
  correctAnswer: number
  explanation?: string
}

export type LessonContent = {
  sections: LessonSection[]
  quiz?: LessonQuiz
}

export default function LessonViewer({
  title,
  description,
  difficulty,
  estimatedMinutes,
  xpReward,
  diamondReward,
  content,
  backHref = "/learn",
}: {
  title: string
  description?: string | null
  difficulty: number
  estimatedMinutes: number
  xpReward: number
  diamondReward: number
  content: LessonContent
  backHref?: string
}) {
  const [currentSection, setCurrentSection] = useState(0)
  const [showQuiz, setShowQuiz] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [completed, setCompleted] = useState(false)

  const totalSections = content.sections?.length ?? 0
  const progress = totalSections > 0 ? ((currentSection + 1) / totalSections) * 100 : 100

  const handleNext = () => {
    if (currentSection < totalSections - 1) {
      setCurrentSection(currentSection + 1)
    } else {
      setShowQuiz(true)
    }
  }

  const handlePrevious = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1)
    }
  }

  const handleQuizSubmit = () => {
    setShowResult(true)
    if (selectedAnswer !== null && content.quiz && selectedAnswer === content.quiz.correctAnswer) {
      setCompleted(true)
    }
  }

  const currentSectionData = content.sections?.[currentSection]

  // Remove placeholder filler texts entirely from rendering
  function stripPlaceholders(s?: string) {
    if (!s) return ""
    const t = s.trim()
    if (/^(No content available\.|No content provided\.|No example provided\.)$/i.test(t)) return ""
    return s
  }

  // Detect cheatsheet header in text and extract its following lines as code if no explicit codeExample
  // Accept "Cheatsheet:" and also "Cheatsheet: <some text>" on the same line
  const cheatHeaderRegex = /^\s*(cheatsheet|cheat\s*sheet)\s*:?.*$/i
  function extractCheatsheetFromText(text: string) {
    const lines = text.replace(/\r\n/g, "\n").split("\n")
    let idx = -1
    for (let k = 0; k < lines.length; k++) {
      if (cheatHeaderRegex.test(lines[k].trim())) {
        idx = k
        break
      }
    }
    if (idx === -1) {
      return { code: undefined as string | undefined, stripped: text, headerFound: false }
    }

    // Capture any inline content after the header label on the same line
    const headMatch = lines[idx].match(/^\s*(cheatsheet|cheat\s*sheet)\s*:?\s*(.*)$/i)
    const inlineTail = (headMatch?.[2] || "").trim()

    // Start after the header, allowing optional blank lines if no inline tail
    let j = idx + 1
    if (!inlineTail) {
      while (j < lines.length && lines[j].trim() === "") {
        j++
      }
    }

    const codeLines: string[] = []
    if (inlineTail) {
      codeLines.push(inlineTail)
    }
    for (; j < lines.length; j++) {
      const raw = lines[j]
      const trimmed = raw.trim()

      // Stop if we hit a new section heading (markdown or colon style)
      if (/^(#{1,6})\s+/.test(trimmed)) break
      if (/^(.+?):\s*$/.test(trimmed)) break

      codeLines.push(raw)
    }

    const code = codeLines.join("\n").trim()
    // Remove only the captured code lines (keep the header line itself)
    const stripped = [...lines.slice(0, idx + 1), ...lines.slice(j)].join("\n")
    return { code: code || undefined, stripped, headerFound: true }
  }

  let textToRender = stripPlaceholders(currentSectionData?.content)
  let cheatsheetCode = currentSectionData?.codeExample
  let cheatHeaderFound = false

  if (textToRender) {
    const scan = extractCheatsheetFromText(textToRender)
    cheatHeaderFound = scan.headerFound
    if (!cheatsheetCode && scan.code) {
      cheatsheetCode = scan.code
      textToRender = scan.stripped
    }
  }

  const isCheatSection =
    !!cheatsheetCode &&
    (cheatHeaderFound ||
      (currentSectionData?.title || "").toLowerCase().includes("cheatsheet") ||
      (currentSectionData?.title || "").toLowerCase().includes("cheat sheet"))

  const isCoreConceptsSection =
    (currentSectionData?.title || "").toLowerCase().includes("core concept")

  function difficultyLabel(level: number) {
    if (level <= 1) return "Beginner"
    if (level === 2) return "Intermediate"
    if (level >= 3) return "Advanced"
    return "Beginner"
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link href={backHref}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Lessons
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-semibold font-[family-name:var(--font-work-sans)]">{title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                {difficultyLabel(difficulty)}
              </Badge>
              <span className="text-xs text-muted-foreground">{Math.max(1, estimatedMinutes)} min</span>
            </div>
            {description ? (
              <CardDescription className="text-xs mt-1 line-clamp-1">{description}</CardDescription>
            ) : null}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {!showQuiz || !content.quiz ? (
          <div className="space-y-6">
            {/* Progress */}
            {totalSections > 0 ? (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">
                      Section {Math.min(currentSection + 1, totalSections)} of {totalSections}
                    </span>
                    <span className="text-sm text-muted-foreground">{Math.round(progress)}% Complete</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </CardContent>
              </Card>
            ) : null}

            {/* Content */}
            <Card>
              <CardHeader>
                <CardTitle className="font-[family-name:var(--font-work-sans)]">
                  {currentSectionData?.title || "Lesson"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <RichContent
                  text={textToRender}
                  cheatsheetCode={isCheatSection ? cheatsheetCode : undefined}
                  isCoreConcepts={isCoreConceptsSection}
                />

                {currentSectionData?.codeExample && !isCheatSection ? (() => {
                  const code = currentSectionData.codeExample as string
                  const handleCopy = () => {
                    try {
                      navigator.clipboard?.writeText(code)
                    } catch {}
                  }
                  return (
                    <div className="rounded-lg border border-slate-800 overflow-hidden">
                      <div className="flex items-center justify-between px-3 py-2 bg-slate-900/70">
                        <span className="text-xs text-slate-300">Code</span>
                        <Button variant="ghost" size="sm" onClick={handleCopy} className="text-xs text-slate-300 hover:text-white">
                          Copy
                        </Button>
                      </div>
                      <div className="bg-slate-900">
                        <pre className="text-sm text-slate-100 p-4 overflow-x-auto">
                          <code>{code}</code>
                        </pre>
                      </div>
                    </div>
                  )
                })() : null}

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={handlePrevious} disabled={currentSection === 0}>
                    Previous
                  </Button>
                  {content.quiz ? (
                    <Button onClick={handleNext}>
                      {currentSection >= totalSections - 1 ? "Take Quiz" : "Next"}
                    </Button>
                  ) : (
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="flex items-center gap-1">
                          <span className="text-yellow-500">⭐</span>+{xpReward} XP
                        </span>
                        <span className="flex items-center gap-1">
                          <Diamond className="w-3 h-3 text-blue-500" />+{diamondReward}
                        </span>
                      </div>
                      <Link href={backHref}>
                        <Button>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Complete Lesson
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Quiz */}
            <Card>
              <CardHeader>
                <CardTitle className="font-[family-name:var(--font-work-sans)] flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  Knowledge Check
                </CardTitle>
                <CardDescription>Test your understanding of {title}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-medium">{content.quiz.question}</h3>

                  <div className="space-y-2">
                    {content.quiz.options.map((option, index) => (
                      <Button
                        key={index}
                        variant={selectedAnswer === index ? "default" : "outline"}
                        className="w-full justify-start text-left h-auto p-4"
                        onClick={() => setSelectedAnswer(index)}
                        disabled={showResult}
                      >
                        <span className="mr-3 font-medium">{String.fromCharCode(65 + index)}.</span>
                        {option}
                      </Button>
                    ))}
                  </div>

                  {showResult && (
                    <div
                      className={`p-4 rounded-lg ${
                        selectedAnswer === content.quiz.correctAnswer
                          ? "bg-green-50 border border-green-200"
                          : "bg-red-50 border border-red-200"
                      }`}
                    >
                      <p className="font-medium mb-2">
                        {selectedAnswer === content.quiz.correctAnswer ? "✅ Correct!" : "❌ Incorrect"}
                      </p>
                      {content.quiz.explanation ? (
                        <p className="text-sm text-muted-foreground">{content.quiz.explanation}</p>
                      ) : null}
                    </div>
                  )}

                  <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={() => setShowQuiz(false)} disabled={showResult}>
                      Back to Lesson
                    </Button>
                    {!showResult ? (
                      <Button onClick={handleQuizSubmit} disabled={selectedAnswer === null}>
                        Submit Answer
                      </Button>
                    ) : (
                      <div className="flex items-center gap-4">
                        {completed && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="flex items-center gap-1">
                              <span className="text-yellow-500">⭐</span>+{xpReward} XP
                            </span>
                            <span className="flex items-center gap-1">
                              <Diamond className="w-3 h-3 text-blue-500" />+{diamondReward}
                            </span>
                          </div>
                        )}
                        <Link href={backHref}>
                          <Button>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Complete Lesson
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Spacer for fixed navigation */}
      <div className="h-24"></div>
    </div>
  )
}