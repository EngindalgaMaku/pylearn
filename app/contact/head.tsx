export default function Head() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  const url = `${baseUrl}/contact`
  const image = `${baseUrl}/brand-snake.svg`
  return (
    <>
      {/* JSON-LD: Organization with ContactPoint */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'PyLearn',
            url,
            logo: image,
            contactPoint: [{
              '@type': 'ContactPoint',
              email: 'info@pylearn.net',
              contactType: 'customer support',
              availableLanguage: ['en'],
            }],
          }),
        }}
      />
    </>
  )
}
