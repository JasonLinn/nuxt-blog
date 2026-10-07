import xss from 'xss'

export function sanitizeRichContent(value) {
  return xss(String(value ?? ''), {
    whiteList: { p: [], br: [], strong: [], b: [], em: [], i: [], u: [], ul: [], ol: [], li: [], h2: [], h3: [], h4: [], blockquote: [], a: ['href', 'title', 'target', 'rel'], img: ['src', 'alt', 'width', 'height'] },
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style', 'iframe', 'object', 'svg', 'math'],
    css: false,
  })
}
