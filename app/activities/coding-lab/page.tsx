"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Play, CheckCircle, Diamond, Zap, RotateCcw } from "lucide-react"
import Link from "next/link"

const codingChallenges = [
  {
    id: 1,
    title: "Variable Assignment",
    description: "Create variables and assign different data types",
    instruction:
      'Create a variable called "name" with your name, "age" with your age, and "is_student" as True or False.',
    starterCode: "# Create your variables here\n\n",
    expectedOutput: "Variables created successfully!",
    solution: 'name = "Alice"\nage = 25\nis_student = True',
    hints: ["Use quotes for strings", "Numbers don't need quotes", "Boolean values are True/False"],
  },
  {
    id: 2,
    title: "List Operations",
    description: "Practice creating and manipulating lists",
    instruction: 'Create a list called "fruits" with 3 fruits, then add one more fruit and print the length.',
    starterCode: "# Create and manipulate your list here\nfruits = []\n\n",
    expectedOutput: "List length: 4",
    solution: 'fruits = ["apple", "banana", "orange"]\nfruits.append("grape")\nprint(f"List length: {len(fruits)}")',
    hints: ["Use square brackets for lists", "Use append() to add items", "Use len() to get length"],
  },
  {
    id: 3,
    title: "Function Creation",
    description: "Write a simple function with parameters",
    instruction: 'Create a function called "greet" that takes a name parameter and returns "Hello, [name]!"',
    starterCode: '# Define your function here\n\n# Test your function\nprint(greet("World"))',
    expectedOutput: "Hello, World!",
    solution: 'def greet(name):\n    return f"Hello, {name}!"',
    hints: ["Use def keyword", "Don't forget the colon", "Use return to send back a value"],
  },
]

export default function CodingLabPage() {
  const [currentChallenge, setCurrentChallenge] = useState(0)
  const [userCode, setUserCode] = useState(codingChallenges[0].starterCode)
  const [output, setOutput] = useState("")
  const [isCorrect, setIsCorrect] = useState(false)
  const [showHints, setShowHints] = useState(false)
  const [completedChallenges, setCompletedChallenges] = useState<number[]>([])

  const challenge = codingChallenges[currentChallenge]

  const runCode = () => {
    // Simple code execution simulation
    try {
      // Basic validation for the challenges
      if (currentChallenge === 0) {
        if (userCode.includes("name =") && userCode.includes("age =") && userCode.includes("is_student =")) {
          setOutput("Variables created successfully!")
          setIsCorrect(true)
          if (!completedChallenges.includes(currentChallenge)) {
            setCompletedChallenges([...completedChallenges, currentChallenge])
          }
        } else {
          setOutput("Error: Make sure to create all three variables (name, age, is_student)")
          setIsCorrect(false)
        }
      } else if (currentChallenge === 1) {
        if (userCode.includes("fruits =") && userCode.includes("append") && userCode.includes("len")) {
          setOutput("List length: 4")
          setIsCorrect(true)
          if (!completedChallenges.includes(currentChallenge)) {
            setCompletedChallenges([...completedChallenges, currentChallenge])
          }
        } else {
          setOutput("Error: Make sure to create a list, add an item, and print the length")
          setIsCorrect(false)
        }
      } else if (currentChallenge === 2) {
        if (userCode.includes("def greet") && userCode.includes("return")) {
          setOutput("Hello, World!")
          setIsCorrect(true)
          if (!completedChallenges.includes(currentChallenge)) {
            setCompletedChallenges([...completedChallenges, currentChallenge])
          }
        } else {
          setOutput("Error: Make sure to define a function that returns a greeting")
          setIsCorrect(false)
        }
      }
    } catch (error) {
      setOutput("Error: There was a problem with your code")
      setIsCorrect(false)
    }
  }

  const nextChallenge = () => {
    if (currentChallenge < codingChallenges.length - 1) {
      const next = currentChallenge + 1
      setCurrentChallenge(next)
      setUserCode(codingChallenges[next].starterCode)
      setOutput("")
      setIsCorrect(false)
      setShowHints(false)
    }
  }

  const resetCode = () => {
    setUserCode(challenge.starterCode)
    setOutput("")
    setIsCorrect(false)
  }

  const showSolution = () => {
    setUserCode(challenge.solution)
    setOutput(challenge.expectedOutput)
    setIsCorrect(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/activities">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Activities
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Coding Lab</h1>
            <p className="text-gray-600">Practice Python coding with interactive challenges</p>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium">Progress:</span>
            <span className="text-sm text-gray-600">
              {completedChallenges.length}/{codingChallenges.length} challenges completed
            </span>
          </div>
          <div className="flex gap-2">
            {codingChallenges.map((_, index) => (
              <div
                key={index}
                className={`h-2 flex-1 rounded ${
                  completedChallenges.includes(index)
                    ? "bg-green-500"
                    : index === currentChallenge
                      ? "bg-blue-500"
                      : "bg-gray-200"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Challenge Description */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Challenge {currentChallenge + 1}: {challenge.title}
                    {completedChallenges.includes(currentChallenge) && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                  </CardTitle>
                  <CardDescription>{challenge.description}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-800">
                    <Diamond className="w-3 h-3 mr-1" />
                    35
                  </Badge>
                  <Badge className="bg-yellow-100 text-yellow-800">
                    <Zap className="w-3 h-3 mr-1" />
                    70 XP
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Instructions:</h3>
                <p className="text-gray-700">{challenge.instruction}</p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Expected Output:</h3>
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">{challenge.expectedOutput}</code>
              </div>

              {/* Hints */}
              <div>
                <Button variant="outline" size="sm" onClick={() => setShowHints(!showHints)} className="mb-2">
                  {showHints ? "Hide Hints" : "Show Hints"}
                </Button>
                {showHints && (
                  <div className="bg-blue-50 p-3 rounded">
                    <h4 className="font-medium mb-2">Hints:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {challenge.hints.map((hint, index) => (
                        <li key={index} className="text-blue-700">
                          {hint}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentChallenge(Math.max(0, currentChallenge - 1))}
                  disabled={currentChallenge === 0}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={nextChallenge}
                  disabled={currentChallenge === codingChallenges.length - 1}
                >
                  Next
                </Button>
                <Button variant="outline" size="sm" onClick={showSolution} className="ml-auto bg-transparent">
                  Show Solution
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Code Editor */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Code Editor</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={resetCode}>
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Reset
                  </Button>
                  <Button onClick={runCode}>
                    <Play className="w-4 h-4 mr-1" />
                    Run Code
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={userCode}
                onChange={(e) => setUserCode(e.target.value)}
                className="font-mono text-sm min-h-[200px] resize-none"
                placeholder="Write your Python code here..."
              />

              {/* Output */}
              {output && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Output:</h3>
                  <div
                    className={`p-3 rounded font-mono text-sm ${
                      isCorrect
                        ? "bg-green-50 border border-green-200 text-green-800"
                        : "bg-red-50 border border-red-200 text-red-800"
                    }`}
                  >
                    {output}
                  </div>
                </div>
              )}

              {/* Success Message */}
              {isCorrect && (
                <div className="bg-green-50 border border-green-200 p-3 rounded">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-semibold">Great job!</span>
                  </div>
                  <p className="text-green-700 text-sm mt-1">
                    You've successfully completed this challenge. You earned 35 diamonds and 70 XP!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Completion Summary */}
        {completedChallenges.length === codingChallenges.length && (
          <Card className="mt-6 bg-gradient-to-r from-green-50 to-blue-50">
            <CardContent className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Congratulations! 🎉</h2>
              <p className="text-gray-600 mb-4">You've completed all coding challenges in this lab!</p>
              <div className="flex items-center justify-center gap-4 mb-4">
                <Badge className="bg-green-100 text-green-800 px-3 py-1">
                  <Diamond className="w-4 h-4 mr-1" />
                  105 Diamonds Earned
                </Badge>
                <Badge className="bg-yellow-100 text-yellow-800 px-3 py-1">
                  <Zap className="w-4 h-4 mr-1" />
                  210 XP Earned
                </Badge>
              </div>
              <Link href="/activities">
                <Button>Continue Learning</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
