import { NextRequest, NextResponse } from "next/server"

type CodeLine = {
  id: string
  code: string
}

type SortingPuzzle = {
  id: number
  shuffledLines: CodeLine[]
  correctOrder: string[]
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildPuzzlesPool(difficulty: "beginner" | "advanced" = "beginner"): SortingPuzzle[] {
  const pool: SortingPuzzle[] = []

  // 1-25: arithmetic setups
  for (let n = 1; n <= 25; n++) {
    const id = n
    const aId = `${id}-1`
    const bId = `${id}-2`
    const pId = `${id}-3`
    const aVal = n
    const bVal = n + 1
    const lines: CodeLine[] = [
      { id: aId, code: `a = ${aVal}` },
      { id: bId, code: `b = ${bVal}` },
      { id: pId, code: `print(a + b)` },
    ]
    pool.push({ id, shuffledLines: shuffleArray(lines), correctOrder: [aId, bId, pId] })
  }

  // 26-40: simple loops
  for (let n = 26; n <= 40; n++) {
    const id = n
    const l1 = `${id}-1`
    const l2 = `${id}-2`
    const lines: CodeLine[] = [
      { id: l1, code: `for i in range(${(n % 3) + 2}):` },
      { id: l2, code: `    print(i)` },
    ]
    pool.push({ id, shuffledLines: shuffleArray(lines), correctOrder: [l1, l2] })
  }

  // 41-50: tiny function definitions
  for (let n = 41; n <= 50; n++) {
    const id = n
    const l1 = `${id}-1`
    const l2 = `${id}-2`
    const l3 = `${id}-3`
    const who = n % 2 === 0 ? "Alice" : "Bob"
    const lines: CodeLine[] = [
      { id: l1, code: `def greet(name):` },
      { id: l2, code: `    print(f"Hello, {who}")` },
      { id: l3, code: `greet("${who}")` },
    ]
    pool.push({ id, shuffledLines: shuffleArray(lines), correctOrder: [l1, l2, l3] })
  }

  if (difficulty === "advanced") {
    // Override with harder puzzles: 4-5 lines, nested or function+call
    const hard: SortingPuzzle[] = []
    let id = 100
    // 4-line: define + compute + return + call
    for (let n = 0; n < 8; n++) {
      const l1 = `${id}-1`
      const l2 = `${id}-2`
      const l3 = `${id}-3`
      const l4 = `${id}-4`
      const lines: CodeLine[] = [
        { id: l1, code: `def add(a, b):` },
        { id: l2, code: `    s = a + b` },
        { id: l3, code: `    return s` },
        { id: l4, code: `print(add(${n + 1}, ${n + 2}))` },
      ]
      hard.push({ id, shuffledLines: shuffleArray(lines), correctOrder: [l1, l2, l3, l4] })
      id++
    }
    // 5-line: loop + condition + print evens
    for (let n = 0; n < 8; n++) {
      const l1 = `${id}-1`
      const l2 = `${id}-2`
      const l3 = `${id}-3`
      const l4 = `${id}-4`
      const l5 = `${id}-5`
      const lines: CodeLine[] = [
        { id: l1, code: `for i in range(${(n % 3) + 3}):` },
        { id: l2, code: `    if i % 2 == 0:` },
        { id: l3, code: `        print(i)` },
        { id: l4, code: `    else:` },
        { id: l5, code: `        pass` },
      ]
      hard.push({ id, shuffledLines: shuffleArray(lines), correctOrder: [l1, l2, l3, l4, l5] })
      id++
    }
    return hard
  }
  return pool
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const difficulty = (searchParams.get("difficulty") as "beginner" | "advanced") || "beginner"
    const pool = buildPuzzlesPool(difficulty)
    const selected = shuffleArray(pool).slice(0, 10)
    // Ensure each puzzle's lines are shuffled fresh per request
    const payload = selected.map((p) => ({
      ...p,
      shuffledLines: shuffleArray(p.shuffledLines),
    }))
    return NextResponse.json(payload)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch puzzles" }, { status: 500 })
  }
}