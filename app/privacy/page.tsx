import { ArrowLeft, Shield } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link href="/help" className="inline-flex items-center text-sm text-gray-600 hover:text-red-600 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Help Center
          </Link>
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-red-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
              <p className="text-gray-600 mt-1">Last updated: December 2024</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="prose prose-gray max-w-none">
          <Card className="mb-8 bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <p className="text-blue-800">
                At PyLearn, we are committed to protecting your privacy and ensuring the security of your personal
                information. This policy explains how we collect, use, and safeguard your data.
              </p>
            </CardContent>
          </Card>

          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Information We Collect</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Account Information</h4>
                  <p className="text-gray-600">
                    When you create an account, we collect your email address, username, and any profile information you
                    choose to provide.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Learning Data</h4>
                  <p className="text-gray-600">
                    We track your progress through lessons, quiz scores, activity completions, and learning analytics to
                    personalize your experience.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Usage Information</h4>
                  <p className="text-gray-600">
                    We collect information about how you interact with our platform, including pages visited, features
                    used, and time spent learning.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">How We Use Your Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-600">Provide and improve our educational services</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-600">
                      Track your learning progress and provide personalized recommendations
                    </span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-600">
                      Send you important updates about your account and our services
                    </span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-600">Analyze usage patterns to improve our platform</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Data Security</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  We implement industry-standard security measures to protect your personal information, including:
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center space-x-3">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span className="text-gray-600">Encrypted data transmission and storage</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span className="text-gray-600">Regular security audits and updates</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span className="text-gray-600">Limited access to personal data by authorized personnel only</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Your Rights</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">You have the right to:</p>
                <ul className="space-y-3">
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-600">Access and review your personal information</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-600">Request corrections to inaccurate data</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-600">Delete your account and associated data</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-600">Opt out of non-essential communications</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Contact Us</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  If you have any questions about this Privacy Policy or how we handle your data, please contact us:
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <strong>Email:</strong> privacy@pylearn.com
                    <br />
                    <strong>Address:</strong> PyLearn Privacy Team, 123 Learning Street, Education City, EC 12345
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
