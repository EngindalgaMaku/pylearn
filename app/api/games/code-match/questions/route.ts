import { NextResponse } from "next/server"

type Question = {
  id: number
  code: string
  options: string[]
  correct: number
}

const QUESTIONS_POOL: Question[] = [
  { id: 1, code: "print('Hello World')", options: ["Hello World", "print('Hello World')", "Hello", "World"], correct: 0 },
  { id: 2, code: "len('Python')", options: ["5", "6", "7", "Python"], correct: 1 },
  { id: 3, code: "3 + 4 * 2", options: ["14", "11", "10", "24"], correct: 1 },
  { id: 4, code: "type(42)", options: ["<class 'str'>", "<class 'int'>", "<class 'float'>", "42"], correct: 1 },
  { id: 5, code: "'Python'.upper()", options: ["python", "PYTHON", "Python", "PyThOn"], correct: 1 },
  { id: 6, code: "'abc' * 3", options: ["abcabc", "abcabcabc", "abc", "abc abc abc"], correct: 1 },
  { id: 7, code: "10 // 3", options: ["3", "3.3333", "3.0", "4"], correct: 0 },
  { id: 8, code: "10 / 4", options: ["2", "2.5", "2.0", "2.25"], correct: 1 },
  { id: 9, code: "10 % 4", options: ["1", "2", "3", "4"], correct: 1 },
  { id: 10, code: "2 ** 3", options: ["6", "8", "9", "16"], correct: 1 },
  { id: 11, code: "bool([])", options: ["True", "False", "[]", "0"], correct: 1 },
  { id: 12, code: "bool()", options: ["False", "True", "0", "None"], correct: 1 },
  { id: 13, code: "", options: ["1", "0", "2", ""], correct: 0 },
  { id: 14, code: "[-1]", options: ["-1", "3", "2", "Error"], correct: 1 },
  { id: 15, code: "'hello'[1:4]", options: ["ell", "hel", "llo", "heo"], correct: 0 },
  { id: 16, code: "'hello'[::-1]", options: ["olleh", "hello", "ehllo", "holle"], correct: 0 },
  { id: 17, code: "','.join(['a','b','c'])", options: ["a,b,c", "['a','b','c']", "a b c", "abc"], correct: 0 },
  { id: 18, code: "'a,b,c'.split(',')", options: ["['a','b','c']", "['a', 'b', 'c']", "( 'a','b','c' )", "['a, b, c']"], correct: 1 },
  { id: 19, code: "{'x': 1}.get('y', 2)", options: ["1", "2", "None", "'y'"], correct: 1 },
  { id: 20, code: "len(set())", options: ["2", "3", "4", "1"], correct: 1 },
  { id: 21, code: "sum()", options: ["5", "6", "3", "'6'"], correct: 1 },
  { id: 22, code: "min()", options: ["1", "2", "3", "0"], correct: 0 },
  { id: 23, code: "max('bca')", options: ["b", "c", "a", "'c'"], correct: 1 },
  { id: 24, code: "sorted()", options: ["", "", "(1,2,3)", "{1,2,3}"], correct: 1 },
  { id: 25, code: "sorted('bca')", options: ["'abc'", "['a', 'b', 'c']", "('a','b','c')", "['b','c','a']"], correct: 1 },
  { id: 26, code: "tuple()", options: ["", "(1, 2)", "{1, 2}", "1, 2"], correct: 1 },
  { id: 27, code: "list((1, 2))", options: ["(1, 2)", "", "{1, 2}", "1,2"], correct: 1 },
  { id: 28, code: "a, b = 1, 2; print(a + b)", options: ["12", "3", "(1, 2)", "Error"], correct: 1 },
  { id: 29, code: "'5' + '6'", options: ["11", "56", "'56'", "5 6"], correct: 1 },
  { id: 30, code: "int('5') + int('6')", options: ["56", "'11'", "11", "Error"], correct: 2 },
  { id: 31, code: "float('3.14')", options: ["3.14", "3,14", "'3.14'", "3"], correct: 0 },
  { id: 32, code: "type(3.0)", options: ["<class 'int'>", "<class 'float'>", "float", "3.0"], correct: 1 },
  { id: 33, code: "isinstance(True, int)", options: ["True", "False", "Error", "0"], correct: 0 },
  { id: 34, code: "0 and 5", options: ["0", "5", "True", "False"], correct: 0 },
  { id: 35, code: "0 or 5", options: ["0", "5", "True", "False"], correct: 1 },
  { id: 36, code: "5 and 0", options: ["0", "5", "True", "False"], correct: 0 },
  { id: 37, code: "5 or 0", options: ["0", "5", "True", "False"], correct: 1 },
  { id: 38, code: "None == 0", options: ["True", "False", "None", "0"], correct: 1 },
  { id: 39, code: "None is None", options: ["True", "False", "None", "Error"], correct: 0 },
  { id: 40, code: "'Py' in 'Python'", options: ["True", "False", "'Py'", "'Python'"], correct: 0 },
  { id: 41, code: "'x' not in 'abc'", options: ["True", "False", "'x'", "'abc'"], correct: 0 },
  { id: 42, code: "[i*i for i in range(3)]", options: ["", "", "", ""], correct: 1 },
  { id: 43, code: "sum(i for i in range(4))", options: ["4", "6", "10", "3"], correct: 1 },
  { id: 44, code: "{x: x*x for x in range(3)}", options: ["2", "4", "", "Error"], correct: 1 },
  { id: 45, code: "len({1,2,3} & {2,3,4})", options: ["1", "2", "3", "4"], correct: 1 },
  { id: 46, code: "'-'.join('abc')", options: ["a-b-c", "abc-", "-a-b-c-", "a,b,c"], correct: 0 },
  { id: 47, code: "list('hi')", options: ["['hi']", "['h', 'i']", "('h','i')", "['h',' i']"], correct: 1 },
  { id: 48, code: ".pop()", options: ["", "3", "None", "Error"], correct: 1 },
  { id: 49, code: "[][0:1]", options: ["[]", "", "", "Error"], correct: 0 },
  { id: 50, code: "(1,)*3", options: ["(3)", "", "(1, 1, 1)", "1,1,1"], correct: 2 },
]

// Fisher–Yates shuffle
function shuffleArray<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Shuffle options of a single question and adjust the correct index
function shuffleQuestionOptions(q: Question): Question {
  const indices = q.options.map((_, i) => i)
  const shuffledIdx = shuffleArray(indices)
  const shuffledOptions = shuffledIdx.map(i => q.options[i])
  const newCorrect = shuffledIdx.indexOf(q.correct)
  return { ...q, options: shuffledOptions, correct: newCorrect }
}

export async function GET() {
  try {
    const shuffledQuestions = shuffleArray(QUESTIONS_POOL)
      .slice(0, 10)
      .map(shuffleQuestionOptions)
    return NextResponse.json(shuffledQuestions)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 })
  }
}