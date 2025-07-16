#!/usr/bin/env node

/**
 * 測試純壓縮功能（不改變尺寸）
 */

import { processImage } from '../utils/imageProcessor.js'
import { getAllImageFiles } from '../utils/imageProcessor.js'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function testCompressionOnly() {
  console.log('🧪 測試純壓縮功能（不改變尺寸）')
  console.log('=================================\n')
  
  // 測試目錄
  const testDir = path.join(__dirname, '../public/shop')
  
  // 獲取幾個測試文件
  const allFiles = getAllImageFiles(testDir)
  const testFiles = allFiles.slice(0, 3) // 只測試前3個文件
  
  if (testFiles.length === 0) {
    console.log('❌ 沒有找到測試文件')
    return
  }
  
  console.log(`📁 測試目錄: ${testDir}`)
  console.log(`🎯 測試文件數量: ${testFiles.length}\n`)
  
  for (const file of testFiles) {
    console.log(`\n📊 測試文件: ${path.basename(file)}`)
    
    // 獲取原始圖片資訊
    const sharp = (await import('sharp')).default
    const originalMetadata = await sharp(file).metadata()
    console.log(`📐 原始尺寸: ${originalMetadata.width}x${originalMetadata.height}`)
    console.log(`💾 原始大小: ${Math.round(originalMetadata.size / 1024)}KB`)
    
    // 創建測試輸出文件
    const testOutputPath = file.replace(/\.[^.]+$/, '_test_compressed$&')
    
    // 測試純壓縮配置
    const compressionConfig = {
      resize: { enabled: false }, // 不調整尺寸
      compression: { quality: 80 },
      outputFormat: 'jpeg',
      backup: { enabled: false }
    }
    
    // 執行壓縮
    const result = await processImage(file, testOutputPath, compressionConfig)
    
    if (result.success) {
      // 檢查輸出文件尺寸
      const compressedMetadata = await sharp(testOutputPath).metadata()
      console.log(`📐 壓縮後尺寸: ${compressedMetadata.width}x${compressedMetadata.height}`)
      console.log(`💾 壓縮後大小: ${Math.round(compressedMetadata.size / 1024)}KB`)
      console.log(`📉 壓縮率: ${result.compressionRatio}%`)
      
      // 驗證尺寸是否保持不變
      if (originalMetadata.width === compressedMetadata.width && 
          originalMetadata.height === compressedMetadata.height) {
        console.log('✅ 尺寸保持不變 - 測試通過')
      } else {
        console.log('❌ 尺寸發生變化 - 測試失敗')
      }
      
      // 清理測試文件
      if (fs.existsSync(testOutputPath)) {
        fs.unlinkSync(testOutputPath)
        console.log('🧹 清理測試文件')
      }
    } else {
      console.log(`❌ 壓縮失敗: ${result.error}`)
    }
  }
  
  console.log('\n🎉 測試完成！')
}

// 執行測試
if (import.meta.url === `file://${process.argv[1]}`) {
  testCompressionOnly().catch(console.error)
}

export { testCompressionOnly }