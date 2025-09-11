/**
 * 系統設定驗證腳本
 * 用於檢查行程規劃系統是否正確設定
 */

import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 載入環境變數
config({ path: join(__dirname, '../.env') })

console.log('🔍 檢查系統設定...\n')

// 檢查環境變數
console.log('📋 環境變數檢查：')
const requiredEnvVars = [
  'DATABASE_URL',
  'GOOGLE_MAPS_API_KEY'
]

let envVarsOk = true
requiredEnvVars.forEach(varName => {
  const value = process.env[varName]
  if (value) {
    // 只顯示前幾個字元，保護敏感資訊
    const displayValue = varName === 'DATABASE_URL' || varName === 'GOOGLE_MAPS_API_KEY'
      ? value.substring(0, 10) + '...'
      : value
    console.log(`  ✅ ${varName}: ${displayValue}`)
  } else {
    console.log(`  ❌ ${varName}: 未設定`)
    envVarsOk = false
  }
})

if (!envVarsOk) {
  console.log('\n❌ 請在 .env 檔案中設定必要的環境變數')
  process.exit(1)
}

// 測試資料庫連線
console.log('\n🗄️ 測試資料庫連線：')
try {
  // 這裡可以加入實際的資料庫連線測試
  console.log('  ℹ️  請手動測試資料庫連線')
  console.log('  💡 建議：執行 scripts/create-places-tables.sql 來建立表格')
} catch (error) {
  console.log(`  ❌ 資料庫連線失敗: ${error.message}`)
}

// 檢查必要檔案
console.log('\n📁 檢查核心檔案：')
const coreFiles = [
  'pages/itinerary.vue',
  'pages/admin/places.vue',
  'components/PlaceModal.vue',
  'server/api/places.get.js',
  'server/api/place-categories.get.js',
  'scripts/create-places-tables.sql'
]

import { existsSync } from 'fs'

coreFiles.forEach(filePath => {
  const fullPath = join(__dirname, '..', filePath)
  if (existsSync(fullPath)) {
    console.log(`  ✅ ${filePath}`)
  } else {
    console.log(`  ❌ ${filePath} - 檔案不存在`)
  }
})

console.log('\n🚀 設定檢查完成！')
console.log('\n📖 下一步：')
console.log('  1. 確保所有環境變數都已設定')
console.log('  2. 執行資料庫建表腳本')
console.log('  3. 啟動開發伺服器：npm run dev')
console.log('  4. 前往 http://localhost:3000/itinerary 測試系統')
