"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, Code, Trophy, Flame } from "lucide-react"
import PythonTipWidget from "@/components/python-tip-widget"

// Sample data - in real app this would come from API
const sampleTips = [
  {
    id: "1",
    title: "List Comprehensions for Cleaner Code",
    content:
      "List comprehensions provide a concise way to create lists. They are more readable and often faster than traditional for loops.",
    codeExample: `# Traditional approach
squares = []
for x in range(10):
    squares.append(x**2)

# List comprehension
squares = [x**2 for x in range(10)]

# With condition
even_squares = [x**2 for x in range(10) if x % 2 == 0]`,
    category: "Basics",
    difficulty: "Beginner" as const,
    xpReward: 15,
  },
  {
    id: "2",
    title: "Dictionary Comprehensions",
    content:
      "Similar to list comprehensions, dictionary comprehensions allow you to create dictionaries in a single line.",
    codeExample: `# Create a dictionary of squares
squares_dict = {x: x**2 for x in range(5)}
# Output: {0: 0, 1: 1, 2: 4, 3: 9, 4: 16}

# Filter with condition
even_squares = {x: x**2 for x in range(10) if x % 2 == 0}`,
    category: "Data Structures",
    difficulty: "Intermediate" as const,
    xpReward: 20,
  },
  {
    id: "3",
    title: "F-Strings for String Formatting",
    content:
      "F-strings (formatted string literals) provide a readable and efficient way to format strings in Python 3.6+.",
    codeExample: `name = "Alice"
age = 30
score = 95.67

# F-string formatting
message = f"Hello {name}, you are {age} years old"
formatted = f"Score: {score:.1f}%"

# With expressions
result = f"Next year you'll be {age + 1}"`,
    category: "Basics",
    difficulty: "Beginner" as const,
    xpReward: 15,
  },
]

export default function PythonTipsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [selectedDifficulty, setSelectedDifficulty] = useState("All")

  const categories = ["All", "Basics", "Functions", "Data Structures", "Advanced", "Tips & Tricks"]
  const difficulties = ["All", "Beginner", "Intermediate", "Advanced"]

  const filteredTips = sampleTips.filter((tip) => {
    const matchesSearch =
      tip.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tip.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "All" || tip.category === selectedCategory
    const matchesDifficulty = selectedDifficulty === "All" || tip.difficulty === selectedDifficulty

    return matchesSearch && matchesCategory && matchesDifficulty
  })

  const handleTipInteraction = async (tipId: string, type: string) => {
    console.log(`[v0] Tip interaction: ${type} on tip ${tipId}`)
    // In real app, this would call the API
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto lg:max-w-6xl xl:max-w-7xl space-y-6 md:space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 md:text-4xl lg:text-5xl">Python Tips & Tricks</h1>
          <p className="text-gray-600 md:text-lg">Daily doses of Python knowledge to level up your coding skills</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <Card className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90 md:text-base">Current Streak</p>
                  <p className="text-2xl font-bold md:text-3xl lg:text-4xl">7 days</p>
                </div>
                <Flame className="h-8 w-8 opacity-80 md:h-10 md:w-10 lg:h-12 lg:w-12" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90 md:text-base">Tips Completed</p>
                  <p className="text-2xl font-bold md:text-3xl lg:text-4xl">23</p>
                </div>
                <Trophy className="h-8 w-8 opacity-80 md:h-10 md:w-10 lg:h-12 lg:w-12" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90 md:text-base">XP Earned</p>
                  <p className="text-2xl font-bold md:text-3xl lg:text-4xl">1,250</p>
                </div>
                <Code className="h-8 w-8 opacity-80 md:h-10 md:w-10 lg:h-12 lg:w-12" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 md:h-5 md:w-5" />
                  <Input
                    placeholder="Search tips..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 md:pl-12 md:text-base md:h-12"
                  />
                </div>
              </div>

              <div className="flex gap-2 md:gap-3">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm md:text-base md:px-4 md:py-3"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm md:text-base md:px-4 md:py-3"
                >
                  {difficulties.map((difficulty) => (
                    <option key={difficulty} value={difficulty}>
                      {difficulty}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tips List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredTips.map((tip) => (
            <PythonTipWidget key={tip.id} tip={tip} onInteraction={handleTipInteraction} />
          ))}
        </div>

        {filteredTips.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center md:p-12">
              <Code className="h-12 w-12 text-gray-400 mx-auto mb-4 md:h-16 md:w-16" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2 md:text-xl">No tips found</h3>
              <p className="text-gray-600 md:text-lg">Try adjusting your search or filter criteria.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
