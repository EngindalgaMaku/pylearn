"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft, Filter, Search } from "lucide-react"
import { Input } from "@/components/ui/input"

// Using the same card data structure
const ownedCardIds = ["pikachu-1", "tanjiro-1", "pandas-1"] // Mock owned cards

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRarity, setFilterRarity] = useState<string>("all")

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-6 md:hidden">
        <div className="max-w-md mx-auto flex items-center gap-4">
          <Link href="/shop">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-primary">My Collection</h1>
            <p className="text-sm text-muted-foreground">View your owned cards</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto md:max-w-4xl lg:max-w-6xl px-4 py-8 space-y-6">
        {/* Search and Filter */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search your cards..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="w-4 h-4" />
          </Button>
        </div>

        {/* Collection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {/* Placeholder for owned cards - would be populated from actual data */}
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-muted-foreground">Your collection will appear here</p>
              <Link href="/shop">
                <Button className="mt-4">Buy Your First Card</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
