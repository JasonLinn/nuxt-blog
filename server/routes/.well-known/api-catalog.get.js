/**
 * GET /.well-known/api-catalog
 * RFC 9727 — API Catalog for automated agent discovery
 * Returns application/linkset+json
 */
export default defineEventHandler((event) => {
  setResponseHeader(event, 'Content-Type', 'application/linkset+json')
  setResponseHeader(event, 'Access-Control-Allow-Origin', '*')
  setResponseHeader(event, 'Cache-Control', 'public, max-age=86400')

  return {
    linkset: [
      {
        anchor: 'https://yilanpass.com',
        'service-doc': [
          { href: 'https://yilanpass.com/llms.txt', type: 'text/markdown' },
        ],
        'describedby': [
          { href: 'https://yilanpass.com/sitemap.xml', type: 'application/xml' },
        ],
        'license': [
          { href: 'https://creativecommons.org/licenses/by-nc/4.0/' },
        ],
      },
      {
        anchor: 'https://yilanpass.com/api/fetchBnbs',
        'service-doc': [
          { href: 'https://yilanpass.com/llms.txt', type: 'text/markdown' },
        ],
        'type': [
          { href: 'https://schema.org/SearchAction' },
        ],
      },
      {
        anchor: 'https://yilanpass.com/api/fetchBnbDetail',
        'service-doc': [
          { href: 'https://yilanpass.com/llms.txt', type: 'text/markdown' },
        ],
        'type': [
          { href: 'https://schema.org/ReadAction' },
        ],
      },
    ],
  }
})
