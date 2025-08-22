export default function Head() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  const url = `${baseUrl}/privacy`
  const image = `${baseUrl}/brand-snake.svg`
  return (
    <>
      {/* JSON-LD: Privacy Policy Page */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Privacy Policy | PyLearn',
            url,
            description: 'Read the PyLearn Privacy Policy. Learn how we collect, use, and protect your personal information.',
            primaryImageOfPage: image,
            breadcrumb: {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl },
                { '@type': 'ListItem', position: 2, name: 'Privacy Policy', item: url },
              ],
            },
          }),
        }}
      />
    </>
  )
}
