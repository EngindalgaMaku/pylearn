import type { Metadata } from "next"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { getQuizConfig } from "@/components/activities/quiz/question-banks"
import { ArrowLeft, Diamond, Zap, Clock, HelpCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import QuizRunner from "@/components/activities/quiz/QuizRunner"

export async function generateMetadata(): Promise<Metadata> {
  const hs = await headers()
  const proto = hs.get("x-forwarded-proto") || "http"
  const host = hs.get("x-forwarded-host") || hs.get("host") || "localhost:3000"
  const origin = `${proto}://${host}`
  const canonical = `${origin}/activities/python-basics-syntax-quiz`

  const quizConfig = getQuizConfig("python-basics-syntax-quiz")
  if (!quizConfig) return {}

  const title = "Python Basics Syntax Quiz | Interactive Python Quiz"
  const description = "Test your Python syntax knowledge with this interactive quiz. Learn about comments, data types, functions, and more through multiple-choice questions."

  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      type: "website",
      url: canonical,
      siteName: "PyLearn",
      locale: "en_US",
      images: [
        {
          url: "/icon.png",
          width: 512,
          height: 512,
          alt: "PyLearn – Learn Python by Playing",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/icon.png"],
    },
    keywords: [
      "Python quiz",
      "Python syntax",
      "Python basics",
      "programming quiz",
      "Python learning",
      "Python tutorial",
      "Python test",
      "coding quiz",
      "Python practice",
      "Python exercises",
    ],
  }
}

export default async function PythonBasicsSyntaxQuizPage() {
  // Build absolute origin for structured data
  const hs = await headers()
  const proto = hs.get("x-forwarded-proto") || "http"
  const host = hs.get("x-forwarded-host") || hs.get("host") || "localhost:3000"
  const origin = `${proto}://${host}`
  
  const quizConfig = getQuizConfig("python-basics-syntax-quiz")
  
  return (
    <>
      {/* JSON-LD: Quiz structured data */}
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Quiz",
            name: "Python Basics Syntax Quiz",
            description: "Test your Python syntax knowledge with this interactive quiz. Learn about comments, data types, functions, and more.",
            educationalLevel: "Beginner",
            learningResourceType: "Quiz",
            about: {
              "@type": "Thing",
              name: "Python Programming",
            },
            audience: {
              "@type": "Audience",
              audienceType: "Beginner Python Programmers",
            },
            timeRequired: "PT10M", // ISO 8601 duration format
            numberOfQuestions: quizConfig?.questions.length || 5,
          }),
        }}
      />

      {/* JSON-LD: BreadcrumbList */}
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: `${origin}/` },
              { "@type": "ListItem", position: 2, name: "Activities", item: `${origin}/activities` },
              { "@type": "ListItem", position: 3, name: "Python Basics Syntax Quiz", item: `${origin}/activities/python-basics-syntax-quiz` },
            ],
          }),
        }}
      />
      
      {/* Quiz içeriğini doğrudan gösterelim */}
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-background">
        <div className="max-w-3xl mx-auto px-4 py-6 md:px-6 md:py-10">
          <div className="mb-6">
            <Button asChild variant="outline">
              <Link href="/activities">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Activities
              </Link>
            </Button>
          </div>
          
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <Badge className="bg-slate-100 text-slate-800 font-medium flex items-center gap-1">
                  <HelpCircle className="w-4 h-4" />
                  <span>Quiz</span>
                </Badge>
                <Badge className="bg-green-500 text-white font-medium">Beginner</Badge>
                <Badge variant="outline" className="font-medium">Python Fundamentals</Badge>
              </div>
              <CardTitle className="font-serif font-bold text-2xl text-foreground">
                Python Basics Syntax Quiz
              </CardTitle>
              <CardDescription className="text-muted-foreground mt-2">
                Test your Python syntax knowledge with this interactive quiz. Learn about comments, data types, functions, and more.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                <div className="flex items-center justify-between sm:justify-start sm:gap-2 bg-muted/30 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Diamond className="w-5 h-5 text-blue-600" />
                    <div className="text-sm font-medium">25</div>
                  </div>
                  <div className="text-xs text-muted-foreground sm:hidden">Elmas</div>
                  <div className="hidden sm:block text-sm">
                    <div className="text-muted-foreground">Diamonds</div>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-start sm:gap-2 bg-muted/30 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" />
                    <div className="text-sm font-medium">50 XP</div>
                  </div>
                  <div className="text-xs text-muted-foreground sm:hidden">Deneyim</div>
                  <div className="hidden sm:block text-sm">
                    <div className="text-muted-foreground">Experience</div>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-start sm:gap-2 bg-muted/30 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    <div className="text-sm font-medium">10 dk</div>
                  </div>
                  <div className="text-xs text-muted-foreground sm:hidden">Süre</div>
                  <div className="hidden sm:block text-sm">
                    <div className="text-muted-foreground">Estimated Time</div>
                  </div>
                </div>
              </div>
              
              <QuizRunner slug="python-basics-syntax-quiz" title="Python Basics Syntax Quiz" />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}