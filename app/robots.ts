import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pylearn.net'
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/_next/',
          '/static/',
        ],
        disallow: [
          '/api/',
          '/admin/',
          '/login',
          '/register',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}