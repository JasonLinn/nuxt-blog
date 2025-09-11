export default defineSitemapEventHandler(async () => {
  return [
    // 主要頁面
    {
      loc: '/',
      changefreq: 'daily',
      priority: 1.0,
      lastmod: new Date().toISOString()
    },
    {
      loc: '/homestay-list',
      changefreq: 'daily',
      priority: 0.9,
      lastmod: new Date().toISOString()
    },
    {
      loc: '/about',
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date().toISOString()
    },
    {
      loc: '/rule',
      changefreq: 'monthly',
      priority: 0.6,
      lastmod: new Date().toISOString()
    },
    {
      loc: '/relative',
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date().toISOString()
    },
    {
      loc: '/findRoom',
      changefreq: 'daily',
      priority: 0.8,
      lastmod: new Date().toISOString()
    }
    // 注意: 民宿詳情頁面可以在這裡添加，如果有民宿 API 的話
    // 例如：
    // {
    //   loc: '/homestays/001',
    //   changefreq: 'weekly',
    //   priority: 0.8,
    //   lastmod: new Date().toISOString()
    // }
  ]
})
