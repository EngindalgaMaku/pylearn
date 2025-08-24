import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

// Ensure this route runs on the Node.js runtime (Prisma is not Edge-compatible)
export const runtime = 'nodejs'
// Always compute fresh sitemap data
export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pylearn.net'

  // Statik sayfalar
  const staticPages = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/learn`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/activities`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/challenges`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/games`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/shop`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/leaderboard`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/tips`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/getting-started`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/help`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
  ]

  // Dynamic pages - Activities
  let activityPages: MetadataRoute.Sitemap = []
  try {
    const activities = await prisma.learningActivity.findMany({
      where: { 
        isActive: true,
        NOT: { slug: null }
      },
      select: {
        slug: true,
        updatedAt: true,
      },
    })

    activityPages = activities.map(activity => ({
      url: `${baseUrl}/activities/${activity.slug}`,
      lastModified: activity.updatedAt || new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }))
  } catch (error) {
    console.error('Could not fetch activity data for sitemap:', error)
  }

  // Special activity pages
  const specialActivityPages = [
    {
      url: `${baseUrl}/activities/coding-lab`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/activities/python-basics-syntax-quiz`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
  ]

  // Dinamik sayfalar - Dersler
  let lessonPages: MetadataRoute.Sitemap = []
  try {
    const lessons = await prisma.learningActivity.findMany({
      where: { 
        isActive: true,
        activityType: 'lesson',
        NOT: { slug: null }
      },
      select: {
        slug: true,
        updatedAt: true,
      },
    })

    lessonPages = lessons.map(lesson => ({
      url: `${baseUrl}/learn/${lesson.slug}`,
      lastModified: lesson.updatedAt || new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    }))
  } catch (error) {
    console.error('Sitemap ders verisi alınamadı:', error)
  }

  // Tüm sayfaları birleştir
  return [
    ...staticPages,
    ...activityPages,
    ...specialActivityPages,
    ...lessonPages,
  ]
}