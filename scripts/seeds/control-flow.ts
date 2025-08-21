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

const CATEGORY = "Control Flow"

const lessons: LessonSeed[] = [
  {
    title: "Introduction to Control Flow",
    slug: "control-flow-intro",
    description: "Understand how control flow directs the execution of Python programs.",
    category: CATEGORY,
    difficulty: 1,
    estimatedMinutes: 6,
    diamondReward: 10,
    experienceReward: 25,
    sortOrder: 1,
    topicOrder: 1,
    content: {
      introduction: "Control flow statements let your program make decisions and repeat actions.",
      objectives: [
        "Explain what control flow is",
        "Recognize common control statements (if, while, for)",
        "Predict simple execution paths"
      ],
      prerequisites: ["Basic Python syntax", "Running a Python script"],
      theory:
        "Control flow determines the order in which statements execute. Conditional branches choose between paths, and loops repeat blocks of code while a condition holds.",
      syntax: "```py\n# Conditionals\nif condition:\n    pass\nelif other_condition:\n    pass\nelse:\n    pass\n\n# Loops\nwhile condition:\n    pass\n\nfor item in iterable:\n    pass\n```",
      examples:
        "```py\nx = 10\nif x > 5:\n    print('x is greater than 5')\nelse:\n    print('x is 5 or less')\n```",
      bestPractices: [
        "Write clear, simple conditions",
        "Prefer readability over clever tricks",
        "Keep blocks short and focused"
      ],
      pitfalls: [
        "Deep nesting reduces clarity",
        "Forgetting to update loop conditions can cause infinite loops"
      ],
      cheatsheet:
        "# Control Flow Essentials\nif cond:\n    ...\nelif cond:\n    ...\nelse:\n    ...\n\nwhile cond:\n    ...\n\nfor x in iterable:\n    ...\n",
      references: [
        { label: "Python Tutorial — Control Flow", url: "https://docs.python.org/3/tutorial/controlflow.html" }
      ],
      quiz: {
        questions: [
          {
            type: "multiple_choice",
            question: "What does control flow manage?",
            options: [
              "The order statements execute in a program",
              "Only variable declarations",
              "Only arithmetic operations",
              "Only function definitions"
            ],
            correctAnswer: 0,
            explanation: "Control flow determines which statements run and when."
          }
        ]
      }
    }
  },
  {
    title: "If Statements and Indentation",
    slug: "if-statements",
    description: "Write basic if statements and understand Python indentation rules.",
    category: CATEGORY,
    difficulty: 1,
    estimatedMinutes: 7,
    diamondReward: 10,
    experienceReward: 25,
    sortOrder: 2,
    topicOrder: 1,
    content: {
      introduction:
        "Python uses indentation (spaces) to define blocks. If statements run a block only when a condition is true.",
      objectives: ["Use if with a boolean expression", "Indent blocks correctly", "Avoid Tab/space mix-ups"],
      prerequisites: ["Boolean expressions", "Comparison operators"],
      theory:
        "An if statement evaluates its condition. If true, the indented block executes. Python’s indentation (PEP 8 suggests 4 spaces) is syntactically significant.",
      syntax: "```py\nif condition:\n    # indented block\n    ...\n```",
      examples:
        "```py\nage = 18\nif age >= 18:\n    print('Adult')\n```",
      bestPractices: ["Use 4 spaces for indentation", "Keep condition expressions simple"],
      pitfalls: ["Mixing tabs and spaces", "Dangling code with incorrect indentation"],
      cheatsheet:
        "# If Pattern\nif cond:\n    do_thing()\n",
      references: [
        { label: "PEP 8 — Indentation", url: "https://peps.python.org/pep-0008/#indentation" },
        { label: "Control Flow — if", url: "https://docs.python.org/3/tutorial/controlflow.html#if-statements" }
      ],
      quiz: {
        questions: [
          {
            type: "multiple_choice",
            question: "How many spaces are recommended by PEP 8 for indentation?",
            options: ["2", "4", "8", "Tabs only"],
            correctAnswer: 1,
            explanation: "PEP 8 recommends 4 spaces per indentation level."
          }
        ]
      }
    }
  },
  {
    title: "If-Else Branching",
    slug: "if-else-branching",
    description: "Use else to handle the false path of a condition.",
    category: CATEGORY,
    difficulty: 1,
    estimatedMinutes: 6,
    diamondReward: 10,
    experienceReward: 25,
    sortOrder: 3,
    topicOrder: 1,
    content: {
      introduction: "Else covers the alternative path when an if condition is false.",
      objectives: ["Add else blocks", "Cover both true and false outcomes"],
      prerequisites: ["If statement basics"],
      theory:
        "An else block runs exactly when the if condition is false, ensuring both outcomes are handled.",
      syntax: "```py\nif condition:\n    ...\nelse:\n    ...\n```",
      examples:
        "```py\nn = -3\nif n >= 0:\n    print('non-negative')\nelse:\n    print('negative')\n```",
      bestPractices: ["Use else only when there’s a meaningful alternative", "Avoid redundant else if you return early"],
      pitfalls: ["Overly complex branching for simple cases"],
      cheatsheet:
        "# If-Else\nif cond:\n    A\nelse:\n    B\n",
      references: [{ label: "Control Flow — more if", url: "https://docs.python.org/3/tutorial/controlflow.html" }],
      quiz: {
        questions: [
          {
            type: "multiple_choice",
            question: "When does an else block run?",
            options: ["Always", "Only if the if condition is false", "Only if the if condition is true", "Never"],
            correctAnswer: 1,
            explanation: "Else executes when the if condition evaluated to false."
          }
        ]
      }
    }
  },
  {
    title: "Elif Chains",
    slug: "elif-chains",
    description: "Use elif to handle multiple mutually exclusive cases cleanly.",
    category: CATEGORY,
    difficulty: 1,
    estimatedMinutes: 7,
    diamondReward: 10,
    experienceReward: 25,
    sortOrder: 4,
    topicOrder: 1,
    content: {
      introduction: "Elif allows a sequence of checks where exactly one branch may run.",
      objectives: ["Use elif with multiple conditions", "Replace nested if-else pyramids"],
      prerequisites: ["If and else"],
      theory:
        "Only the first true branch in an if/elif/elif/.../else chain executes. This creates a clean ladder of conditions.",
      syntax: "```py\nif cond1:\n    ...\nelif cond2:\n    ...\nelif cond3:\n    ...\nelse:\n    ...\n```",
      examples:
        "```py\nscore = 83\nif score >= 90:\n    grade = 'A'\nelif score >= 80:\n    grade = 'B'\nelif score >= 70:\n    grade = 'C'\nelse:\n    grade = 'D'\n```",
      bestPractices: ["Order conditions from most specific to least", "Avoid overlapping conditions"],
      pitfalls: ["Missing else when a default case is needed"],
      cheatsheet:
        "# Elif Ladder\nif a:\n    ...\nelif b:\n    ...\nelse:\n    ...\n",
      references: [{ label: "Control Flow — elif", url: "https://docs.python.org/3/tutorial/controlflow.html" }],
      quiz: {
        questions: [
          {
            type: "multiple_choice",
            question: "In an if/elif chain, how many branches can run?",
            options: ["Zero or one", "Exactly one always", "Any number", "All of them"],
            correctAnswer: 0,
            explanation: "If none match, zero branches run (unless there’s an else)."
          }
        ]
      }
    }
  },
  {
    title: "Nested Conditionals",
    slug: "nested-conditionals",
    description: "Understand when and how to nest conditionals, and when to avoid it.",
    category: CATEGORY,
    difficulty: 2,
    estimatedMinutes: 8,
    diamondReward: 12,
    experienceReward: 30,
    sortOrder: 5,
    topicOrder: 1,
    content: {
      introduction: "Nest conditionals when logic truly depends on earlier results.",
      objectives: ["Create nested blocks", "Refactor deep nesting"],
      prerequisites: ["Elif chains", "Clear boolean logic"],
      theory:
        "Nesting can be useful but becomes hard to read when too deep. Prefer flat logic or early returns when possible.",
      syntax: "```py\nif a:\n    if b:\n        ...\n```",
      examples:
        "```py\nx, y = 3, 10\nif x > 0:\n    if y > 5:\n        print('x positive and y > 5')\n```",
      bestPractices: ["Prefer early returns/guards to reduce nesting", "Extract functions for clarity"],
      pitfalls: ["Nested pyramids reduce maintainability"],
      cheatsheet:
        "# Nested Example\nif a:\n    if b:\n        work()\n",
      references: [{ label: "Python Tutorial", url: "https://docs.python.org/3/tutorial/" }],
      quiz: {
        questions: [
          {
            type: "multiple_choice",
            question: "What can reduce deep nesting?",
            options: ["Global variables", "Early returns or refactoring into functions", "More elif chains", "Adding comments only"],
            correctAnswer: 1,
            explanation: "Early exits and function extraction help flatten logic."
          }
        ]
      }
    }
  },
  {
    title: "Logical Operators and Truthiness",
    slug: "logical-operators-truthiness",
    description: "Combine conditions with and/or/not and understand truthy/falsey values.",
    category: CATEGORY,
    difficulty: 2,
    estimatedMinutes: 9,
    diamondReward: 12,
    experienceReward: 30,
    sortOrder: 6,
    topicOrder: 1,
    content: {
      introduction:
        "Python treats non-zero numbers, non-empty containers, and many objects as truthy; zero, None, and empty containers are falsey.",
      objectives: ["Use and/or/not", "Understand truthiness rules", "Avoid common short-circuit surprises"],
      prerequisites: ["Booleans", "Comparisons"],
      theory:
        "and/or use short-circuit evaluation. Truthiness determines how non-bool values behave in conditions.",
      syntax: "```py\nif a and b:\n    ...\nif a or b:\n    ...\nif not a:\n    ...\n```",
      examples:
        "```py\nitems = [1]\nif items and len(items) > 0:\n    print('has items')\n```",
      bestPractices: ["Use explicit comparisons for clarity", "Beware of empty containers in conditions"],
      pitfalls: ["Relying on truthiness when exact checks are needed", "Misusing or/and return values"],
      cheatsheet:
        "# Truthiness\n[], {}, '', 0, None  -> False\nothers -> True\n",
      references: [{ label: "Truth Value Testing", url: "https://docs.python.org/3/library/stdtypes.html#truth-value-testing" }],
      quiz: {
        questions: [
          {
            type: "multiple_choice",
            question: "Which of these is falsey?",
            options: ["[0]", "''", "'0'", "{'a': 1}"],
            correctAnswer: 1,
            explanation: "Empty string is falsey; '[0]' and non-empty dicts/lists are truthy."
          }
        ]
      }
    }
  },
  {
    title: "Ternary Conditional Expressions",
    slug: "ternary-expressions",
    description: "Use Python’s one-line conditional expressions for simple assignments.",
    category: CATEGORY,
    difficulty: 2,
    estimatedMinutes: 6,
    diamondReward: 12,
    experienceReward: 30,
    sortOrder: 7,
    topicOrder: 1,
    content: {
      introduction:
        "A conditional expression (ternary) chooses one of two expressions inline.",
      objectives: ["Write x if cond else y", "Keep expressions simple"],
      prerequisites: ["If/else basics"],
      theory:
        "Use ternary expressions for concise value selection, not complex logic.",
      syntax: "```py\nresult = A if condition else B\n```",
      examples:
        "```py\nage = 20\nstatus = 'adult' if age >= 18 else 'minor'\n```",
      bestPractices: ["Prefer readability; avoid nesting ternaries"],
      pitfalls: ["Complex expressions hurt clarity"],
      cheatsheet:
        "# Ternary\nvalue = a if cond else b\n",
      references: [{ label: "Conditional Expressions", url: "https://docs.python.org/3/reference/expressions.html#conditional-expressions" }],
      quiz: {
        questions: [
          {
            type: "multiple_choice",
            question: "Ternary expressions are best used for:",
            options: ["Complex branching", "Concise value selection", "Loop control", "Exception handling"],
            correctAnswer: 1,
            explanation: "Keep ternaries simple for readability."
          }
        ]
      }
    }
  },
  {
    title: "Pattern Matching with match/case (3.10+)",
    slug: "pattern-matching-match-case",
    description: "Leverage structural pattern matching to simplify multi-branch logic.",
    category: CATEGORY,
    difficulty: 3,
    estimatedMinutes: 10,
    diamondReward: 15,
    experienceReward: 35,
    sortOrder: 8,
    topicOrder: 1,
    content: {
      introduction:
        "match/case introduces expressive structural pattern matching in Python 3.10+.",
      objectives: ["Write match/case blocks", "Use literal and capture patterns"],
      prerequisites: ["If/elif chains"],
      theory:
        "match/case can replace verbose elif ladders with destructuring-like patterns.",
      syntax: "```py\nmatch value:\n    case 0:\n        ...\n    case 1 | 2:\n        ...\n    case _:\n        ...\n```",
      examples:
        "```py\nstatus = 404\nmatch status:\n    case 200:\n        msg = 'OK'\n    case 400 | 404:\n        msg = 'Client Error'\n    case _:\n        msg = 'Other'\nprint(msg)\n```",
      bestPractices: ["Keep patterns clear and ordered", "Use wildcard _ for default"],
      pitfalls: ["Requires Python 3.10+", "Overuse can obscure simple logic"],
      cheatsheet:
        "# match/case\nmatch v:\n    case 0:\n        ...\n    case 1 | 2:\n        ...\n    case _:\n        ...\n",
      references: [{ label: "PEP 634 — Structural Pattern Matching", url: "https://peps.python.org/pep-0634/" }],
      quiz: {
        questions: [
          {
            type: "multiple_choice",
            question: "Which Python version introduced match/case?",
            options: ["3.8", "3.9", "3.10", "3.7"],
            correctAnswer: 2,
            explanation: "Pattern matching was added in Python 3.10."
          }
        ]
      }
    }
  },
  {
    title: "While Loops with Conditional Guards",
    slug: "while-loops-guards",
    description: "Use while to repeat actions until a condition changes, with safe guards.",
    category: CATEGORY,
    difficulty: 2,
    estimatedMinutes: 8,
    diamondReward: 12,
    experienceReward: 30,
    sortOrder: 9,
    topicOrder: 1,
    content: {
      introduction:
        "While loops repeat a block while a condition is true. Always ensure the condition can change.",
      objectives: ["Write while loops", "Prevent infinite loops", "Use break/continue carefully"],
      prerequisites: ["Boolean logic", "Variable updates"],
      theory:
        "A while loop checks the condition each iteration. Use counters or state changes to eventually exit.",
      syntax: "```py\nwhile condition:\n    # work\n    # update state\n```",
      examples:
        "```py\nn = 3\nwhile n > 0:\n    print(n)\n    n -= 1\n```",
      bestPractices: ["Ensure progress toward termination", "Consider for-loops for fixed iterations"],
      pitfalls: ["Infinite loops from unchanging conditions"],
      cheatsheet:
        "# While Pattern\nwhile cond:\n    step()\n    update()\n",
      references: [{ label: "Control Flow — while", url: "https://docs.python.org/3/tutorial/controlflow.html#for-statements" }],
      quiz: {
        questions: [
          {
            type: "multiple_choice",
            question: "What commonly causes infinite loops?",
            options: [
              "Updating loop variables correctly",
              "Forgetting to change the condition state",
              "Using break",
              "Using continue"
            ],
            correctAnswer: 1,
            explanation: "If the condition never changes, the loop never ends."
          }
        ]
      }
    }
  },
  {
    title: "Guard Clauses and Early Returns",
    slug: "guard-clauses-early-returns",
    description: "Flatten complex conditionals by exiting early when appropriate.",
    category: CATEGORY,
    difficulty: 2,
    estimatedMinutes: 8,
    diamondReward: 12,
    experienceReward: 30,
    sortOrder: 10,
    topicOrder: 1,
    content: {
      introduction:
        "Guard clauses check and exit early to avoid deep nesting and make intent obvious.",
      objectives: ["Use early returns", "Refactor nested logic"],
      prerequisites: ["Functions", "If statements"],
      theory:
        "By handling edge cases first, the main path remains clear and indentation shallow.",
      syntax: "```py\ndef process(user):\n    if not user:\n        return None\n    # main logic\n```",
      examples:
        "```py\ndef normalize(text):\n    if not text:\n        return ''\n    return text.strip().lower()\n```",
      bestPractices: ["Handle invalid inputs immediately", "Keep main path uncluttered"],
      pitfalls: ["Overusing early exits can hide flow; balance is key"],
      cheatsheet:
        "# Guard Pattern\ndef f(x):\n    if not valid(x):\n        return None\n    return work(x)\n",
      references: [{ label: "Clean Code Principles", url: "https://docs.python.org/3/tutorial/" }],
      quiz: {
        questions: [
          {
            type: "multiple_choice",
            question: "What’s a benefit of guard clauses?",
            options: ["Deeper nesting", "Early exit for edge cases", "More lines of code", "Slower performance"],
            correctAnswer: 1,
            explanation: "They make the main path clearer and shallower."
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
    slug: l.slug,
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
  console.log("Seeding: Remove 'algorithms' lessons and insert 10 'Control Flow' lessons")

  // 1) Delete all 'algorithms' lessons (case-insensitive)
  const delAlgorithms = await prisma.learningActivity.deleteMany({
    where: {
      activityType: "lesson",
      category: { equals: "algorithms", mode: "insensitive" }
    }
  })
  console.log(`Deleted ${delAlgorithms.count} lessons in category 'algorithms'`)

  // 2) Ensure idempotency: delete any of our slugs before creating
  const slugs = lessons.map((l) => l.slug)
  const delExistingSlugs = await prisma.learningActivity.deleteMany({
    where: { slug: { in: slugs } }
  })
  if (delExistingSlugs.count) {
    console.log(`Deleted existing ${delExistingSlugs.count} 'Control Flow' lesson(s) with matching slugs to reseed`)
  }

  // 3) Create 10 "Control Flow" lessons
  const data = buildCreateMany()
  const createResult = await prisma.learningActivity.createMany({ data, skipDuplicates: true })
  console.log(`Inserted ${createResult.count} 'Control Flow' lesson(s)`)

  // Optional: report what remains under category
  const totalControlFlow = await prisma.learningActivity.count({
    where: { activityType: "lesson", category: { equals: CATEGORY, mode: "insensitive" } }
  })
  console.log(`Total '${CATEGORY}' lessons now: ${totalControlFlow}`)
}

main()
  .catch((e) => {
    console.error("Seed failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })