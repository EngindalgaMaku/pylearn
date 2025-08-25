import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MobilePageHeader } from "@/components/mobile-page-header";

type Game = {
  id: string;
  title: string;
  description: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  icon: string;
  timeEstimate: string;
  xpReward: number;
  diamondReward: number;
  keywords?: string[];
};

const GAMES: Game[] = [
  {
    id: "code-match",
    title: "Code Match",
    description:
      "Match Python code with its output. Faster than a print statement!",
    difficulty: "Beginner",
    icon: "🧩",
    timeEstimate: "3 min",
    xpReward: 20,
    diamondReward: 4,
    keywords: ["python", "match code", "output", "beginners"],
  },
  {
    id: "syntax-puzzle",
    title: "Syntax Puzzle",
    description:
      "Arrange code blocks in the right order. Indentation party! 🎉",
    difficulty: "Beginner",
    icon: "🔧",
    timeEstimate: "5 min",
    xpReward: 20,
    diamondReward: 3,
    keywords: ["python syntax", "puzzle", "blocks", "order"],
  },
  {
    id: "variable-naming",
    title: "Variable Detective",
    description: "Find valid Python variable names. No spaces, no drama.",
    difficulty: "Beginner",
    icon: "🕵️",
    timeEstimate: "4 min",
    xpReward: 10,
    diamondReward: 2,
    keywords: ["variables", "naming rules", "identifiers"],
  },
  {
    id: "data-types",
    title: "Data Types",
    description: "Identify the correct Python data type for each value.",
    difficulty: "Beginner",
    icon: "📦",
    timeEstimate: "3 min",
    xpReward: 10,
    diamondReward: 2,
    keywords: ["types", "int", "str", "list", "dict"],
  },
  {
    id: "loop-runner",
    title: "Loop Runner",
    description: "Predict outputs and iterations of simple Python loops.",
    difficulty: "Beginner",
    icon: "🔁",
    timeEstimate: "4 min",
    xpReward: 10,
    diamondReward: 2,
    keywords: ["for", "while", "range", "loops"],
  },
  {
    id: "function-calls",
    title: "Function Calls",
    description: "Given a function and a call, choose the correct output.",
    difficulty: "Beginner",
    icon: "📞",
    timeEstimate: "4 min",
    xpReward: 10,
    diamondReward: 2,
    keywords: ["functions", "arguments", "return", "defaults"],
  },
  {
    id: "memory-match",
    title: "Memory Match",
    description: "Flip cards and match Python concepts to reinforce recall.",
    difficulty: "Beginner",
    icon: "🧠",
    timeEstimate: "4 min",
    xpReward: 10,
    diamondReward: 2,
    keywords: ["memory", "matching", "terms", "definitions"],
  },
];

export async function generateMetadata(): Promise<Metadata> {
  const hs = await headers();
  const proto = hs.get("x-forwarded-proto") || "http";
  const host = hs.get("x-forwarded-host") || hs.get("host") || "localhost:3000";
  const origin = `${proto}://${host}`;
  const canonical = `${origin}/games`;

  const title =
    "Python Learning Games | Fun Mini-Games to Learn Python | PyLearn";
  const description =
    "Play fun, fast Python mini‑games: Code Match, Syntax Puzzle and more. Learn Python the playful way and earn XP along the way.";

  const keywords = [
    "python games",
    "learn python by playing",
    "python mini games",
    "code games",
    "syntax puzzle",
    "code match",
    "variable naming game",
  ];

  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: true, follow: true },
    keywords,
    openGraph: {
      title,
      description,
      type: "website",
      url: canonical,
      siteName: "PyLearn",
      images: ["/icon.png"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/icon.png"],
    },
  };
}

export default async function GamesPage() {
  // Build absolute origin for structured data
  const hs = await headers();
  const proto = hs.get("x-forwarded-proto") || "http";
  const host = hs.get("x-forwarded-host") || hs.get("host") || "localhost:3000";
  const origin = `${proto}://${host}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: GAMES.map((g, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${origin}/games/${g.id}`,
      name: g.title,
      description: g.description,
      keywords: g.keywords || [],
    })),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background">
      {/* Mobile Header (consistent app header) */}
      <div className="md:hidden">
        <MobilePageHeader
          title="Python Learning Games"
          subtitle="Play quick mini‑games and level up your Python"
          backHref="/"
        />
      </div>

      <div className="max-w-4xl mx-auto lg:max-w-6xl xl:max-w-7xl px-4 py-6 md:px-6 md:py-10 lg:px-8">
        {/* SEO: JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        {/* Desktop Hero */}
        <div className="hidden md:block mb-8 md:mb-12">
          <div className="text-center space-y-4">
            <div className="text-5xl lg:text-6xl select-none">🐍🎮✨</div>
            <h1 className="font-serif font-black text-4xl md:text-5xl lg:text-6xl text-foreground">
              Play Python Learning Games
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Quick, fun mini‑games that sharpen your Python skills. Learn by
              playing — earn XP, unlock wins, and have a laugh or two.
            </p>
          </div>
        </div>

        {/* About / Fun blurb */}
        <Card className="mb-8 bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border-primary/20">
          <CardHeader>
            <CardTitle className="font-serif">Why games?</CardTitle>
            <CardDescription>
              Because typing print statements a thousand times is so 2010. These
              mini‑games train your brain on the essentials — fast feedback,
              tiny wins, zero boredom.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-card/60 border border-border rounded-lg p-3">
              <div className="text-2xl mb-1">⚡</div>
              <div className="font-semibold">Short & Sweet</div>
              <div className="text-muted-foreground">
                Play in minutes. Learn for a lifetime.
              </div>
            </div>
            <div className="bg-card/60 border border-border rounded-lg p-3">
              <div className="text-2xl mb-1">🧠</div>
              <div className="font-semibold">Real Muscle Memory</div>
              <div className="text-muted-foreground">
                Practice syntax, reading, and problem sense.
              </div>
            </div>
            <div className="bg-card/60 border border-border rounded-lg p-3">
              <div className="text-2xl mb-1">🎯</div>
              <div className="font-semibold">XP Rewards</div>
              <div className="text-muted-foreground">
                Beat levels, earn XP, flex on leaderboards.
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Games Grid */}
        <div className="mb-8">
          <h2 className="text-xl md:text-2xl font-serif font-bold text-foreground mb-4 md:mb-6">
            Choose a Game
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {GAMES.map((game, index) => {
              // Assign different gradient backgrounds to each game
              const gradients = [
                "relative overflow-hidden bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 border-violet-200/30 hover:from-violet-500/20 hover:via-purple-500/20 hover:to-fuchsia-500/20", // Code Match
                "relative overflow-hidden bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border-emerald-200/30 hover:from-emerald-500/20 hover:via-teal-500/20 hover:to-cyan-500/20", // Syntax Puzzle
                "relative overflow-hidden bg-gradient-to-br from-amber-500/10 via-yellow-500/10 to-orange-500/10 border-amber-200/30 hover:from-amber-500/20 hover:via-yellow-500/20 hover:to-orange-500/20", // Variable Detective
                "relative overflow-hidden bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10 border-blue-200/30 hover:from-blue-500/20 hover:via-indigo-500/20 hover:to-purple-500/20", // Data Types
                "relative overflow-hidden bg-gradient-to-br from-rose-500/10 via-pink-500/10 to-red-500/10 border-rose-200/30 hover:from-rose-500/20 hover:via-pink-500/20 hover:to-red-500/20", // Loop Runner
                "relative overflow-hidden bg-gradient-to-br from-green-500/10 via-emerald-500/10 to-teal-500/10 border-green-200/30 hover:from-green-500/20 hover:via-emerald-500/20 hover:to-teal-500/20", // Function Calls
                "relative overflow-hidden bg-gradient-to-br from-indigo-500/10 via-blue-500/10 to-cyan-500/10 border-indigo-200/30 hover:from-indigo-500/20 hover:via-blue-500/20 hover:to-cyan-500/20", // Memory Match
              ];

              const overlayGradients = [
                "from-violet-600/15 via-purple-600/10 to-fuchsia-600/15",
                "from-emerald-600/15 via-teal-600/10 to-cyan-600/15",
                "from-amber-600/15 via-yellow-600/10 to-orange-600/15",
                "from-blue-600/15 via-indigo-600/10 to-purple-600/15",
                "from-rose-600/15 via-pink-600/10 to-red-600/15",
                "from-green-600/15 via-emerald-600/10 to-teal-600/15",
                "from-indigo-600/15 via-blue-600/10 to-cyan-600/15",
              ];

              return (
                <Card
                  key={game.id}
                  className={`${gradients[index]} hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group`}
                >
                  <div
                    className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${overlayGradients[index]} opacity-40 group-hover:opacity-60 transition-opacity duration-300`}
                  />
                  <CardHeader className="pb-3 relative">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/90 border-2 border-white/50 rounded-lg flex items-center justify-center shadow-sm backdrop-blur-sm">
                          <span className="text-2xl">{game.icon}</span>
                        </div>
                        <div>
                          <CardTitle className="font-serif font-bold text-lg text-gray-900">
                            {game.title}
                          </CardTitle>
                          <CardDescription className="text-gray-600">
                            {game.description}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-white/80 text-gray-700 border-white/50"
                      >
                        {game.id === "code-match"
                          ? "Beginner • Advanced"
                          : game.difficulty}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="relative">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                      <span>{game.timeEstimate}</span>
                      <span>
                        Up to +{game.xpReward} XP, +{game.diamondReward} 💎
                      </span>
                    </div>
                    <Link href={`/games/${game.id}`}>
                      <Button className="w-full bg-white/90 text-gray-800 hover:bg-white border-0 shadow-sm">
                        Play
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Friendly FAQ */}
        <div className="mb-4 md:mb-8">
          <h2 className="text-xl md:text-2xl font-serif font-bold text-foreground mb-3 md:mb-4">
            Frequently Un‑asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  Are these games hard?
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Only if you try to name a variable with spaces. Start easy,
                level up fast.
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  Will I actually learn Python?
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Yes. Tiny focused challenges build real fluency — without the
                yawns.
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
