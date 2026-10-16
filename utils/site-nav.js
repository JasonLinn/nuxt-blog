// 全站導覽設定：Header、手機抽屜、Footer、Tab Bar、後台側欄共用

export const mainMenu = [
  {
    title: '探索優惠',
    path: '/',
    children: [
      { title: '優惠券列表', path: '/', icon: 'ri:coupon-3-line', desc: '在地店家免費電子優惠券' },
      { title: '優惠券地圖', path: '/map', icon: 'ri:map-pin-line', desc: '依地點找附近優惠' },
      {
        title: '提交優惠券',
        path: '/coupons/submit',
        icon: 'ri:add-circle-line',
        desc: '店家免費刊登優惠'
      },
      {
        title: '更新時間列表',
        path: '/launch-schedule',
        icon: 'ri:calendar-line',
        desc: '最新上架與更新紀錄'
      }
    ]
  },
  {
    title: '住宿服務',
    path: '/homestay-list',
    children: [
      {
        title: '合法民宿推薦',
        path: '/homestay-list',
        icon: 'ri:home-heart-line',
        desc: '協會認證的合法民宿'
      },
      {
        title: '民宿業者登入',
        path: '/homestay-login',
        icon: 'ri:key-2-line',
        desc: '管理房況與民宿資料'
      }
    ]
  },
  {
    title: '旅遊資訊',
    path: '/yilan-activities',
    children: [
      {
        title: '宜蘭活動總匯',
        path: '/yilan-activities',
        icon: 'ri:calendar-event-line',
        desc: '近期在地活動與節慶'
      },
      {
        title: '代訂服務',
        path: '/relative',
        icon: 'ri:customer-service-2-line',
        desc: '外燴、烤肉、體驗代訂'
      }
    ]
  },
  {
    title: '關於平台',
    path: '/about',
    children: [
      {
        title: '關於我們',
        path: '/about',
        icon: 'ri:information-line',
        desc: '宜蘭觀光民宿行銷協會'
      },
      { title: '使用規範', path: '/rule', icon: 'ri:file-list-3-line', desc: '優惠券使用規則' }
    ]
  }
]

export const tabItems = [
  {
    title: '優惠',
    path: '/',
    icon: 'ri:coupon-3-line',
    activeIcon: 'ri:coupon-3-fill',
    match: (p) => p === '/' || p.startsWith('/articles') || p.startsWith('/cate')
  },
  {
    title: '住宿',
    path: '/homestay-list',
    icon: 'ri:home-heart-line',
    activeIcon: 'ri:home-heart-fill',
    match: (p) => p.startsWith('/homestay')
  },
  {
    title: '活動',
    path: '/yilan-activities',
    icon: 'ri:calendar-event-line',
    activeIcon: 'ri:calendar-event-fill',
    match: (p) => p.startsWith('/yilan-activities')
  },
  {
    title: '地圖',
    path: '/map',
    icon: 'ri:map-pin-line',
    activeIcon: 'ri:map-pin-fill',
    match: (p) => p.startsWith('/map') || p.startsWith('/itinerary')
  },
  {
    title: '我的',
    path: '/userInfo',
    icon: 'ri:user-3-line',
    activeIcon: 'ri:user-3-fill',
    match: (p) => p.startsWith('/userInfo')
  }
]

// 不顯示前台 Header / Tab Bar 的路由前綴（後台、登入頁）
export const chromelessPrefixes = [
  '/admin',
  '/admin-login',
  '/admin-review',
  '/login',
  '/line_callback'
]

export const adminMenu = [
  {
    group: '民宿',
    items: [
      { title: '民宿審核', path: '/admin-review', icon: 'ri:shield-check-line' },
      { title: '民宿管理', path: '/admin/homestays', icon: 'ri:home-4-line' },
      { title: '特色項目', path: '/admin/features', icon: 'ri:price-tag-3-line' }
    ]
  },
  {
    group: '優惠券',
    items: [
      { title: '優惠券審核', path: '/admin/coupon-review', icon: 'ri:checkbox-multiple-line' },
      { title: '優惠券管理', path: '/admin/coupons', icon: 'ri:coupon-3-line' },
      { title: '推薦碼與店家', path: '/admin/referral', icon: 'ri:share-forward-line' }
    ]
  },
  {
    group: '旅遊內容',
    items: [
      { title: '宜蘭活動', path: '/admin/yilan-activities', icon: 'ri:calendar-event-line' },
      { title: '地點管理', path: '/admin/places', icon: 'ri:map-pin-line' },
      { title: '推薦行程', path: '/admin/recommended-itineraries', icon: 'ri:route-line' },
      { title: '圖片管理', path: '/admin/images', icon: 'ri:image-line' }
    ]
  }
]
