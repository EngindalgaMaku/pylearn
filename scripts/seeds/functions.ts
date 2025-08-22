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

const CATEGORY = "Functions"

const lessons: LessonSeed[] = [
  {
    title: "Introduction to Functions",
    slug: "functions-intro",
    description: "Understand why functions exist and how they help structure programs.",
    category: CATEGORY,
    difficulty: 1,
    estimatedMinutes: 6,
    diamondReward: 10,
    experienceReward: 25,
    sortOrder: 1,
    topicOrder: 1,
    content: {
      introduction: "Functions let you group reusable logic, name it, and call it when needed.",
      objectives: [
        "Explain what a function is",
        "Describe inputs and outputs",
        "Call a simple function"
      ],
      prerequisites: ["Basic Python syntax"],
      theory: "A function is a named block of code that can take arguments and may return a value.",
      syntax: "```py\ndef greet():\n    print('Hello')\n\ngreet()\n```",
      examples: "```py\ndef add(a, b):\n    return a + b\n\nprint(add(2, 3))  # 5\n```",
      bestPractices: ["Keep functions small and focused", "Use descriptive names"],
      pitfalls: ["Doing too many things in one function"],
      cheatsheet: "# Function basics\ndef name(...):\n    ...\nname()",
      references: [{ label: "Defining Functions", url: "https://docs.python.org/3/tutorial/controlflow.html#defining-functions" }],
      quiz: {
        questions: [
          {
            type: "multiple_choice",
            question: "What is a function?",
            options: ["A named block of reusable code", "A Python keyword", "A kind of loop", "A file"],
            correctAnswer: 0,
            explanation: "Functions encapsulate reusable logic."
          }
        ]
      }
    }
  },
  {
    title: "Defining and Calling Functions",
    slug: "defining-calling-functions",
    description: "Create functions with def and call them by name.",
    category: CATEGORY,
    difficulty: 1,
    estimatedMinutes: 7,
    diamondReward: 10,
    experienceReward: 25,
    sortOrder: 2,
    topicOrder: 1,
    content: {
      introduction: "Use def to define a function and parentheses to call it.",
      objectives: ["Define a function", "Call a function", "Return a value"],
      prerequisites: ["Introduction to Functions"],
      theory: "The def statement creates a function object and binds it to a name.",
      syntax: "```py\ndef square(x):\n    return x * x\n\nresult = square(4)\n```",
      examples: "```py\ndef shout(text):\n    print(text.upper())\n\nshout('hi')\n```",
      bestPractices: ["Return values instead of printing when composing logic"],
      pitfalls: ["Forgetting parentheses when calling"],
      cheatsheet: "# Define and call\ndef f(x):\n    return x\nf(1)",
      references: [{ label: "Defining Functions", url: "https://docs.python.org/3/tutorial/controlflow.html#defining-functions" }],
      quiz: {
        questions: [
          {
            type: "multiple_choice",
            question: "How do you define a function?",
            options: ["use def", "use func", "use function", "use lambda only"],
            correctAnswer: 0,
            explanation: "def is the standard keyword."
          }
        ]
      }
    }
  },
  {
    title: "Parameters and Arguments",
    slug: "function-parameters-arguments",
    description: "Distinguish parameters (in definition) from arguments (at call site).",
    category: CATEGORY,
    difficulty: 1,
    estimatedMinutes: 8,
    diamondReward: 10,
    experienceReward: 25,
    sortOrder: 3,
    topicOrder: 1,
    content: {
      introduction: "Parameters are placeholders in the function; arguments are actual values passed.",
      objectives: ["Use positional and keyword arguments", "Understand arity"],
      prerequisites: ["Defining and Calling Functions"],
      theory: "Functions can accept positional and keyword arguments with matching parameter names.",
      syntax: "```py\ndef power(base, exp):\n    return base ** exp\n\npower(2, 3)\npower(base=2, exp=3)\n```",
      examples: "```py\ndef greet(name, title='Mr.'):\n    return f'Hello {title} {name}'\n\ngreet('Smith')\ngreet('Smith', title='Dr.')\n```",
      bestPractices: ["Prefer keyword args for clarity when many params"],
      pitfalls: ["Misordered positional args"],
      cheatsheet: "# Positional vs keyword\nf(1, 2)\nf(a=1, b=2)",
      references: [{ label: "More on Defining Functions", url: "https://docs.python.org/3/tutorial/controlflow.html#more-on-defining-functions" }],
      quiz: {
        questions: [
          {
            type: "multiple_choice",
            question: "Which is a keyword argument call?",
            options: ["f(1, 2)", "f(a=1, b=2)", "f(1)", "f()"],
            correctAnswer: 1,
            explanation: "Keyword args specify parameter names."
          }
        ]
      }
    }
  },
  {
    title: "Default Parameters (and Mutable Pitfalls)",
    slug: "default-parameters",
    description: "Set default values and avoid mutables as defaults.",
    category: CATEGORY,
    difficulty: 2,
    estimatedMinutes: 9,
    diamondReward: 12,
    experienceReward: 30,
    sortOrder: 4,
    topicOrder: 1,
    content: {
      introduction: "Default parameter values make arguments optional.",
      objectives: ["Use defaults", "Avoid mutable default traps"],
      prerequisites: ["Parameters and Arguments"],
      theory: "Defaults are evaluated once at definition time; mutable defaults are shared across calls.",
      syntax: "```py\ndef append_item(item, bucket=None):\n    if bucket is None:\n        bucket = []\n    bucket.append(item)\n    return bucket\n```",
      examples: "```py\ndef bad(x, lst=[]):\n    lst.append(x)\n    return lst\n\nbad(1)  # [1]\nbad(2)  # [1, 2]  # shared!\n```",
      bestPractices: ["Use None then create inside for mutable defaults"],
      pitfalls: ["Using [] or {} as default directly"],
      cheatsheet: "# Safe default pattern\nparam=None -> if None: param = []",
      references: [{ label: "Default Argument Values", url: "https://docs.python.org/3/tutorial/controlflow.html#default-argument-values" }],
      quiz: {
        questions: [
          {
            type: "multiple_choice",
            question: "Why avoid [] as a default?",
            options: ["Slow", "Shared across calls", "Syntax error", "Not allowed"],
            correctAnswer: 1,
            explanation: "Defaults are evaluated once and reused."
          }
        ]
      }
    }
  },
  {
    title: "Variable-length Arguments (*args, **kwargs)",
    slug: "varargs-kwargs",
    description: "Accept arbitrary positional and keyword arguments.",
    category: CATEGORY,
    difficulty: 2,
    estimatedMinutes: 8,
    diamondReward: 12,
    experienceReward: 30,
    sortOrder: 5,
    topicOrder: 1,
    content: {
      introduction: "Use *args for extra positional and **kwargs for extra keyword arguments.",
      objectives: ["Collect extra args", "Forward args to other functions"],
      prerequisites: ["Parameters and Arguments"],
      theory: "*args packs to a tuple; **kwargs packs to a dict. You can also unpack when calling.",
      syntax: "```py\ndef log(*args, **kwargs):\n    print(args, kwargs)\n\nlog(1, 2, a=3)\n```",
      examples: "```py\ndef call(fn, *args, **kwargs):\n    return fn(*args, **kwargs)\n```",
      bestPractices: ["Name kwargs clearly", "Avoid swallowing unexpected args silently"],
      pitfalls: ["Ordering: def f(a, *args, b=0, **kwargs)"],
      cheatsheet: "# Packing/unpacking\nf(*iterable)\nf(**mapping)",
      references: [{ label: "Arbitrary Argument Lists", url: "https://docs.python.org/3/tutorial/controlflow.html#arbitrary-argument-lists" }],
      quiz: {
        questions: [
          {
            type: "multiple_choice",
            question: "What does **kwargs collect?",
            options: ["Positional args", "Keyword args", "Locals", "Globals"],
            correctAnswer: 1,
            explanation: "It collects keyword arguments into a dict."
          }
        ]
      }
    }
  },
  {
    title: "Return Values and Multiple Returns",
    slug: "return-values",
    description: "Return results, including tuples for multiple values.",
    category: CATEGORY,
    difficulty: 1,
    estimatedMinutes: 7,
    diamondReward: 10,
    experienceReward: 25,
    sortOrder: 6,
    topicOrder: 1,
    content: {
      introduction: "Use return to send a result back to the caller.",
      objectives: ["Return a value", "Return multiple values"],
      prerequisites: ["Defining and Calling Functions"],
      theory: "Python functions return None by default. You can return tuples and unpack them.",
      syntax: "```py\ndef divmod_like(a, b):\n    return a // b, a % b\nq, r = divmod_like(7, 3)\n```",
      examples: "```py\ndef bounds(xs):\n    return min(xs), max(xs)\nlo, hi = bounds([3,1,4])\n```",
      bestPractices: ["Return data, not prints", "Document return types"],
      pitfalls: ["Falling off the end unintentionally returns None"],
      cheatsheet: "# Multiple returns\nreturn a, b\nx, y = f()",
      references: [{ label: "Return statement", url: "https://docs.python.org/3/reference/simple_stmts.html#the-return-statement" }],
      quiz: {
        questions: [
          {
            type: "multiple_choice",
            question: "What is returned if no return is used?",
            options: ["0", "False", "None", "''"],
            correctAnswer: 2,
            explanation: "Functions return None implicitly."
          }
        ]
      }
    }
  },
  {
    title: "Scope and the LEGB Rule",
    slug: "scope-legb",
    description: "Understand local, enclosing, global, and built-in scopes.",
    category: CATEGORY,
    difficulty: 2,
    estimatedMinutes: 9,
    diamondReward: 12,
    experienceReward: 30,
    sortOrder: 7,
    topicOrder: 1,
    content: {
      introduction: "Name resolution follows the LEGB order: Local, Enclosing, Global, Built-in.",
      objectives: ["Predict name lookups", "Use global/nonlocal when necessary"],
      prerequisites: ["Defining and Calling Functions"],
      theory: "Inner functions see enclosing scopes. global and nonlocal alter binding behavior.",
      syntax: "```py\nx = 1\ndef outer():\n    x = 2\n    def inner():\n        return x  # 2 (enclosing)\n    return inner()\n```",
      examples: "```py\ncount = 0\ndef inc():\n    global count\n    count += 1\n```",
      bestPractices: ["Prefer passing values to avoid globals", "Use nonlocal sparingly"],
      pitfalls: ["Unexpected shadowing of names"],
      cheatsheet: "# LEGB\nLocal -> Enclosing -> Global -> Built-in",
      references: [{ label: "Scopes and Namespaces", url: "https://docs.python.org/3/tutorial/classes.html#python-scopes-and-namespaces" }],
      quiz: {
        questions: [
          {
            type: "multiple_choice",
            question: "Which comes first in LEGB?",
            options: ["Global", "Local", "Built-in", "Enclosing"],
            correctAnswer: 1,
            explanation: "Local is checked first."
          }
        ]
      }
    }
  },
  {
    title: "First-Class and Higher-Order Functions",
    slug: "first-class-functions",
    description: "Pass functions as values and return them from other functions.",
    category: CATEGORY,
    difficulty: 3,
    estimatedMinutes: 10,
    diamondReward: 15,
    experienceReward: 35,
    sortOrder: 8,
    topicOrder: 1,
    content: {
      introduction: "Functions are objects: you can store them in variables, pass them, and return them.",
      objectives: ["Pass/return functions", "Use closures"],
      prerequisites: ["Scope and the LEGB Rule"],
      theory: "Higher-order functions take or return functions. Closures capture variables from enclosing scopes.",
      syntax: "```py\ndef make_adder(n):\n    def adder(x):\n        return x + n\n    return adder\n\nadd5 = make_adder(5)\n```",
      examples: "```py\ndef apply(fn, x):\n    return fn(x)\n\nprint(apply(lambda y: y*2, 3))\n```",
      bestPractices: ["Keep closures small", "Name inner functions meaningfully"],
      pitfalls: ["Capturing mutable loop variables unintentionally"],
      cheatsheet: "# Higher-order\nmap, filter, sorted(key=...), custom HOFs",
      references: [{ label: "Functional Programming HOWTO", url: "https://docs.python.org/3/howto/functional.html" }],
      quiz: {
        questions: [
          {
            type: "multiple_choice",
            question: "What is a closure?",
            options: ["A compiled function", "A function plus its captured environment", "A module", "A class"],
            correctAnswer: 1,
            explanation: "Closures carry bindings from enclosing scopes."
          }
        ]
      }
    }
  },
  {
    title: "Lambda Expressions",
    slug: "lambda-functions",
    description: "Create small anonymous functions with lambda.",
    category: CATEGORY,
    difficulty: 2,
    estimatedMinutes: 7,
    diamondReward: 12,
    experienceReward: 30,
    sortOrder: 9,
    topicOrder: 1,
    content: {
      introduction: "lambda creates a small anonymous function for simple expressions.",
      objectives: ["Write lambda", "Use as key functions"],
      prerequisites: ["First-Class and Higher-Order Functions"],
      theory: "lambda is limited to an expression body; for complex logic use def.",
      syntax: "```py\nsquare = lambda x: x*x\n```",
      examples: "```py\nwords = ['apple', 'bee', 'car']\nprint(sorted(words, key=lambda w: len(w)))\n```",
      bestPractices: ["Prefer def for anything non-trivial"],
      pitfalls: ["Overusing lambdas can hurt readability"],
      cheatsheet: "# Lambda\nlambda args: expr",
      references: [{ label: "Lambda Expressions", url: "https://docs.python.org/3/reference/expressions.html#lambda" }],
      quiz: {
        questions: [
          {
            type: "multiple_choice",
            question: "What can a lambda body contain?",
            options: ["Multiple statements", "A single expression", "Class definitions", "Loops"],
            correctAnswer: 1,
            explanation: "Lambda is expression-only."
          }
        ]
      }
    }
  },
  {
    title: "Annotations, Docstrings, and Type Hints",
    slug: "annotations-docstrings",
    description: "Document and type your functions for clarity and tooling.",
    category: CATEGORY,
    difficulty: 2,
    estimatedMinutes: 9,
    diamondReward: 12,
    experienceReward: 30,
    sortOrder: 10,
    topicOrder: 1,
    content: {
      introduction: "Docstrings explain behavior; annotations provide optional type information.",
      objectives: ["Write docstrings", "Add basic type hints"],
      prerequisites: ["Defining and Calling Functions"],
      theory: "Type hints help static analysis and editors; docstrings are accessible via help() and __doc__.",
      syntax: "```py\ndef add(a: int, b: int) -> int:\n    \"\"\"Return the sum of a and b.\"\"\"\n    return a + b\n```",
      examples: "```py\ndef area(radius: float) -> float:\n    \"\"\"Area of a circle.\"\"\"\n    return 3.14159 * radius * radius\n```",
      bestPractices: ["Use Google or NumPy docstring style consistently", "Hint public APIs"],
      pitfalls: ["Thinking hints are enforced at runtime (they are not)"],
      cheatsheet: "# Hints\nname: Type -> ReturnType",
      references: [{ label: "Typing — Type Hints", url: "https://docs.python.org/3/library/typing.html" }],
      quiz: {
        questions: [
          {
            type: "multiple_choice",
            question: "What are type hints used for?",
            options: ["Runtime enforcement", "Static analysis and tooling", "Performance", "Nothing"],
            correctAnswer: 1,
            explanation: "They aid tooling; Python ignores them at runtime."
          }
        ]
      }
    }
  }
]

/**
* Build a small question bank per category and pad to minimum 5 questions.
*/
function getGenericQuestionBank(category: string) {
 const lower = (category || "").toLowerCase();
 if (lower.includes("function")) {
   return [
     {
       type: "multiple_choice",
       question: "Which keyword defines a function?",
       options: ["func", "def", "function", "lambda only"],
       correctAnswer: 1,
       explanation: "Use 'def' to define a named function."
     },
     {
       type: "multiple_choice",
       question: "What is the difference between parameters and arguments?",
       options: [
         "None; same thing",
         "Parameters are placeholders in definition; arguments are values at call site",
         "Arguments are placeholders; parameters are values",
         "Parameters only apply to classes"
       ],
       correctAnswer: 1,
       explanation: "Parameters in the definition receive arguments at the call site."
     },
     {
       type: "multiple_choice",
       question: "What does a function return when there is no return statement?",
       options: ["0", "False", "None", "''"],
       correctAnswer: 2,
       explanation: "Python returns None implicitly."
     },
     {
       type: "multiple_choice",
       question: "What do *args and **kwargs collect?",
       options: [
         "Positional and keyword arguments, respectively",
         "Only keyword arguments",
         "Only positional arguments",
         "Local variables"
       ],
       correctAnswer: 0,
       explanation: "*args packs extra positionals (tuple), **kwargs packs extra keywords (dict)."
     },
     {
       type: "multiple_choice",
       question: "Which is true about lambda?",
       options: [
         "Supports multiple statements",
         "May contain loops directly",
         "Has an expression-only body",
         "Is faster than def by definition"
       ],
       correctAnswer: 2,
       explanation: "lambda bodies are single expressions; use def for complex logic."
     },
     {
       type: "multiple_choice",
       question: "Which comes first in the LEGB name resolution order?",
       options: ["Global", "Local", "Built-in", "Enclosing"],
       correctAnswer: 1,
       explanation: "LEGB stands for Local, Enclosing, Global, Built-in."
     }
   ];
 }
 // Fallback generic
 return [
   {
     type: "multiple_choice",
     question: "Which keyword is used to exit a function early?",
     options: ["stop", "break", "return", "exit()"],
     correctAnswer: 2,
     explanation: "Use return to leave the function immediately."
   },
   {
     type: "multiple_choice",
     question: "Where are default parameter values evaluated?",
     options: ["At runtime on each call", "At definition time once", "Only on import", "Never"],
     correctAnswer: 1,
     explanation: "Defaults evaluate once at function definition time."
   },
   {
     type: "multiple_choice",
     question: "What structure is best to return multiple values?",
     options: ["List", "Tuple", "Set", "String"],
     correctAnswer: 1,
     explanation: "Returning a tuple is idiomatic; the caller can unpack."
   },
   {
     type: "multiple_choice",
     question: "Which argument style improves readability when many parameters exist?",
     options: ["Only positional args", "Only *args", "Keyword args", "Only **kwargs"],
     correctAnswer: 2,
     explanation: "Keyword args make intent explicit."
   },
   {
     type: "multiple_choice",
     question: "What does nonlocal affect?",
     options: [
       "Global names only",
       "Binding in an enclosing (but not global) scope",
       "Built-in names",
       "No effect"
     ],
     correctAnswer: 1,
     explanation: "nonlocal rebinds a name found in an enclosing function scope."
   }
 ];
}

function ensureFiveQuestions(content: any, category: string) {
 const out = { ...(content || {}) };
 const quiz = out.quiz ?? { questions: [] };
 const list = Array.isArray(quiz.questions) ? quiz.questions.slice() : [];
 const bank = getGenericQuestionBank(category);
 let i = 0;
 while (list.length < 5) {
   list.push(bank[i % bank.length]);
   i++;
 }
 out.quiz = { questions: list };
 return out;
}

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
   // Content is string JSON consumed by the app parser (ensure >= 5 questions)
   content: JSON.stringify(ensureFiveQuestions(l.content, l.category)),
   createdAt: now(),
   updatedAt: now()
 }))
}

async function main() {
  console.log("Seeding: Insert 10 'Functions' lessons")

  // Ensure idempotency: delete any of our titles before creating
  const titles = lessons.map((l) => l.title)
  const delExistingTitles = await prisma.learningActivity.deleteMany({
    where: { title: { in: titles } }
  })
  if (delExistingTitles.count) {
    console.log(`Deleted existing ${delExistingTitles.count} 'Functions' lesson(s) with matching titles to reseed`)
  }

  // Create 10 "Functions" lessons
  const data = buildCreateMany()
  const createResult = await prisma.learningActivity.createMany({ data, skipDuplicates: true })
  console.log(`Inserted ${createResult.count} 'Functions' lesson(s)`)

  // Optional: report what remains under category
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