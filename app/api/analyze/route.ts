import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import fs from "fs"
import path from "path"

// Use local lightweight OCR adapter (prevents bringing in sharp from external project)
import { processCardImage } from "@/lib/ai/ocr"
import { estimateCardValue } from "@/lib/ai/value-estimation"
import { saveUsedCardName } from "@/lib/ai/card-generator"
import { generateRarityAwareCardProperties } from "@/lib/ai/power-calculation"
import { detectCardRarity } from "@/lib/ai/rarity-detection"
import { calculateDiamondPrice } from "@/lib/ai/pricing"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cardId, cardIds, bulkAnalysis, forceReAnalysis } = body || {}

    if (bulkAnalysis && cardIds && Array.isArray(cardIds)) {
      return await handleBulkAnalysis(cardIds as string[], !!forceReAnalysis)
    }

    if (!cardId) {
      return NextResponse.json({ error: "cardId is required" }, { status: 400 })
    }

    return await handleSingleAnalysis(cardId as string, !!forceReAnalysis)
  } catch (error) {
    console.error("Analyze API error:", error)
    return NextResponse.json(
      { error: "An error occurred during analysis" },
      { status: 500 }
    )
  }
}

async function handleSingleAnalysis(cardId: string, forceReAnalysis = false) {
  try {
    const card = await prisma.card.findUnique({ where: { id: cardId } as any })

    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 })
    }

    if ((card as any).isAnalyzed && !forceReAnalysis) {
      return NextResponse.json({ message: "Card already analyzed", card })
    }

    const result = await analyzeCard(card as any, forceReAnalysis)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Single analysis error:", error)
    return NextResponse.json(
      { error: "Error during single analysis" },
      { status: 500 }
    )
  }
}

async function handleBulkAnalysis(cardIds: string[], forceReAnalysis = false) {
  try {
    const results: any[] = []
    const errors: any[] = []

    for (const id of cardIds) {
      try {
        const card = await prisma.card.findUnique({ where: { id } as any })
        if (!card) {
          errors.push({ cardId: id, error: "Card not found" })
          continue
        }

        if ((card as any).isAnalyzed && !forceReAnalysis) {
          results.push({ cardId: id, message: "Already analyzed", card })
          continue
        }

        const result = await analyzeCard(card as any, forceReAnalysis)
        results.push({ cardId: id, success: true, result })

        await new Promise((r) => setTimeout(r, 100))
      } catch (error: any) {
        console.error(`Card ${id} analysis error:`, error)
        errors.push({ cardId: id, error: error?.message || "Analysis error" })
      }
    }

    return NextResponse.json({
      message: `Bulk analysis completed${forceReAnalysis ? " (re-analysis)" : ""}`,
      total: cardIds.length,
      successful: results.length,
      failed: errors.length,
      results,
      errors,
    })
  } catch (error) {
    console.error("Bulk analysis error:", error)
    return NextResponse.json(
      { error: "Error during bulk analysis" },
      { status: 500 }
    )
  }
}

async function analyzeCard(card: any, forceReAnalysis = false) {
  const imagePath = card.imagePath

  try {
    // OCR and AI analysis (pass category)
    const analysisResult = await processCardImage(imagePath as any, card.category)

    // Get file stats to help rarity detection
    let fileSize = 0
    try {
      let fullImagePath: string
      if (path.isAbsolute(imagePath)) {
        fullImagePath = imagePath
      } else {
        fullImagePath = imagePath?.startsWith("/uploads/")
          ? path.join(process.cwd(), "public", imagePath)
          : path.join(process.cwd(), "public", "uploads", imagePath)
      }
      const stats = fs.statSync(fullImagePath)
      fileSize = stats.size
    } catch (e) {
      console.warn("Could not get file stats:", e)
      console.warn("Failed imagePath:", imagePath)
      fileSize = 0
    }

    // Intelligent rarity detection
    const rarityAnalysis = await detectCardRarity({
      fileName: card.name || path.basename(imagePath || ""),
      fileSize,
      imagePath,
      ocrText: analysisResult.ocrText,
      detectedSeries: analysisResult.cardInfo.series || undefined,
      detectedCharacter: analysisResult.cardInfo.character || undefined,
    })

    const finalRarity =
      rarityAnalysis.confidence > 70
        ? rarityAnalysis.detectedRarity
        : analysisResult.cardInfo.rarity || card.rarity || rarityAnalysis.detectedRarity

    // Value estimation
    const valueEstimation = await estimateCardValue({
      rarity: finalRarity,
      condition: card.condition || undefined,
      series: analysisResult.cardInfo.series || card.series || undefined,
      character: analysisResult.cardInfo.character || card.character || undefined,
      ocrConfidence: analysisResult.confidence,
    })

    const estimatedValue = valueEstimation.estimatedValue

    // AI tags (initial)
    const aiTags = JSON.stringify({
      series: analysisResult.cardInfo.series,
      character: analysisResult.cardInfo.character,
      rarity: analysisResult.cardInfo.rarity,
      stats: analysisResult.cardInfo.stats,
      extractedAt: new Date().toISOString(),
    })

    // Smart name update from OCR
    let updatedName = card.name
    if (analysisResult.cardInfo.name && analysisResult.confidence > 70) {
      updatedName = analysisResult.cardInfo.name
    } else if (analysisResult.cardInfo.series && analysisResult.cardInfo.character) {
      updatedName = `${analysisResult.cardInfo.series} - ${analysisResult.cardInfo.character}`
    } else if (analysisResult.cardInfo.series) {
      updatedName = analysisResult.cardInfo.series
    }

    // Generate rarity-aware properties with category
    const cardProperties = await generateRarityAwareCardProperties(
      estimatedValue,
      finalRarity,
      card.id,
      card.fileName || path.basename(imagePath || ""),
      card.category
    )

    const finalStats = (analysisResult.cardInfo.stats || {}) as any
    const finalAttackPower = finalStats.attack || cardProperties.attackPower
    const finalDefense = finalStats.defense || cardProperties.defense
    const finalSpeed = finalStats.speed || cardProperties.speed

    const diamondPrice = await calculateDiamondPrice(
      finalRarity,
      estimatedValue,
      Math.max(analysisResult.confidence, rarityAnalysis.confidence),
      card.id
    )

    const enhancedAiTags = JSON.stringify({
      series: analysisResult.cardInfo.series,
      character: analysisResult.cardInfo.character,
      rarity: finalRarity,
      stats: analysisResult.cardInfo.stats,
      rarityAnalysis: {
        detectedRarity: rarityAnalysis.detectedRarity,
        confidence: rarityAnalysis.confidence,
        factors: rarityAnalysis.factors,
        reasoning: rarityAnalysis.reasoning,
      },
      extractedAt: new Date().toISOString(),
    })

    const updatedCard = await prisma.card.update({
      where: { id: card.id } as any,
      data: {
        name: updatedName,
        series: analysisResult.cardInfo.series || card.series,
        character: analysisResult.cardInfo.character || card.character,
        rarity: finalRarity,
        ocrText: analysisResult.ocrText,
        aiTags: enhancedAiTags,
        story: analysisResult.story,
        confidence: Math.max(analysisResult.confidence, rarityAnalysis.confidence),
        estimatedValue: estimatedValue,
        isAnalyzed: true,
        updatedAt: new Date(),
        // Enhanced properties
        cardTitle: cardProperties.cardTitle,
        attackPower: finalAttackPower,
        defense: finalDefense,
        speed: finalSpeed,
        specialAbility: cardProperties.specialAbility,
        element: cardProperties.element,
        rarityLevel: cardProperties.rarityLevel,
        rating: cardProperties.rating,
        diamondPrice: diamondPrice,
      },
    })

    // Optional: create analytics record if the schema exists in this app too
    try {
      await prisma.analytics.create({
        data: { cardId: card.id, estimatedValue: estimatedValue, views: 1 } as any,
      } as any)
    } catch (e) {
      // ignore if analytics model doesn't exist here
    }

    await saveUsedCardName(card.id, cardProperties.cardTitle)

    return {
      message: forceReAnalysis ? "Card re-analyzed successfully" : "Card analyzed successfully",
      card: updatedCard,
      analysis: {
        ocrText: analysisResult.ocrText,
        cardInfo: analysisResult.cardInfo,
        confidence: Math.max(analysisResult.confidence, rarityAnalysis.confidence),
        estimatedValue: estimatedValue,
        rarityAnalysis: {
          detectedRarity: rarityAnalysis.detectedRarity,
          confidence: rarityAnalysis.confidence,
          factors: rarityAnalysis.factors,
          reasoning: rarityAnalysis.reasoning,
        },
        diamondPrice: diamondPrice,
      },
    }
  } catch (analysisError) {
    console.error("Analysis error:", analysisError)

    try {
      await prisma.card.update({
        where: { id: card.id } as any,
        data: {
          confidence: 0,
          isAnalyzed: true,
          updatedAt: new Date(),
        },
      })
    } catch {}

    throw new Error("Error occurred during OCR or AI analysis")
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const cardId = searchParams.get("cardId")

    if (!cardId) {
      return NextResponse.json({ error: "cardId is required" }, { status: 400 })
    }

    const card = await prisma.card.findUnique({
      where: { id: cardId } as any,
      include: {
        analytics: { orderBy: { date: "desc" } as any, take: 10 } as any,
      } as any,
    } as any)

    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 })
    }

    let parsedAiTags: any = null
    if ((card as any).aiTags) {
      try {
        parsedAiTags = JSON.parse((card as any).aiTags)
      } catch (e) {
        console.warn("Failed to parse AI tags:", e)
      }
    }

    return NextResponse.json({ card: { ...(card as any), aiTags: parsedAiTags } })
  } catch (error) {
    console.error("Get analysis error:", error)
    return NextResponse.json(
      { error: "Failed to load analysis info" },
      { status: 500 }
    )
  }
}
