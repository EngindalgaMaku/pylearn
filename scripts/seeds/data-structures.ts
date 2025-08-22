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

const CATEGORY = "Data Structures"

const lessons: LessonSeed[] = [
  {
    title: "Lists: Basics and Operations",
    slug: "ds-lists-basics",
    description: "Create, index, and modify Python lists with common operations.",
    category: CATEGORY,
    difficulty: 1,
    estimatedMinutes: 7,
    diamondReward: 10,
    experienceReward: 25,
    sortOrder: 1,
    topicOrder: 1,
    content: {
      introduction:
        "Lists are ordered, mutable sequences. Use them to collect items where order matters and edits are common.",
      objectives: [
        "Create lists and iterate",
        "Index and slice safely",
        "Modify with append/insert/remove",
      ],
      prerequisites: ["Basic Python syntax"],
      theory:
        "Lists preserve insertion order and support in-place mutation. They are the default choice for variable-length sequences.",
      syntax:
        "```py\nnums = [1, 2, 3]\nnums.append(4)\nnums[0] = 10\nprint(nums[1:3])  # [2, 3]\n```",
      examples:
        "```py\nnums = [1, 2, 3]\nfor n in nums:\n    print(n)\n```",
      bestPractices: [
        "Prefer list literals [] over list() when possible",
        "Use list comprehensions for simple transformations",
      ],
      pitfalls: [
        "Assignment copies references, not deep copies",
        "Slicing produces a new list (watch memory on large lists)",
      ],
      cheatsheet:
        "# List basics\nappend, extend, insert, remove, pop, slice [start:end:step]",
      references: [
        {
          label: "Python Tutorial — Data Structures",
          url: "https://docs.python.org/3/tutorial/datastructures.html",
        },
      ],
      quiz: {
        questions: [
          {
            type: "multiple_choice",
            question: "What describes Python lists best?",
            options: [
              "Immutable and unordered",
              "Ordered and mutable",
              "Unordered and mutable",
              "Ordered and immutable",
            ],
            correctAnswer: 1,
            explanation: "Lists preserve order and allow in-place edits.",
          },
        ],
      },
    },
  },
  {
    title: "List Methods and Slicing",
    slug: "ds-list-slicing-methods",
    description:
      "Use list methods (append, extend, sort) and slicing patterns effectively.",
    category: CATEGORY,
    difficulty: 1,
    estimatedMinutes: 8,
    diamondReward: 10,
    experienceReward: 25,
    sortOrder: 2,
    topicOrder: 1,
    content: {
      introduction:
        "List methods help you build and transform lists quickly. Slicing returns sublists without mutating the original.",
      objectives: ["Use sort/reverse", "Slice with steps", "Copy with [:]"],
      prerequisites: ["Lists: Basics and Operations"],
      theory:
        "sort() and reverse() mutate the list. sorted(xs) returns a new list. Slicing uses start:end:step.",
      syntax:
        "```py\nxs = [3, 1, 4, 1, 5]\nxs.sort()            # [1,1,3,4,5]\nys = xs[::-1]        # reversed copy\nzs = xs[1:4]         # slice 1..3\nxs.extend([9, 2])    # append multiple items\n```",
      examples:
        "```py\n# Copy a list\ncopy = xs[:]\n# Every other element\nevens = xs[::2]\n```",
      bestPractices: [
        "Use sorted(...) when you need a new list",
        "Prefer slices over manual loops for simple ranges",
      ],
      pitfalls: [
        "sort() mutates in place (don’t reuse old order afterward)",
        "Negative indices can be confusing at first",
      ],
      cheatsheet: "# Slicing\nxs[start:end:step]\nxs[:] -> shallow copy",
      references: [
        {
          label: "list.sort vs sorted",
          url: "https://docs.python.org/3/howto/sorting.html",
        },
      ],
      quiz: {
        questions: [
          {
            type: "multiple_choice",
            question: "Which statement is true?",
            options: [
              "sorted(xs) mutates xs",
              "xs.sort() returns a new list",
              "xs.sort() mutates xs in place",
              "xs[::-1] sorts ascending",
            ],
            correctAnswer: 2,
            explanation: "list.sort mutates; sorted returns a new list.",
          },
        ],
      },
    },
  },
  {
    title: "Tuples and Immutability",
    slug: "ds-tuples",
    description: "Use tuples for fixed collections and as dictionary keys.",
    category: CATEGORY,
    difficulty: 1,
    estimatedMinutes: 7,
    diamondReward: 10,
    experienceReward: 25,
    sortOrder: 3,
    topicOrder: 1,
    content: {
      introduction:
        "Tuples are immutable sequences, ideal for fixed-size records and as dict keys.",
      objectives: ["Pack/unpack", "Use tuples as dict keys", "Understand immutability"],
      prerequisites: ["Lists: Basics and Operations"],
      theory:
        "Immutability prevents accidental changes. Hashable tuples can be keys when their contents are hashable.",
      syntax:
        "```py\npoint = (3, 5)\nx, y = point\n# point[0] = 10  # TypeError\n```",
      examples:
        "```py\nlocations = {('HQ', 1): 'Lobby'}\nprint(locations.get(('HQ', 1)))\n```",
      bestPractices: ["Use tuples to represent records", "Prefer namedtuple/dataclass for clarity"],
      pitfalls: ["Confusing single-element tuple: (1,) not (1)"],
      cheatsheet: "# Tuple\n(a, b), unpacking, immutability",
      references: [
        {
          label: "Tuples and Sequences",
          url: "https://docs.python.org/3/tutorial/datastructures.html#tuples-and-sequences",
        },
      ],
      quiz: {
        questions: [
          {
            type: "multiple_choice",
            question: "What happens when assigning to a tuple index?",
            options: [
              "Succeeds",
              "Silently ignored",
              "Raises TypeError",
              "Converts to list",
            ],
            correctAnswer: 2,
            explanation: "Tuples are immutable, so assignment raises TypeError.",
          },
        ],
      },
    },
  },
  {
    title: "Dictionaries: Key-Value Mapping",
    slug: "ds-dicts-basics",
    description: "Store and retrieve values by key with dicts.",
    category: CATEGORY,
    difficulty: 1,
    estimatedMinutes: 8,
    diamondReward: 10,
    experienceReward: 25,
    sortOrder: 4,
    topicOrder: 1,
    content: {
      introduction:
        "Dictionaries map keys to values with average O(1) lookups. Keys must be hashable.",
      objectives: ["Add/update keys", "Iterate items", "Use get with default"],
      prerequisites: ["Tuples and Immutability"],
      theory:
        "Dicts are fundamental for structured data and configuration. Iteration order preserves insertion (3.7+).",
      syntax:
        "```py\nuser = {'name': 'Ada', 'age': 36}\nuser['role'] = 'admin'\nprint(user.get('email', 'n/a'))\nfor k, v in user.items():\n    print(k, v)\n```",
      examples:
        "```py\n# Safe access\nemail = user.get('email')\n```",
      bestPractices: ["Use .get for missing keys", "Prefer dict literals {}"],
      pitfalls: ["Unhashable (mutable) objects cannot be keys"],
      cheatsheet: "# Dict\n{}, get, items, keys, values",
      references: [
        {
          label: "Mapping Types — dict",
          url: "https://docs.python.org/3/library/stdtypes.html#mapping-types-dict",
        },
      ],
      quiz: {
        questions: [
          {
            type: "multiple_choice",
            question: "Which can be a dict key?",
            options: ["list", "set", "tuple", "dict"],
            correctAnswer: 2,
            explanation: "Tuples are hashable if their contents are hashable.",
          },
        ],
      },
    },
  },
  {
    title: "Advanced Dict Patterns",
    slug: "ds-dict-advanced",
    description: "Dict views, comprehension, and merging techniques.",
    category: CATEGORY,
    difficulty: 2,
    estimatedMinutes: 9,
    diamondReward: 12,
    experienceReward: 30,
    sortOrder: 5,
    topicOrder: 1,
    content: {
      introduction:
        "Learn views, comprehensions, and merging to write concise dict code.",
      objectives: ["Use dict views", "Write dict comprehensions", "Merge dicts"],
      prerequisites: ["Dictionaries: Key-Value Mapping"],
      theory:
        "Views reflect live changes. Comprehensions express transformations. Python 3.9+ adds | and |= operators for merging.",
      syntax:
        "```py\nscores = {'a': 10, 'b': 5, 'c': 8}\nkeys = scores.keys()\nscores['d'] = 7\nscaled = {k: v*10 for k, v in scores.items() if v >= 7}\nmerged = {'x':1} | {'y':2}\n```",
      examples:
        "```py\n# Conditional merge\nconfig = base | overrides\n```",
      bestPractices: ["Prefer comprehensions to build dicts", "Keep comprehensions readable"],
      pitfalls: ["Remember views are dynamic; copy if needed"],
      cheatsheet: "# Merge\nleft | right  (3.9+)",
      references: [
        {
          label: "PEP 584 — Union Operators for dict",
          url: "https://peps.python.org/pep-0584/",
        },
      ],
      quiz: {
        questions: [
          {
            type: "multiple_choice",
            question: "Which merges two dicts in Python 3.9+?",
            options: ["+", "|", "&", "^"],
            correctAnswer: 1,
            explanation: "The | operator merges dicts since 3.9.",
          },
        ],
      },
    },
  },
  {
    title: "Sets and Set Operations",
    slug: "ds-sets",
    description:
      "Use sets for unique items, membership tests, and math-like operations.",
    category: CATEGORY,
    difficulty: 1,
    estimatedMinutes: 8,
    diamondReward: 10,
    experienceReward: 25,
    sortOrder: 6,
    topicOrder: 1,
    content: {
      introduction:
        "Sets store unique, unordered items with fast membership tests.",
      objectives: ["Create sets", "Use union/intersection/difference", "Test membership"],
      prerequisites: ["Dictionaries: Key-Value Mapping"],
      theory:
        "Set operations mirror mathematics and are implemented efficiently with hashing.",
      syntax:
        "```py\na = {1, 2, 3}\nb = {3, 4}\nprint(2 in a)      # True\nprint(a | b)       # union -> {1,2,3,4}\nprint(a & b)       # intersection -> {3}\nprint(a - b)       # difference -> {1,2}\n```",
      examples:
        "```py\n# Remove duplicates\nunique = set([1,1,2,3])\n```",
      bestPractices: ["Use sets to deduplicate", "Prefer set comprehensions for transforms"],
      pitfalls: ["Unhashable elements (e.g., lists) cannot be members"],
      cheatsheet: "# Set ops\n| union, & intersect, - diff, ^ symmetric diff",
      references: [
        {
          label: "Set Types — set, frozenset",
          url: "https://docs.python.org/3/library/stdtypes.html#set-types-set-frozenset",
        },
      ],
      quiz: {
        questions: [
          {
            type: "multiple_choice",
            question: "Average complexity of membership test in a set?",
            options: ["O(n)", "O(log n)", "O(1) average", "O(n log n)"],
            correctAnswer: 2,
            explanation: "Hash-based membership is O(1) on average.",
          },
        ],
      },
    },
  },
  {
    title: "Strings as Sequences",
    slug: "ds-strings-as-sequences",
    description:
      "Treat strings like immutable sequences for slicing and iteration.",
    category: CATEGORY,
    difficulty: 1,
    estimatedMinutes: 7,
    diamondReward: 10,
    experienceReward: 25,
    sortOrder: 7,
    topicOrder: 1,
    content: {
      introduction:
        "Strings are immutable sequences of Unicode code points and support slicing and iteration.",
      objectives: ["Index/slice strings", "Iterate characters", "Use common string methods"],
      prerequisites: ["List Methods and Slicing"],
      theory:
        "Immutability enables safe sharing. Many methods return new strings instead of mutating.",
      syntax:
        "```py\ns = 'python'\nprint(s[0], s[-1])   # p n\nprint(s[1:4])        # yth\nfor ch in s:\n    print(ch)\n```",
      examples:
        "```py\n'-'.join(['a','b','c'])  # 'a-b-c'\n```",
      bestPractices: ["Use join for assembling strings", "Prefer f-strings for formatting"],
      pitfalls: ["Repeated concatenation in loops can be slow (use join)"],
      cheatsheet: "# String methods\nsplit, join, replace, strip, lower/upper",
      references: [
        {
          label: "Text Sequence Type — str",
          url: "https://docs.python.org/3/library/stdtypes.html#text-sequence-type-str",
        },
      ],
      quiz: {
        questions: [
          {
            type: "multiple_choice",
            question: "Strings in Python are:",
            options: [
              "Mutable sequences",
              "Immutable sequences",
              "Unordered containers",
              "Always ASCII only",
            ],
            correctAnswer: 1,
            explanation: "Strings are immutable sequences of Unicode characters.",
          },
        ],
      },
    },
  },
  {
    title: "Stacks and Queues (collections.deque)",
    slug: "ds-stacks-queues",
    description: "Implement stack/queue efficiently with deque.",
    category: CATEGORY,
    difficulty: 2,
    estimatedMinutes: 9,
    diamondReward: 12,
    experienceReward: 30,
    sortOrder: 8,
    topicOrder: 1,
    content: {
      introduction:
        "collections.deque offers O(1) appends and pops from both ends.",
      objectives: ["Build FIFO/LIFO structures", "Choose deque vs list"],
      prerequisites: ["Lists: Basics and Operations"],
      theory:
        "Deque is a double-ended queue implemented with a linked block structure for fast ends operations.",
      syntax:
        "```py\nfrom collections import deque\nq = deque()\nq.append(1); q.append(2)\nq.popleft()   # 1\nstack = deque()\nstack.append('a'); stack.append('b')\nstack.pop()   # 'b'\n```",
      examples:
        "```py\n# Bounded queue\ndq = deque(maxlen=3)\nfor i in range(5):\n    dq.append(i)\n# dq keeps last 3 items\n```",
      bestPractices: ["Prefer deque for queue/stack; avoid list.pop(0)"],
      pitfalls: ["Random indexing in deque is O(n)"],
      cheatsheet: "# Deque\nappend, appendleft, pop, popleft",
      references: [
        {
          label: "collections — deque",
          url: "https://docs.python.org/3/library/collections.html#collections.deque",
        },
      ],
      quiz: {
        questions: [
          {
            type: "multiple_choice",
            question:
              "Which structure offers O(1) push/pop at both ends in CPython?",
            options: ["list", "deque", "set", "tuple"],
            correctAnswer: 1,
            explanation: "deque is optimized for both ends operations.",
          },
        ],
      },
    },
  },
  {
    title: "Heaps and Priority Queues (heapq)",
    slug: "ds-heaps",
    description: "Use heapq for efficient priority scheduling.",
    category: CATEGORY,
    difficulty: 2,
    estimatedMinutes: 10,
    diamondReward: 12,
    experienceReward: 30,
    sortOrder: 9,
    topicOrder: 1,
    content: {
      introduction:
        "heapq implements a binary min-heap on top of a list for priority queues.",
      objectives: ["Push/pop with priorities", "Understand min-heap behavior"],
      prerequisites: ["Lists: Basics and Operations"],
      theory:
        "heappush/pop are O(log n). The smallest item is always at index 0.",
      syntax:
        "```py\nimport heapq\nh = []\nheapq.heappush(h, (2, 'low'))\nheapq.heappush(h, (1, 'high'))\nprint(heapq.heappop(h))  # (1, 'high')\n```",
      examples:
        "```py\n# Max-heap via negative key\nheapq.heappush(h, (-priority, item))\n```",
      bestPractices: ["Store (priority, item) tuples", "Keep heap separate from other lists"],
      pitfalls: ["Modifying items in-place can break heap invariants"],
      cheatsheet: "# heapq\nheappush, heappop, heapify",
      references: [
        {
          label: "heapq — Heap queue algorithm",
          url: "https://docs.python.org/3/library/heapq.html",
        },
      ],
      quiz: {
        questions: [
          {
            type: "multiple_choice",
            question: "heappop returns:",
            options: [
              "Largest element",
              "Random element",
              "Smallest element",
              "Second smallest element",
            ],
            correctAnswer: 2,
            explanation: "heapq implements a min-heap.",
          },
        ],
      },
    },
  },
  {
    title: "Choosing the Right Data Structure",
    slug: "ds-choosing",
    description:
      "Match problems to lists, tuples, dicts, sets, deque, and heapq.",
    category: CATEGORY,
    difficulty: 2,
    estimatedMinutes: 9,
    diamondReward: 12,
    experienceReward: 30,
    sortOrder: 10,
    topicOrder: 1,
    content: {
      introduction:
        "Each structure has trade-offs: mutability, ordering, uniqueness, and performance.",
      objectives: [
        "Identify correct structure by use-case",
        "Explain time/space implications",
      ],
      prerequisites: [
        "Lists",
        "Tuples",
        "Dicts",
        "Sets",
        "deque",
        "heapq",
      ],
      theory:
        "Picking the right structure improves clarity and performance. Consider access/update patterns and constraints.",
      syntax:
        "```py\n# Cheatsheet\n# set: uniqueness + fast membership\n# list: ordered, mutable, variable length\n# tuple: fixed record, hashable if contents are\n# dict: key/value mapping\n# deque: FIFO/LIFO with O(1) ends\n# heapq: prioritized tasks\n```",
      examples:
        "```py\n# Deduplicate while preserving order\nseen = set()\nresult = []\nfor x in data:\n    if x not in seen:\n        seen.add(x)\n        result.append(x)\n```",
      bestPractices: [
        "Optimize for clarity first, then performance",
        "Measure with timeit for critical paths",
      ],
      pitfalls: ["Premature optimization with exotic structures"],
      cheatsheet:
        "# Choices\nset: membership • list: ordered edits • dict: mapping • deque: ends • heapq: priority",
      references: [
        {
          label: "Time Complexity (Wiki)",
          url: "https://wiki.python.org/moin/TimeComplexity",
        },
      ],
      quiz: {
        questions: [
          {
            type: "multiple_choice",
            question:
              "Which is best for fast membership test with uniqueness?",
            options: ["list", "tuple", "set", "dict"],
            correctAnswer: 2,
            explanation: "Sets provide O(1) average membership and uniqueness.",
          },
        ],
      },
    },
  },
]

/**
* Build a small question bank per category and pad to minimum 5 questions.
*/
function getGenericQuestionBank(category: string) {
 const lower = (category || "").toLowerCase();
 if (lower.includes("data") || lower.includes("structure")) {
   return [
     {
       type: "multiple_choice",
       question: "Python lists are best described as:",
       options: [
         "Immutable and unordered",
         "Ordered and mutable",
         "Unordered and mutable",
         "Ordered and immutable"
       ],
       correctAnswer: 1,
       explanation: "Lists preserve order and allow in-place mutation."
     },
     {
       type: "multiple_choice",
       question: "Which structure is hashable (when contents are hashable) and can be used as a dict key?",
       options: ["list", "set", "tuple", "bytearray"],
       correctAnswer: 2,
       explanation: "Tuples are immutable and hashable if their contents are hashable."
     },
     {
       type: "multiple_choice",
       question: "Which operation merges two dicts in Python 3.9+?",
       options: ["+", "|", "&", "^"],
       correctAnswer: 1,
       explanation: "The | operator merges dictionaries (PEP 584)."
     },
     {
       type: "multiple_choice",
       question: "Average membership test complexity in a set is:",
       options: ["O(n)", "O(log n)", "O(1) average", "O(n log n)"],
       correctAnswer: 2,
       explanation: "Sets use hashing, giving O(1) average membership tests."
     },
     {
       type: "multiple_choice",
       question: "Which method sorts a list in place?",
       options: ["sorted(xs)", "xs.sort()", "xs[::-1]", "reversed(xs)"],
       correctAnswer: 1,
       explanation: "list.sort() mutates the list; sorted(xs) returns a new list."
     },
     {
       type: "multiple_choice",
       question: "Which is best for O(1) append/pop from both ends?",
       options: ["list", "deque", "set", "tuple"],
       correctAnswer: 1,
       explanation: "collections.deque is optimized for both ends."
     }
   ];
 }
 // Fallback generic
 return [
   {
     type: "multiple_choice",
     question: "Which structure enforces uniqueness of elements?",
     options: ["list", "tuple", "set", "dict"],
     correctAnswer: 2,
     explanation: "Sets store unique items with fast membership tests."
   },
   {
     type: "multiple_choice",
     question: "Which structure preserves insertion order and is mutable?",
     options: ["set", "tuple", "list", "frozenset"],
     correctAnswer: 2,
     explanation: "Lists are ordered and mutable."
   },
   {
     type: "multiple_choice",
     question: "Which is immutable and commonly used for fixed records?",
     options: ["list", "deque", "tuple", "set"],
     correctAnswer: 2,
     explanation: "Tuples are immutable sequences."
   },
   {
     type: "multiple_choice",
     question: "Which provides key-value mapping with average O(1) lookup?",
     options: ["list", "dict", "set", "tuple"],
     correctAnswer: 1,
     explanation: "Dictionaries provide fast key lookups."
   },
   {
     type: "multiple_choice",
     question: "Which copy operation creates a shallow copy of a list?",
     options: ["xs.copy()", "xs = xs", "xs.deep_copy()", "+= []"],
     correctAnswer: 0,
     explanation: "xs.copy() (or xs[:]) shallow-copies a list."
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
  console.log("Seeding: Purge and insert 10 'Data Structures' lessons")

  // 1) Purge all existing lessons in this category to remove wrong-format seeds
  const delByCategory = await prisma.learningActivity.deleteMany({
    where: {
      activityType: "lesson",
      category: { equals: CATEGORY, mode: "insensitive" },
    },
  })
  if (delByCategory.count) {
    console.log(`Deleted ${delByCategory.count} lessons in category '${CATEGORY}'`)
  }

  // 2) Extra safety: delete by our intended titles (idempotency)
  const titles = lessons.map((l) => l.title)
  const delExistingTitles = await prisma.learningActivity.deleteMany({
    where: { title: { in: titles } },
  })
  if (delExistingTitles.count) {
    console.log(
      `Deleted existing ${delExistingTitles.count} '${CATEGORY}' lesson(s) with matching titles to reseed`
    )
  }

  // 3) Insert corrected lessons (content stored as JSON string per app parser)
  const data = buildCreateMany()
  const createResult = await prisma.learningActivity.createMany({
    data,
    skipDuplicates: true,
  })
  console.log(`Inserted ${createResult.count} '${CATEGORY}' lesson(s)`)

  // 4) Report total
  const total = await prisma.learningActivity.count({
    where: {
      activityType: "lesson",
      category: { equals: CATEGORY, mode: "insensitive" },
    },
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