const siteUrl = 'https://yilanpass.com';

export function absoluteHttpUrl(value) {
  if (!value || typeof value !== 'string') return undefined;
  try {
    const url = new URL(value, siteUrl);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : undefined;
  } catch { return undefined; }
}

// Escape HTML delimiters so user-authored descriptions cannot end a JSON-LD script.
export function serializeJsonLd(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

export function buildHomestaySeo(bnb) {
  const url = `${siteUrl}/homestays/${encodeURIComponent(bnb.id)}`;
  const features = [...new Set([
    ...(bnb.features?.themeFeatures || []),
    ...(bnb.features?.serviceAmenities || [])
  ])];
  const introduction = bnb.description?.replace(/\s+/g, ' ').trim();
  const description = [
    `${bnb.name}位於宜蘭${bnb.area || ''}。`,
    introduction || (features.length ? `特色與設施：${features.slice(0, 5).join('、')}。` : ''),
    '查看住宿人數、照片、價格與聯絡資訊。'
  ].join('').slice(0, 160);
  const images = (bnb.image_urls || []).map(absoluteHttpUrl).filter(Boolean);
  const prices = Object.values(bnb.prices || {}).filter(Boolean);
  const sameAs = [bnb.contact?.website, bnb.contact?.facebook, bnb.contact?.instagram]
    .filter(value => /^https?:\/\//i.test(value || '')).map(absoluteHttpUrl).filter(Boolean);
  return {
    url,
    title: `${bnb.name}｜宜蘭${bnb.area || ''}民宿｜宜蘭旅遊通`,
    description,
    image: images[0] || `${siteUrl}/logo.png`,
    schema: {
      '@context': 'https://schema.org',
      '@type': 'LodgingBusiness',
      '@id': url,
      url,
      name: bnb.name,
      description: introduction || description,
      image: images.length ? images : undefined,
      telephone: bnb.contact?.phone || undefined,
      sameAs: sameAs.length ? sameAs : undefined,
      address: {
        '@type': 'PostalAddress',
        streetAddress: bnb.address || undefined,
        addressLocality: bnb.area || undefined,
        addressRegion: '宜蘭縣',
        addressCountry: 'TW'
      },
      priceRange: prices.length ? [...new Set(prices)].join(' / ') : undefined,
      petsAllowed: features.some(feature => ['寵物友善', '寵物友善民宿', '寵物民宿', '可帶寵物入住'].includes(feature)) ? true : undefined,
      amenityFeature: features.map(name => ({ '@type': 'LocationFeatureSpecification', name, value: true }))
    }
  };
}

export function parseListPage(value) {
  if (Array.isArray(value) || (typeof value === 'string' && !/^\d+$/.test(value))) return null;
  const page = Number(value ?? 1);
  return Number.isSafeInteger(page) && page > 0 ? page : null;
}
