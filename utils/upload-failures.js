export const failureSources = {
  coupon: '優惠券', activity: '活動投稿', activityEdit: '活動編輯', poster: 'AI 海報辨識',
  article: '文章', shop: '合作店家', place: '景點', homestay: '民宿登錄', homestayEdit: '民宿管理'
}
export const failureStages = { select: '選取圖片', upload: '上傳圖片', submit: '送出表單' }
export const couponFields = {
  title: '優惠券名稱', content: '優惠券內容', business_name: '商家名稱',
  submitter_name: '填寫人姓名', submitter_email: '電子信箱', township: '鄉鎮'
}
export const failureReasons = {
  format: '圖片格式不支援，請改選 JPG 或 PNG 圖片。',
  decode: '裝置無法讀取或壓縮圖片，請換一張圖片。',
  invalidImage: '圖片內容無法讀取，請重新匯出或更換圖片。',
  empty: '沒有收到圖片內容，請重新選圖。',
  tooMany: '活動圖片最多 5 張，請減少張數。',
  tooLarge: '圖片超過上傳大小限制，請縮小圖片。',
  auth: '登入狀態已失效，請重新登入。',
  denied: '目前沒有執行此操作的權限。',
  busy: '操作次數過多，請稍候再試。',
  offline: '目前沒有網路連線，請連線後重試。',
  network: '無法連上伺服器或未收到回應，請檢查網路。',
  township: '請選擇一個宜蘭縣鄉鎮市。',
  challenge: '安全驗證未通過或已逾時，請重新驗證後送審。',
  challengeService: '安全驗證服務暫時無法使用，請稍後重試。',
  required: '必填資料不完整，請檢查標示的欄位。',
  email: '電子信箱格式有誤，請檢查後重試。',
  invalid: '資料未通過驗證，請檢查後重試。',
  storage: '圖片儲存失敗，請稍後重試。',
  database: '系統未能儲存表單，請稍後重試。',
  server: '伺服器處理失敗，請稍後重試。',
  unknown: '無法確認失敗原因，請重試或向管理員提供查詢碼。'
}
export const incidentIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function classifyFailure(error) {
  const status = Number(error?.response?.status || error?.statusCode || error?.status) || null
  const text = [error?.data?.message, error?.data?.statusMessage, error?.message, error?.statusMessage].join(' ')
  let reason = error?.failureReason
  if (!Object.hasOwn(failureReasons, reason)) {
    if (/GitHub upload failed|Coupon image upload failed|EROFS|ENOSPC/i.test(text)) reason = 'storage'
    else if (/Invalid raster image/i.test(text)) reason = 'invalidImage'
    else if (/No file uploaded/i.test(text)) reason = 'empty'
    else if (/Invalid image size/i.test(text)) reason = 'invalidImage'
    else if (/宜蘭縣鄉鎮市/.test(text)) reason = 'township'
    else if (/缺少必填欄位/.test(text)) reason = 'required'
    else if (/File too large/i.test(text)) reason = 'tooLarge'
    else if (status === 400 || status === 422) reason = 'invalid'
    else if (status === 401) reason = 'auth'
    else if (status === 403) reason = 'denied'
    else if (status === 413) reason = 'tooLarge'
    else if (status === 429) reason = 'busy'
    else if (status >= 500) reason = 'server'
    else if (globalThis.navigator?.onLine === false) reason = 'offline'
    else if (/fetch|network|load failed|timeout/i.test(text)) reason = 'network'
    else reason = 'unknown'
  }
  return { reason, status }
}

export function imageSelectionError(reason) {
  return Object.assign(new Error(failureReasons[reason]), { failureReason: reason, failureStage: 'select' })
}
