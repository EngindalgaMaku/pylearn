// Centralized question banks for Activity quizzes (keyed by slug)

export type QuizQuestion = {
  question: string
  options: string[]
  correctIndex: number
  explanation?: string
  topic?: string
}

export type QuizConfig = {
  title: string
  timeLimitSec?: number
  questions: QuizQuestion[]
}

/**
 * Add new quizzes by adding new keys to this object.
 * Key must match the activity slug, e.g. /activities/{slug}
 */
export const QUIZ_BANKS: Record<string, QuizConfig> = {
  // http://localhost:3000/activities/python-basics-syntax-quiz
  "python-basics-syntax-quiz": {
    title: "Python Basics Syntax Quiz",
    timeLimitSec: 10 * 60, // 10 minutes
    questions: [
      {
        question: "What is the correct way to create a comment in Python?",
        options: ["# This is a comment", "// This is a comment", "<!-- This is a comment -->", "/* This is a comment */"],
        correctIndex: 0,
        explanation: "In Python, single-line comments start with the # symbol.",
        topic: "Syntax",
      },
      {
        question: "Which of the following is the correct way to create a list in Python?",
        options: ["list = {1, 2, 3}", "list = [1, 2, 3]", "list = (1, 2, 3)", "list = <1, 2, 3>"],
        correctIndex: 1,
        explanation: "Lists in Python are created using square brackets [].",
        topic: "Data Types",
      },
      {
        question: "What is the output of: print(type(5.0))?",
        options: ["<class 'int'>", "<class 'float'>", "<class 'double'>", "<class 'number'>"],
        correctIndex: 1,
        explanation: "5.0 is a floating-point number, so its type is 'float'.",
        topic: "Data Types",
      },
      {
        question: "Which keyword is used to define a function in Python?",
        options: ["function", "def", "func", "define"],
        correctIndex: 1,
        explanation: "The 'def' keyword is used to define functions in Python.",
        topic: "Functions",
      },
      {
        question: "What does the len() function return for an empty string?",
        options: ["None", "null", "0", "1"],
        correctIndex: 2,
        explanation: "len() returns the number of characters in a string. An empty string has 0 characters.",
        topic: "Built-in Functions",
      },
    ],
  },
  
  // http://localhost:3000/activities/python-data-types-mastery-quiz
  "python-data-types-mastery-quiz": {
    title: "Python Data Types Mastery Quiz",
    timeLimitSec: 15 * 60, // 15 minutes
    questions: [
      {
        question: "Which of the following is NOT a built-in data type in Python?",
        options: ["list", "tuple", "array", "dictionary"],
        correctIndex: 2,
        explanation: "Arrays are not built-in data types in Python. The array module provides an array object, but it's not a built-in type. Lists, tuples, and dictionaries are all built-in data types.",
        topic: "Data Types",
      },
      {
        question: "What is the result of the expression: 3 + 2 * 2?",
        options: ["10", "7", "5", "Error"],
        correctIndex: 1,
        explanation: "Python follows the order of operations (PEMDAS). Multiplication happens before addition, so 2 * 2 = 4, then 3 + 4 = 7.",
        topic: "Operators",
      },
      {
        question: "Which of the following is mutable?",
        options: ["string", "tuple", "list", "None of the above"],
        correctIndex: 2,
        explanation: "Lists are mutable, meaning they can be changed after creation. Strings and tuples are immutable.",
        topic: "Data Types",
      },
      {
        question: "What is the output of: print(type({}))?",
        options: ["<class 'list'>", "<class 'dict'>", "<class 'set'>", "<class 'tuple'>"],
        correctIndex: 1,
        explanation: "Empty curly braces {} create an empty dictionary in Python.",
        topic: "Data Types",
      },
      {
        question: "Which data type is used to store a sequence of characters in Python?",
        options: ["char", "string", "str", "text"],
        correctIndex: 2,
        explanation: "In Python, the 'str' data type is used to store sequences of characters. There is no separate 'char' type like in some other languages.",
        topic: "Data Types",
      },
      {
        question: "What does the following code return: bool(0)?",
        options: ["True", "False", "None", "Error"],
        correctIndex: 1,
        explanation: "In Python, the integer 0 is considered False when converted to a boolean.",
        topic: "Data Types",
      },
      {
        question: "What is the output of: print(2 ** 3)?",
        options: ["6", "8", "5", "Error"],
        correctIndex: 1,
        explanation: "The ** operator in Python represents exponentiation. 2 ** 3 means 2 raised to the power of 3, which equals 8.",
        topic: "Operators",
      },
    ],
  },
}

/**
 * Fetch quiz configuration by activity slug.
 * If the quiz is not defined, generates a default quiz based on the slug.
 */
export function getQuizConfig(slug: string): QuizConfig | null {
  // Önce mevcut quiz bankasından kontrol et
  if (QUIZ_BANKS[slug]) {
    return QUIZ_BANKS[slug];
  }
  
  // Eğer quiz bulunamazsa, slug'dan bir başlık oluştur
  const title = slugToTitle(slug);
  
  // Slug'a göre kategori belirle
  const category = determineCategory(slug);
  
  // Kategori bazlı örnek sorular oluştur
  return generateDefaultQuiz(title, category);
}

/**
 * Slug'dan başlık oluşturur.
 */
function slugToTitle(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Slug'a göre kategori belirler.
 */
function determineCategory(slug: string): string {
  if (slug.includes('data-types')) return 'Data Types';
  if (slug.includes('operators')) return 'Operators';
  if (slug.includes('functions')) return 'Functions';
  if (slug.includes('loops')) return 'Loops';
  if (slug.includes('conditionals')) return 'Conditionals';
  if (slug.includes('syntax')) return 'Syntax';
  return 'Python';
}

/**
 * Başlık ve kategoriye göre varsayılan bir quiz oluşturur.
 */
function generateDefaultQuiz(title: string, category: string): QuizConfig {
  // Kategori bazlı örnek sorular
  const categoryQuestions: Record<string, QuizQuestion[]> = {
    'Data Types': [
      {
        question: "Which of the following is NOT a built-in data type in Python?",
        options: ["list", "tuple", "array", "dictionary"],
        correctIndex: 2,
        explanation: "Arrays are not built-in data types in Python. The array module provides an array object, but it's not a built-in type.",
        topic: "Data Types",
      },
      {
        question: "Which of the following is mutable?",
        options: ["string", "tuple", "list", "None of the above"],
        correctIndex: 2,
        explanation: "Lists are mutable, meaning they can be changed after creation. Strings and tuples are immutable.",
        topic: "Data Types",
      },
      {
        question: "What is the output of: print(type({}))?",
        options: ["<class 'list'>", "<class 'dict'>", "<class 'set'>", "<class 'tuple'>"],
        correctIndex: 1,
        explanation: "Empty curly braces {} create an empty dictionary in Python.",
        topic: "Data Types",
      },
      {
        question: "Which data type is used to store a sequence of characters in Python?",
        options: ["char", "string", "str", "text"],
        correctIndex: 2,
        explanation: "In Python, the 'str' data type is used to store sequences of characters.",
        topic: "Data Types",
      },
      {
        question: "What does the following code return: bool(0)?",
        options: ["True", "False", "None", "Error"],
        correctIndex: 1,
        explanation: "In Python, the integer 0 is considered False when converted to a boolean.",
        topic: "Data Types",
      },
    ],
    'Operators': [
      {
        question: "What is the result of the expression: 3 + 2 * 2?",
        options: ["10", "7", "5", "Error"],
        correctIndex: 1,
        explanation: "Python follows the order of operations (PEMDAS). Multiplication happens before addition, so 2 * 2 = 4, then 3 + 4 = 7.",
        topic: "Operators",
      },
      {
        question: "What is the output of: print(2 ** 3)?",
        options: ["6", "8", "5", "Error"],
        correctIndex: 1,
        explanation: "The ** operator in Python represents exponentiation. 2 ** 3 means 2 raised to the power of 3, which equals 8.",
        topic: "Operators",
      },
      {
        question: "What does the % operator do in Python?",
        options: ["Division", "Modulus", "Percentage", "Floor Division"],
        correctIndex: 1,
        explanation: "The % operator in Python returns the remainder of a division operation.",
        topic: "Operators",
      },
      {
        question: "What is the output of: print(10 // 3)?",
        options: ["3.33", "3", "4", "Error"],
        correctIndex: 1,
        explanation: "The // operator performs floor division, which returns the largest integer less than or equal to the result.",
        topic: "Operators",
      },
      {
        question: "What is the output of: print('Hello' + 'World')?",
        options: ["HelloWorld", "Hello World", "Hello+World", "Error"],
        correctIndex: 0,
        explanation: "The + operator concatenates strings in Python without adding spaces.",
        topic: "Operators",
      },
    ],
    'Functions': [
      {
        question: "Which keyword is used to define a function in Python?",
        options: ["function", "def", "func", "define"],
        correctIndex: 1,
        explanation: "The 'def' keyword is used to define functions in Python.",
        topic: "Functions",
      },
      {
        question: "What is the correct way to call a function named 'greet'?",
        options: ["greet()", "call greet()", "function greet()", "invoke greet()"],
        correctIndex: 0,
        explanation: "To call a function in Python, you use the function name followed by parentheses.",
        topic: "Functions",
      },
      {
        question: "What does the 'return' keyword do in a function?",
        options: ["Prints a value", "Exits the function", "Sends a value back to the caller", "Creates a variable"],
        correctIndex: 2,
        explanation: "The 'return' keyword is used to send a value back to the caller of the function.",
        topic: "Functions",
      },
      {
        question: "Which of the following is a built-in function in Python?",
        options: ["create()", "print()", "display()", "show()"],
        correctIndex: 1,
        explanation: "print() is a built-in function in Python used to display output.",
        topic: "Functions",
      },
      {
        question: "What happens if a function doesn't have a return statement?",
        options: ["It returns 0", "It returns None", "It causes an error", "It returns an empty string"],
        correctIndex: 1,
        explanation: "If a function doesn't have a return statement, it implicitly returns None.",
        topic: "Functions",
      },
    ],
    'Syntax': [
      {
        question: "What is the correct way to create a comment in Python?",
        options: ["# This is a comment", "// This is a comment", "<!-- This is a comment -->", "/* This is a comment */"],
        correctIndex: 0,
        explanation: "In Python, single-line comments start with the # symbol.",
        topic: "Syntax",
      },
      {
        question: "Which of the following is used for indentation in Python?",
        options: ["Curly braces {}", "Parentheses ()", "Spaces or tabs", "Semicolons ;"],
        correctIndex: 2,
        explanation: "Python uses spaces or tabs for indentation to define code blocks.",
        topic: "Syntax",
      },
      {
        question: "What is the correct way to end a statement in Python?",
        options: ["Semicolon ;", "Period .", "Colon :", "Newline"],
        correctIndex: 3,
        explanation: "In Python, statements typically end with a newline. Semicolons are optional and rarely used.",
        topic: "Syntax",
      },
      {
        question: "Which of the following is NOT a valid variable name in Python?",
        options: ["my_var", "_var", "2var", "var2"],
        correctIndex: 2,
        explanation: "Variable names cannot start with a number in Python.",
        topic: "Syntax",
      },
      {
        question: "What is the purpose of the colon (:) in Python?",
        options: ["End statements", "Separate key-value pairs", "Start a new block of code", "All of the above"],
        correctIndex: 2,
        explanation: "The colon is used to denote the start of a new block of code, such as in if statements, loops, and function definitions.",
        topic: "Syntax",
      },
    ],
    'Python': [
      {
        question: "What is Python?",
        options: ["A snake species", "A programming language", "A web browser", "A database system"],
        correctIndex: 1,
        explanation: "Python is a high-level, interpreted programming language known for its readability and simplicity.",
        topic: "General",
      },
      {
        question: "Who created Python?",
        options: ["Guido van Rossum", "Bill Gates", "Mark Zuckerberg", "Linus Torvalds"],
        correctIndex: 0,
        explanation: "Python was created by Guido van Rossum and first released in 1991.",
        topic: "General",
      },
      {
        question: "What is the current stable version of Python?",
        options: ["Python 2.7", "Python 3.6", "Python 3.9", "Python 3.12"],
        correctIndex: 3,
        explanation: "As of 2024, Python 3.12 is the latest stable version.",
        topic: "General",
      },
      {
        question: "Which of the following is NOT a characteristic of Python?",
        options: ["Interpreted language", "Object-oriented", "Statically typed", "Easy to learn"],
        correctIndex: 2,
        explanation: "Python is dynamically typed, not statically typed.",
        topic: "General",
      },
      {
        question: "What is the file extension for Python files?",
        options: [".py", ".pt", ".pyt", ".python"],
        correctIndex: 0,
        explanation: "Python files use the .py extension.",
        topic: "General",
      },
    ],
  };
  
  // Kategori için sorular yoksa, genel Python sorularını kullan
  const questions = categoryQuestions[category] || categoryQuestions['Python'];
  
  return {
    title,
    timeLimitSec: 10 * 60, // 10 minutes
    questions,
  };
}