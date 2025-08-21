import { ArrowLeft, CheckCircle, Play, Trophy } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function GettingStarted() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link href="/help" className="inline-flex items-center text-sm text-gray-600 hover:text-red-600 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Help Center
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Getting Started with PyLearn</h1>
          <p className="text-gray-600 mt-2">Your complete guide to mastering Python through fun and games</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <Card className="mb-8 bg-gradient-to-r from-red-50 to-yellow-50 border-red-200">
          <CardHeader>
            <CardTitle className="text-xl text-red-800">Welcome to PyLearn! 🎉</CardTitle>
            <CardDescription className="text-red-700">
              You're about to embark on an exciting journey to master Python programming through interactive lessons,
              games, and challenges.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Step-by-step Guide */}
        <div className="space-y-8">
          <h2 className="text-2xl font-bold text-gray-900">Your Learning Journey</h2>

          <div className="space-y-6">
            {/* Step 1 */}
            <Card className="border-l-4 border-l-red-500">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center font-bold">
                    1
                  </div>
                  <CardTitle className="text-lg">Start with Learn Section</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Begin your Python journey with our structured lessons. Each lesson includes explanations, examples,
                  and practice exercises.
                </p>
                <Link href="/learn">
                  <Button className="bg-red-600 hover:bg-red-700">
                    <Play className="w-4 h-4 mr-2" />
                    Start Learning
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Step 2 */}
            <Card className="border-l-4 border-l-yellow-500">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center font-bold">
                    2
                  </div>
                  <CardTitle className="text-lg">Practice with Activities</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Reinforce your learning with interactive coding labs, algorithm visualizations, and hands-on
                  exercises.
                </p>
                <Link href="/activities">
                  <Button
                    variant="outline"
                    className="border-yellow-500 text-yellow-600 hover:bg-yellow-50 bg-transparent"
                  >
                    Explore Activities
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Step 3 */}
            <Card className="border-l-4 border-l-green-500">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">
                    3
                  </div>
                  <CardTitle className="text-lg">Test Your Knowledge</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Take quizzes and participate in challenges to test your understanding and earn rewards.
                </p>
                <div className="flex space-x-3">
                  <Link href="/quiz">
                    <Button
                      variant="outline"
                      className="border-green-500 text-green-600 hover:bg-green-50 bg-transparent"
                    >
                      Take Quiz
                    </Button>
                  </Link>
                  <Link href="/challenges">
                    <Button
                      variant="outline"
                      className="border-green-500 text-green-600 hover:bg-green-50 bg-transparent"
                    >
                      Join Challenges
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Step 4 */}
            <Card className="border-l-4 border-l-purple-500">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">
                    4
                  </div>
                  <CardTitle className="text-lg">Have Fun with Rewards</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Spend your earned diamonds in our Card Shop to collect anime and game cards!
                </p>
                <Link href="/shop">
                  <Button
                    variant="outline"
                    className="border-purple-500 text-purple-600 hover:bg-purple-50 bg-transparent"
                  >
                    <Trophy className="w-4 h-4 mr-2" />
                    Visit Shop
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tips Section */}
        <Card className="mt-12">
          <CardHeader>
            <CardTitle className="text-xl">Pro Tips for Success</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-600">
                  Practice consistently - even 15 minutes daily makes a big difference
                </span>
              </li>
              <li className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-600">Don't rush - take time to understand each concept thoroughly</span>
              </li>
              <li className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-600">Use the coding labs to experiment and try your own variations</span>
              </li>
              <li className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-600">Join challenges to compete with other learners and stay motivated</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
