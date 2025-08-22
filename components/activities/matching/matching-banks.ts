export type MatchingPair = {
  left: string
  right: string
  topic?: string
  // Optional explanatory text shown after a correct match
  explanation?: string
}

export type MatchingConfig = {
  slug: string
  title: string
  timeLimitSec: number
  // Optional instructional text displayed on the start screen
  instructions?: string
  pairs: MatchingPair[]
}

const BANK: Record<string, MatchingConfig> = {
  "python-basics-matching": {
    slug: "python-basics-matching",
    title: "Python Basics: Terms & Definitions",
    timeLimitSec: 6 * 60,
    pairs: [
      { left: "list", right: "Mutable sequence of items", topic: "data types" },
      { left: "tuple", right: "Immutable sequence of items", topic: "data types" },
      { left: "dict", right: "Key-value mapping", topic: "data types" },
      { left: "set", right: "Unordered unique elements", topic: "data types" },
      { left: "def", right: "Define a function", topic: "syntax" },
      { left: "for", right: "Iterate over a sequence", topic: "control flow" },
      { left: "if", right: "Conditional branching", topic: "control flow" },
      { left: "len(x)", right: "Number of items in x", topic: "builtins" },
      { left: "str", right: "Text data type", topic: "data types" },
      { left: "int", right: "Integer number", topic: "data types" },
      { left: "float", right: "Decimal number", topic: "data types" },
      { left: "None", right: "Absence of a value", topic: "special" },
    ],
  },
}

export function getMatchingConfig(slug: string): MatchingConfig | null {
  return BANK[slug] ?? null
}
