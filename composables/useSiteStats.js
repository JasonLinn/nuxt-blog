// 站點統計：累積瀏覽次數、合作店家、合作旅宿

// 模組級 in-flight promise — 嚴格限制只在 client 使用（透過 window 檢查避免 SSR 跨請求洩漏）
let _fetchInflight = null

export const useSiteStats = () => {
  // 預設皆為 0（pageview 用 null 區分「尚未載入」以避免 applyPageview 的拒絕回跳邏輯卡死）
  const stats = useState('siteStatsData', () => ({
    pageview: null,
    partnerStores: 0,
    partnerHotels: 0,
  }))
  const fetched = useState('siteStatsFetched', () => false)
  const hasAnimated = useState('siteStatsAnimated', () => false)
  const displayVisitorCount = useState('siteStatsVisitorDisplay', () => '0')

  const partnerStores = computed(() => stats.value.partnerStores)
  const partnerHotels = computed(() => stats.value.partnerHotels)

  // 執行從 0 滾動到 target 的動畫（僅跑一次）
  const runAnimation = (target, duration = 1600) => {
    if (hasAnimated.value) return
    if (typeof window === 'undefined') return
    if (!Number.isFinite(target) || target <= 0) return

    hasAnimated.value = true
    const start = Date.now()
    const tick = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.floor(eased * target)
      displayVisitorCount.value = current.toLocaleString('zh-TW')
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }

  // 更新 pageview，並丟棄亂序到達的舊值
  // 若是首次拿到值（從 null 變成數字）且尚未跑過動畫，自動觸發動畫
  // 這樣即使首屏 animateVisitor 全部失敗，後續 plugin trackPageview 成功時仍會啟動動畫
  const applyPageview = (newCount) => {
    if (typeof newCount !== 'number' || !Number.isFinite(newCount)) return
    // 初始為 null 時直接接受；之後才比較大小拒絕回跳
    if (stats.value.pageview !== null && newCount < stats.value.pageview) return

    const isFirstValue = stats.value.pageview === null
    stats.value.pageview = newCount

    if (isFirstValue && !hasAnimated.value) {
      runAnimation(newCount)
    } else if (hasAnimated.value) {
      displayVisitorCount.value = newCount.toLocaleString('zh-TW')
    }
  }

  // 載入站點統計（in-flight 保護，整個 session 只 fetch 一次；非阻塞使用）
  // _fetchInflight 嚴格限制只在 client 端使用以避免 SSR 跨請求干擾
  const fetchStats = () => {
    if (typeof window === 'undefined') return Promise.resolve(null)
    if (_fetchInflight) return _fetchInflight
    if (fetched.value) return Promise.resolve(null)

    _fetchInflight = $fetch('/api/site-stats')
      .then((data) => {
        if (data) {
          if (typeof data.pageview === 'number') applyPageview(data.pageview)
          if (typeof data.partnerStores === 'number') {
            stats.value.partnerStores = data.partnerStores
          }
          if (typeof data.partnerHotels === 'number') {
            stats.value.partnerHotels = data.partnerHotels
          }
        }
        fetched.value = true
        return data
      })
      .catch((err) => {
        console.error('載入站點統計失敗:', err)
        return null
      })
      .finally(() => {
        _fetchInflight = null
      })

    return _fetchInflight
  }

  // 紀錄一次 pageview（每次呼叫都 +1，無客戶端去重）
  const trackPageview = async () => {
    if (typeof window === 'undefined') return null
    try {
      const res = await $fetch('/api/pageview', { method: 'POST' })
      if (res?.success) applyPageview(res.count)
      return res
    } catch (err) {
      console.error('紀錄 pageview 失敗:', err)
      return null
    }
  }

  // 啟動 pageview 計數與動畫（在 onMounted 呼叫）
  // 設計：
  //  - 本身非阻塞，不阻擋頁面渲染
  //  - 並行觸發 fetchStats + trackPageview
  //  - 動畫由 applyPageview 在「首次拿到值」時自動啟動
  //  - 即使首次兩個請求都失敗，後續 plugin 觸發 trackPageview 成功時仍會啟動動畫
  const animateVisitor = async () => {
    if (typeof window === 'undefined') return
    if (hasAnimated.value) return

    // 並行觸發，誰先回來誰先更新 stats.value.pageview，並觸發動畫
    fetchStats()
    trackPageview()
  }

  return {
    partnerStores,
    partnerHotels,
    displayVisitorCount,
    animateVisitor,
    fetchStats,
    trackPageview,
  }
}
