import { absoluteHttpUrl } from './homestay-seo.js'
import { summarizeOffer } from './coupon-deal.js'

const siteUrl = 'https://yilanpass.com'

const plain = (text) =>
  String(text || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

// 優惠券頁的 metadata：店家是 LocalBusiness，優惠內容用 makesOffer 描述（不是可購買的商品）
export function buildCouponSeo(article) {
  const url = `${siteUrl}/articles/${encodeURIComponent(article.id)}`
  const content = plain(article.content)
  const offer = summarizeOffer(article.content, 60)
  const town = Array.isArray(article.township) ? article.township[0] : article.township
  const address = Array.isArray(article.adress) ? article.adress.find(Boolean) : article.adress
  const images = (Array.isArray(article.cover) ? article.cover : [article.cover])
    .map(absoluteHttpUrl)
    .filter(Boolean)
  const lead = `${article.title}${town ? `（宜蘭${town}）` : ''}優惠`
  const description = `${lead}：${offer || content}`.slice(0, 160)

  return {
    url,
    title: `${article.title}｜宜蘭優惠券｜宜蘭旅遊通`,
    description,
    image: images[0] || `${siteUrl}/logo.png`,
    schema: {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      '@id': `${url}#business`,
      url,
      name: article.title,
      description: content.slice(0, 500) || description,
      image: images.length ? images : undefined,
      address:
        address || town
          ? {
              '@type': 'PostalAddress',
              streetAddress: address || undefined,
              addressLocality: town || undefined,
              addressRegion: '宜蘭縣',
              addressCountry: 'TW'
            }
          : undefined,
      makesOffer: {
        '@type': 'Offer',
        name: offer ? `${article.title}：${offer}` : `${article.title}優惠`,
        url,
        description: offer || undefined,
        offeredBy: { '@id': `${url}#business` }
      }
    }
  }
}
