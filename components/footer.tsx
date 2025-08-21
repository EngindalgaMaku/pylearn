import Link from "next/link"
import { Code, BookOpen, Users } from "lucide-react"

export function Footer() {
  return (
    <footer className="hidden md:block bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                <Code className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">PyLearn</span>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              Master Python programming through interactive lessons, games, and challenges. Learn by doing with our
              comprehensive learning platform.
            </p>
          </div>

          {/* Learning Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Learning</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/activities" className="text-gray-600 hover:text-red-600 transition-colors text-sm">
                  Interactive Activities
                </Link>
              </li>
              <li>
                <Link href="/quiz" className="text-gray-600 hover:text-red-600 transition-colors text-sm">
                  Python Quizzes
                </Link>
              </li>
              <li>
                <Link href="/games" className="text-gray-600 hover:text-red-600 transition-colors text-sm">
                  Coding Games
                </Link>
              </li>
              <li>
                <Link href="/learn" className="text-gray-600 hover:text-red-600 transition-colors text-sm">
                  Python Lessons
                </Link>
              </li>
            </ul>
          </div>

          {/* Community Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Community</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/leaderboard" className="text-gray-600 hover:text-red-600 transition-colors text-sm">
                  Leaderboard
                </Link>
              </li>
              <li>
                <Link href="/challenges" className="text-gray-600 hover:text-red-600 transition-colors text-sm">
                  Daily Challenges
                </Link>
              </li>
              <li>
                <Link href="/profile" className="text-gray-600 hover:text-red-600 transition-colors text-sm">
                  Your Progress
                </Link>
              </li>
              <li>
                <Link href="/analytics" className="text-gray-600 hover:text-red-600 transition-colors text-sm">
                  Learning Analytics
                </Link>
              </li>
            </ul>
          </div>

          {/* Support Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Support</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/help" className="text-gray-600 hover:text-red-600 transition-colors text-sm">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/getting-started" className="text-gray-600 hover:text-red-600 transition-colors text-sm">
                  Getting Started
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-600 hover:text-red-600 transition-colors text-sm">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-600 hover:text-red-600 transition-colors text-sm">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-500 text-sm">© 2025 PyLearn. Made with ❤️ for Python learners everywhere.</p>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <BookOpen className="w-4 h-4" />
                <span>Learn</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Users className="w-4 h-4" />
                <span>Practice</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Code className="w-4 h-4" />
                <span>Master</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
