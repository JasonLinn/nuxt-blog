#!/usr/bin/env node

/**
 * 圖片處理工具測試腳本
 * 用於測試功能是否正常運作
 */

import { getAllImageFiles } from '../utils/imageProcessor.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function testImageProcessor() {
  console.log('🧪 圖片處理工具測試')
  console.log('====================\n')
  
  try {
    // 測試目錄
    const testDirs = [
      path.join(__dirname, '../public/shop'),
      path.join(__dirname, '../public/relative'),
      path.join(__dirname, '../public/icon')
    ]
    
    console.log('📁 掃描圖片文件:')
    
    let totalFiles = 0
    for (const dir of testDirs) {
      if (fs.existsSync(dir)) {
        const files = getAllImageFiles(dir)
        console.log(`  ${path.basename(dir)}/: ${files.length} 個文件`)
        
        // 顯示前5個文件作為範例
        if (files.length > 0) {
          files.slice(0, 5).forEach(file => {
            const stats = fs.statSync(file)
            const sizeKB = Math.round(stats.size / 1024)
            console.log(`    - ${path.basename(file)} (${sizeKB}KB)`)
          })
          if (files.length > 5) {
            console.log(`    ... 和另外 ${files.length - 5} 個文件`)
          }
        }
        
        totalFiles += files.length
      } else {
        console.log(`  ${path.basename(dir)}/: 目錄不存在`)
      }
    }
    
    console.log(`\n📊 總計找到 ${totalFiles} 個圖片文件`)
    
    if (totalFiles === 0) {
      console.log('⚠️  沒有找到任何圖片文件，請確認目錄路徑')
      return
    }
    
    // 測試依賴
    console.log('\n🔧 檢查依賴:')
    try {
      const sharp = (await import('sharp')).default
      console.log('  ✅ Sharp 圖片處理庫')
      
      // 測試 Sharp 基本功能
      const testImagePath = path.join(__dirname, '../public/logo.png')
      if (fs.existsSync(testImagePath)) {
        const metadata = await sharp(testImagePath).metadata()
        console.log(`  ✅ Sharp 功能測試 (${metadata.width}x${metadata.height})`)
      }
    } catch (error) {
      console.log('  ❌ Sharp 圖片處理庫未安裝或有問題')
      console.log(`     錯誤: ${error.message}`)
      console.log('     解決: 執行 npm install sharp')
      return
    }
    
    console.log('\n✅ 測試完成，圖片處理工具可以正常使用！')
    console.log('\n🚀 使用方法:')
    console.log('  npm run images:process  # 互動式處理')
    console.log('  node scripts/quickImageProcess.js shop  # 快速處理shop目錄')
    console.log('  node scripts/quickImageProcess.js relative  # 快速處理relative目錄')
    console.log('  node scripts/quickImageProcess.js all  # 處理所有圖片')
    
  } catch (error) {
    console.error('❌ 測試失敗:', error.message)
  }
}

// 執行測試
if (import.meta.url === `file://${process.argv[1]}`) {
  testImageProcessor()
}

export { testImageProcessor }