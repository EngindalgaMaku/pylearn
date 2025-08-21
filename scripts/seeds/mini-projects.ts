import "dotenv/config"
import { prisma } from "../../lib/prisma"

// Utilities
function now() {
  return new Date()
}

type LessonSeed = {
  title: string
  slug: string
  description: string
  category: string
  difficulty: 1 | 2 | 3
  estimatedMinutes: number
  diamondReward: number
  experienceReward: number
  sortOrder: number
  topicOrder: number
  content: any
}

const CATEGORY = "Mini Projects"

const lessons: LessonSeed[] = [
  {
    title: "Temperature Converter CLI",
    slug: "mp-temp-converter",
    description: "Build a CLI tool that converts between Celsius and Fahrenheit.",
    category: CATEGORY,
    difficulty: 1,
    estimatedMinutes: 8,
    diamondReward: 10,
    experienceReward: 25,
    sortOrder: 1,
    topicOrder: 1,
    content: {
      introduction: "Create a simple command-line converter handling Celsius <-> Fahrenheit.",
      objectives: ["Parse user input", "Perform arithmetic conversion", "Handle invalid input"],
      prerequisites: ["Basic Python I/O"],
      theory: "Temperature conversion is linear. Implement robust c_to_f/f_to_c helpers and a CLI interface to parse inputs and scales.",
      syntax: "```py\ndef c_to_f(c: float) -> float:\n    return c * 9/5 + 32\n\ndef f_to_c(f: float) -> float:\n    return (f - 32) * 5/9\n\n# CLI with argparse\nimport argparse\np = argparse.ArgumentParser()\np.add_argument('value', type=float)\np.add_argument('scale', choices=['C', 'F'])\nargs = p.parse_args()\n```",
      examples: "```py\n# Example runs\n# python conv.py 100 C\n# python conv.py 212 F\n```",
      bestPractices: ["Validate numeric input via argparse types or try/except", "Normalize scale to uppercase", "Format output with rounding (e.g., .2f)"],
      pitfalls: ["Forgetting to handle invalid scale", "Floating-point rounding surprises when comparing values"],
      cheatsheet: "# Formulas\nC->F = C*9/5 + 32\nF->C = (F-32)*5/9",
      references: [{ label: "argparse", url: "https://docs.python.org/3/library/argparse.html" }],
      quiz: {
        questions: [
          {
            type: "multiple_choice",
            question: "Which formula converts Celsius to Fahrenheit?",
            options: ["C * 5/9 + 32", "C * 9/5 + 32", "(C + 32) * 9/5", "(C - 32) * 9/5"],
            correctAnswer: 1,
            explanation: "Multiply by 9/5 then add 32 to convert C to F."
          }
        ]
      }
    }
  },
  {
    title: "Number Guessing Game",
    slug: "mp-number-guessing",
    description: "Create a CLI game where the user guesses a random number.",
    category: CATEGORY,
    difficulty: 1,
    estimatedMinutes: 7,
    diamondReward: 10,
    experienceReward: 25,
    sortOrder: 2,
    topicOrder: 1,
    content: {
      introduction: "A simple game using loops, conditionals, and random numbers.",
      objectives: ["Use random module", "Loop until correct guess", "Give hints"],
      prerequisites: ["Conditionals", "Loops"],
      theory: "Randomized games practice input handling, control flow, and state tracking such as attempt counters.",
      syntax: "```py\nimport random\nsecret = random.randint(1, 100)\nattempts = 0\nwhile True:\n    try:\n        guess = int(input('Guess 1-100: '))\n    except ValueError:\n        print('Enter a number!')\n        continue\n    attempts += 1\n    if guess == secret:\n        print('Correct!')\n        break\n    print('Too low!' if guess < secret else 'Too high!')\nprint(f'Attempts: {attempts}')\n```",
      examples: "```py\n# Add replay and adjustable range\n# secret = random.randint(low, high)\n```",
      bestPractices: ["Validate inputs defensively", "Keep loop conditions simple", "Give actionable hints"],
      pitfalls: ["Forgetting to increment attempts", "Not handling non-numeric input"],
      cheatsheet: "# Loop pattern\nwhile not done:\n    read -> validate -> compare",
      references: [{ label: "random — Generate pseudo-random numbers", url: "https://docs.python.org/3/library/random.html" }],
      quiz: {
        questions: [
          {
            type: "multiple_choice",
            question: "Which module provides randint?",
            options: ["sys", "math", "random", "time"],
            correctAnswer: 2,
            explanation: "random.randint(a, b) picks an integer in [a, b]."
          }
        ]
      }
    }
  },
  {
    title: "Password Generator",
    slug: "mp-password-generator",
    description: "Generate random passwords with configurable length and character sets.",
    category: CATEGORY,
    difficulty: 2,
    estimatedMinutes: 9,
    diamondReward: 12,
    experienceReward: 30,
    sortOrder: 3,
    topicOrder: 1,
    content: {
      introduction: "Create strong random passwords using secrets module.",
      objectives: ["Use secrets for randomness", "Combine char sets", "Build CLI flags"],
      prerequisites: ["Strings", "Loops"],
      theory: "Use cryptographically secure randomness (secrets) to avoid predictable passwords. Compose character pools based on CLI flags.",
      syntax: "```py\nimport secrets, argparse\nLOW = 'abcdefghijklmnopqrstuvwxyz'\nUP = LOW.upper()\nDIG = '0123456789'\nSYM = '!@#$%^&*_-+'\n\np = argparse.ArgumentParser()\np.add_argument('--len', type=int, default=16)\np.add_argument('--no-sym', action='store_true')\nargs = p.parse_args()\npool = LOW + UP + DIG + ('' if args.no_sym else SYM)\npassword = ''.join(secrets.choice(pool) for _ in range(args.len))\n```",
      examples: "```py\n# Guarantee at least one char from each selected group\n# pick one per group, fill rest from pool, then shuffle\n```",
      bestPractices: ["Prefer secrets over random for security", "Guarantee coverage of selected categories", "Avoid printing to shared terminals on multi-user systems"],
      pitfalls: ["Using random instead of secrets", "Forgetting to include at least one from each category"],
      cheatsheet: "# Secure RNG\nfrom secrets import choice",
      references: [{ label: "secrets — Secure random numbers", url: "https://docs.python.org/3/library/secrets.html" }],
      quiz: {
        questions: [
          {
            type: "multiple_choice",
            question: "Which module is recommended for secure randomness?",
            options: ["random", "secrets", "hashlib", "os.random"],
            correctAnswer: 1,
            explanation: "secrets is designed for security-sensitive randomness."
          }
        ]
      }
    }
  },
  {
    title: "Todo List (CLI, JSON storage)",
    slug: "mp-todo-cli",
    description: "Manage a simple todo list stored in a local JSON file.",
    category: CATEGORY,
    difficulty: 2,
    estimatedMinutes: 10,
    diamondReward: 12,
    experienceReward: 30,
    sortOrder: 4,
    topicOrder: 1,
    content: {
      introduction: "Add, list, complete, and delete tasks with persistent storage.",
      objectives: ["Read/write JSON", "Design simple CLI", "Handle file errors"],
      prerequisites: ["Lists", "Dicts", "File I/O"],
      theory: "Use a JSON file as a simple datastore. Create load/save helpers and implement imperative CLI commands.",
      syntax: "```py\nimport json, os\nFILE = 'todos.json'\n\ndef load():\n    if not os.path.exists(FILE):\n        return []\n    with open(FILE, encoding='utf-8') as f:\n        return json.load(f)\n\ndef save(items):\n    with open(FILE, 'w', encoding='utf-8') as f:\n        json.dump(items, f, indent=2)\n```",
      examples: "```py\n# Add item with incremental id\nitems = load()\nnext_id = (items[-1]['id'] + 1) if items else 1\nitems.append({'id': next_id, 'text': 'Read book', 'done': False})\nsave(items)\n```",
      bestPractices: ["Write files atomically for robustness (temp file + rename)", "Validate command args", "Show helpful summaries"],
      pitfalls: ["Assuming file exists", "Not handling JSON decode errors"],
      cheatsheet: "# JSON helpers\nload() / save(items)",
      references: [{ label: "json — JSON encoder and decoder", url: "https://docs.python.org/3/library/json.html" }],
      quiz: {
        questions: [
          {
            type: "multiple_choice",
            question: "What file format is suitable for simple local persistence?",
            options: ["CSV", "JSON", "XML", "Binary"],
            correctAnswer: 1,
            explanation: "JSON is human-readable and maps well to Python dict/list."
          }
        ]
      }
    }
  },
  {
    title: "CSV to JSON Converter",
    slug: "mp-csv-to-json",
    description: "Convert a CSV file into a JSON array of objects.",
    category: CATEGORY,
    difficulty: 2,
    estimatedMinutes: 8,
    diamondReward: 12,
    experienceReward: 30,
    sortOrder: 5,
    topicOrder: 1,
    content: {
      introduction: "Practice working with csv and json modules.",
      objectives: ["Parse CSV", "Write JSON", "Handle encodings"],
      prerequisites: ["File I/O"],
      theory: "CSV is a row/column text format; DictReader maps rows to dicts. Serialize rows to JSON for interoperability.",
      syntax: "```py\nimport csv, json\nrows = []\nwith open('input.csv', newline='', encoding='utf-8') as f:\n    for row in csv.DictReader(f):\n        rows.append(row)\nwith open('output.json', 'w', encoding='utf-8') as f:\n    json.dump(rows, f, ensure_ascii=False, indent=2)\n```",
      examples: "```py\n# Optional type conversion for numeric fields\nfor r in rows:\n    for k, v in r.items():\n        if v.isdigit():\n            r[k] = int(v)\n```",
      bestPractices: ["Specify encoding and newline handling", "Use DictReader for header-aware parsing"],
      pitfalls: ["Forgetting newline='' on Windows", "Incorrect encodings causing decode errors"],
      cheatsheet: "# CSV -> JSON\nDictReader -> list[dict] -> json.dump",
      references: [{ label: "csv — CSV File Reading and Writing", url: "https://docs.python.org/3/library/csv.html" }, { label: "json — JSON encoder and decoder", url: "https://docs.python.org/3/library/json.html" }],
      quiz: {
        questions: [
          {
            type: "multiple_choice",
            question: "Which class reads CSV rows as dicts?",
            options: ["csv.Reader", "csv.DictReader", "csv.DictWriter", "csv.JsonReader"],
            correctAnswer: 1,
            explanation: "csv.DictReader maps columns to keys from the header row."
          }
        ]
      }
    }
  },
  {
    title: "Markdown to HTML (basic)",
    slug: "mp-markdown-html",
    description: "Convert markdown text to HTML using a library and fallback rules.",
    category: CATEGORY,
    difficulty: 2,
    estimatedMinutes: 9,
    diamondReward: 12,
    experienceReward: 30,
    sortOrder: 6,
    topicOrder: 1,
    content: {
      introduction: "Use a markdown library or implement minimal parsing.",
      objectives: ["Use third-party libs", "Process text files", "Output HTML"],
      prerequisites: ["Strings", "File I/O"],
      theory: "Markdown is transformed to HTML via libraries; fallback rules can cover simple headings and paragraphs.",
      syntax: "```py\n# pip install markdown\nimport markdown\nwith open('README.md', encoding='utf-8') as f:\n    md = f.read()\nhtml = markdown.markdown(md)\nwith open('README.html', 'w', encoding='utf-8') as f:\n    f.write(html)\n```",
      examples: "```py\n# Minimal fallback (very limited)\nhtml = md.replace('# ', '<h1>').replace('\\n', '<br/>')\n```",
      bestPractices: ["Prefer maintained libraries over ad-hoc parsing", "Preserve encodings"],
      pitfalls: ["Naive replacements break complex Markdown", "Forgetting to escape HTML"],
      cheatsheet: "# md -> html\nmarkdown.markdown(text)",
      references: [{ label: "Python-Markdown", url: "https://python-markdown.github.io/" }],
      quiz: {
        questions: [
          {
            type: "multiple_choice",
            question: "Which function converts Markdown text to HTML?",
            options: ["markdown.convert", "markdown.md_to_html", "markdown.markdown", "markdown.render"],
            correctAnswer: 2,
            explanation: "markdown.markdown(text) returns HTML."
          }
        ]
      }
    }
  },
  {
    title: "Simple Stopwatch",
    slug: "mp-stopwatch",
    description: "Implement a command-line stopwatch with start/stop/lap.",
    category: CATEGORY,
    difficulty: 2,
    estimatedMinutes: 8,
    diamondReward: 12,
    experienceReward: 30,
    sortOrder: 7,
    topicOrder: 1,
    content: {
      introduction: "Practice working with time and user-driven loops.",
      objectives: ["Use time module", "Track laps", "Format durations"],
      prerequisites: ["Loops", "I/O"],
      theory: "Measure elapsed time with high-resolution monotonic clocks like time.perf_counter.",
      syntax: "```py\nimport time\nstart = time.perf_counter()\n# ... work ...\nelapsed = time.perf_counter() - start\nm, s = divmod(elapsed, 60)\nprint(f\"{int(m):02d}:{s:06.3f}\")\n```",
      examples: "```py\n# Lap storage\nlaps = []\nlaps.append(elapsed)\n```",
      bestPractices: ["Use perf_counter over time.time for durations", "Format durations consistently"],
      pitfalls: ["Resetting start incorrectly", "Using wall-clock time for benchmarking"],
      cheatsheet: "# Timing\nstart = perf_counter(); elapsed = perf_counter() - start",
      references: [{ label: "time — Time access and conversions", url: "https://docs.python.org/3/library/time.html#time.perf_counter" }],
      quiz: {
        questions: [
          {
            type: "multiple_choice",
            question: "Which timer is recommended for measuring short durations?",
            options: ["time.time", "time.perf_counter", "datetime.now", "time.monotonic_ns only"],
            correctAnswer: 1,
            explanation: "time.perf_counter() provides high-resolution timing."
          }
        ]
      }
    }
  },
  {
    title: "URL Shortener (in-memory)",
    slug: "mp-url-shortener",
    description: "Create a tiny Flask app that maps short codes to URLs (memory only).",
    category: CATEGORY,
    difficulty: 3,
    estimatedMinutes: 12,
    diamondReward: 15,
    experienceReward: 35,
    sortOrder: 8,
    topicOrder: 1,
    content: {
      introduction: "Build a minimal web app with redirects and a simple storage map.",
      objectives: ["Flask basics", "HTTP routes", "Redirects"],
      prerequisites: ["Functions", "Dicts"],
      theory: "HTTP handlers map paths to functions. Use an in-memory dict for short->URL mapping and Flask's redirect utility.",
      syntax: "```py\nfrom flask import Flask, request, redirect\nimport secrets\napp = Flask(__name__)\nstore = {}\n\n@app.post('/shorten')\ndef shorten():\n    url = request.form['url']\n    code = secrets.token_urlsafe(4)\n    store[code] = url\n    return {'code': code}\n\n@app.get('/<code>')\ndef go(code):\n    url = store.get(code)\n    return redirect(url) if url else ('Not found', 404)\n\nif __name__ == '__main__':\n    app.run(debug=True)\n```",
      examples: "```py\n# Validate URL scheme: http/https only\n```",
      bestPractices: ["Validate and normalize URLs", "Avoid predictable codes", "Do not store secrets in code"],
      pitfalls: ["No persistence (memory only)", "Open redirect risks with invalid URLs"],
      cheatsheet: "# Flask redirect\nfrom flask import redirect",
      references: [{ label: "Flask — Quickstart", url: "https://flask.palletsprojects.com/en/latest/quickstart/" }],
      quiz: {
        questions: [
          {
            type: "multiple_choice",
            question: "Which Flask function performs an HTTP redirect?",
            options: ["render", "send_file", "redirect", "forward"],
            correctAnswer: 2,
            explanation: "Use flask.redirect(url) to send a 302 by default."
          }
        ]
      }
    }
  },
  {
    title: "Expense Tracker (CSV storage)",
    slug: "mp-expense-tracker",
    description: "Track expenses, categories, and totals using CSV.",
    category: CATEGORY,
    difficulty: 2,
    estimatedMinutes: 10,
    diamondReward: 12,
    experienceReward: 30,
    sortOrder: 9,
    topicOrder: 1,
    content: {
      introduction: "Record expenses to a CSV file and compute summaries.",
      objectives: ["Append CSV rows", "Summarize by category", "Parse dates"],
      prerequisites: ["CSV", "Dicts"],
      theory: "CSV rows represent transactions. Aggregate amounts by category and optionally filter by date.",
      syntax: "```py\nimport csv, datetime\nwith open('expenses.csv', 'a', newline='') as f:\n    w = csv.writer(f)\n    w.writerow([datetime.date.today().isoformat(), 'Coffee', 'food', 3.5])\n```",
      examples: "```py\nfrom collections import defaultdict\nby_cat = defaultdict(float)\nwith open('expenses.csv', newline='') as f:\n    for d, desc, cat, amt in csv.reader(f):\n        by_cat[cat] += float(amt)\nprint(by_cat)\n```",
      bestPractices: ["Always specify newline='' with csv on Windows", "Validate numeric amounts"],
      pitfalls: ["Locale decimal separators", "Malformed rows causing ValueError"],
      cheatsheet: "# Summarize\nfor row in reader: totals[cat] += amount",
      references: [{ label: "csv — CSV File Reading and Writing", url: "https://docs.python.org/3/library/csv.html" }],
      quiz: {
        questions: [
          {
            type: "multiple_choice",
            question: "Which module helps reading/writing CSV files?",
            options: ["csv", "json", "pathlib", "time"],
            correctAnswer: 0,
            explanation: "The csv module provides reader/writer utilities."
          }
        ]
      }
    }
  },
  {
    title: "Hangman Game",
    slug: "mp-hangman",
    description: "Classic word guessing game in the terminal.",
    category: CATEGORY,
    difficulty: 2,
    estimatedMinutes: 10,
    diamondReward: 12,
    experienceReward: 30,
    sortOrder: 10,
    topicOrder: 1,
    content: {
      introduction: "Combine loops, sets, and string handling into a fun game.",
      objectives: ["Track guessed letters", "Display masked word", "Limit attempts"],
      prerequisites: ["Sets", "Loops"],
      theory: "Maintain game state with a set of guessed letters, count attempts, and render a masked view of the secret word.",
      syntax: "```py\nimport random\nwords = ['python', 'flask', 'variable', 'function']\nsecret = random.choice(words)\n\nguessed = set(); attempts = 6\nmask = ''.join(ch if ch in guessed else '_' for ch in secret)\n```",
      examples: "```py\nwhile attempts > 0 and set(secret) - guessed:\n    ch = input('Letter: ').lower()\n    if ch in secret:\n        guessed.add(ch)\n    else:\n        attempts -= 1\nprint('You win!' if not (set(secret) - guessed) else f'You lose! Word was {secret}')\n```",
      bestPractices: ["Validate single-letter input", "Ignore repeated guesses gracefully"],
      pitfalls: ["Not lowercasing input vs secret", "Revealing duplicate letters inconsistently"],
      cheatsheet: "# Mask rendering\n''.join(ch if ch in guessed else '_' for ch in word)",
      references: [{ label: "random — Generate pseudo-random numbers", url: "https://docs.python.org/3/library/random.html" }],
      quiz: {
        questions: [
          {
            type: "multiple_choice",
            question: "Which data structure best tracks guessed letters?",
            options: ["list", "tuple", "set", "dict"],
            correctAnswer: 2,
            explanation: "Sets provide O(1) average membership and no duplicates."
          }
        ]
      }
    }
  }
]

// Helper to build createMany records
function buildCreateMany() {
  return lessons.map((l) => ({
    title: l.title,
    description: l.description,
    category: l.category,
    difficulty: l.difficulty,
    estimatedMinutes: l.estimatedMinutes,
    diamondReward: l.diamondReward,
    experienceReward: l.experienceReward,
    sortOrder: l.sortOrder,
    topicOrder: l.topicOrder,
    isActive: true,
    isLocked: false,
    activityType: "lesson",
    // Content is string JSON consumed by the app parser
    content: JSON.stringify(l.content),
    createdAt: now(),
    updatedAt: now()
  }))
}

async function main() {
  console.log("Seeding: Purge and insert 10 'Mini Projects' lessons")

  // 1) Purge all existing lessons in this category to remove wrong-format seeds
  const delByCategory = await prisma.learningActivity.deleteMany({
    where: {
      activityType: "lesson",
      category: { equals: CATEGORY, mode: "insensitive" }
    }
  })
  if (delByCategory.count) {
    console.log(`Deleted ${delByCategory.count} lessons in category '${CATEGORY}'`)
  }

  // 2) Extra safety: delete by our intended titles (idempotency)
  const titles = lessons.map((l) => l.title)
  const delExistingTitles = await prisma.learningActivity.deleteMany({
    where: { title: { in: titles } }
  })
  if (delExistingTitles.count) {
    console.log(`Deleted existing ${delExistingTitles.count} '${CATEGORY}' lesson(s) with matching titles to reseed`)
  }

  // 3) Insert corrected lessons (content stored as JSON string per app parser)
  const data = buildCreateMany()
  const createResult = await prisma.learningActivity.createMany({ data, skipDuplicates: true })
  console.log(`Inserted ${createResult.count} '${CATEGORY}' lesson(s)`)

  // 4) Report total
  const total = await prisma.learningActivity.count({
    where: { activityType: "lesson", category: { equals: CATEGORY, mode: "insensitive" } }
  })
  console.log(`Total '${CATEGORY}' lessons now: ${total}`)
}

main()
  .catch((e) => {
    console.error("Seed failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })