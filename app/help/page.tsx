import { ArrowLeft, BookOpen, MessageCircle, Users } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function HelpCenter() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link href="/" className="inline-flex items-center text-sm text-gray-600 hover:text-red-600 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to PyLearn
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Help Center</h1>
          <p className="text-gray-600 mt-2">Find answers to common questions and get help with PyLearn</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Quick Help Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <BookOpen className="w-8 h-8 text-red-600 mb-2" />
              <CardTitle className="text-lg">Getting Started</CardTitle>
              <CardDescription>Learn the basics of using PyLearn</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/getting-started">
                <Button variant="outline" className="w-full bg-transparent">
                  View Guide
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Users className="w-8 h-8 text-yellow-600 mb-2" />
              <CardTitle className="text-lg">Community</CardTitle>
              <CardDescription>Connect with other Python learners</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/leaderboard">
                <Button variant="outline" className="w-full bg-transparent">
                  Join Community
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <MessageCircle className="w-8 h-8 text-green-600 mb-2" />
              <CardTitle className="text-lg">Contact Support</CardTitle>
              <CardDescription>Get personalized help from our team</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/contact">
                <Button variant="outline" className="w-full bg-transparent">
                  Contact Us
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="space-y-8">
          <h2 className="text-2xl font-bold text-gray-900">Frequently Asked Questions</h2>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How do I earn diamonds and XP?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  You earn diamonds and XP by completing lessons, quizzes, challenges, and activities. Each completed
                  task rewards you with points based on difficulty and performance.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What can I do with diamonds?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Diamonds can be spent in our Card Shop to purchase anime and game cards. It's a fun way to use your
                  learning rewards!
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How do I track my progress?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Visit your Profile page to see detailed analytics, learning streaks, completed activities, and overall
                  progress through the Python curriculum.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Are the lessons suitable for beginners?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Yes! Our lessons are designed for all skill levels, starting from complete beginners. The curriculum
                  progresses gradually from basic concepts to advanced topics.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
