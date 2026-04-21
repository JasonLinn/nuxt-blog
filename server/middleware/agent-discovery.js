/**
 * Nuxt Server Middleware: AI Agent Discovery
 *
 * 1. Adds Link response headers to all HTML pages (RFC 8288)
 * 2. Intercepts requests with Accept: text/markdown on homepage
 *    and rewrites to /api/markdown for Markdown content negotiation
 */
export default defineEventHandler((event) => {
  const url = getRequestURL(event)
  const path = url.pathname
  const acceptHeader = getRequestHeader(event, 'accept') || ''

  // --- 1. Link Headers (RFC 8288) ---
  // Add Link header pointing agents to useful resources
  const linkHeader = [
    `</llms.txt>; rel="service-doc"`,
    `</.well-known/api-catalog>; rel="api-catalog"`,
    `</.well-known/mcp/server-card.json>; rel="https://modelcontextprotocol.io/ns/server-card"`,
  ].join(', ')

  setResponseHeader(event, 'Link', linkHeader)

  // --- 2. Markdown Content Negotiation ---
  // If agent requests markdown on homepage, redirect to /api/markdown
  if (path === '/' && acceptHeader.includes('text/markdown')) {
    return sendRedirect(event, '/api/markdown', 302)
  }
})
