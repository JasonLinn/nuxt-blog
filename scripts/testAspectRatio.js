#!/usr/bin/env node

/**
 * 測試圖片按比例調整功能
 */

import { processImage } from '../utils/imageProcessor.js'
import { getAllImageFiles } from '../utils/imageProcessor.js'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function calculateAspectRatio(width, height) {
  return (width / height).toFixed(3)
}

async function testAspectRatioResize() {
  console.log('🧪 測試圖片按比例調整功能')
  console.log('============================\n')
  
  // 測試目錄
  const testDir = path.join(__dirname, '../public/shop')
  
  // 獲取測試文件
  const allFiles = getAllImageFiles(testDir)
  const testFiles = allFiles.slice(0, 3) // 測試前3個文件
  
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
    const originalRatio = calculateAspectRatio(originalMetadata.width, originalMetadata.height)
    
    console.log(`📐 原始尺寸: ${originalMetadata.width}x${originalMetadata.height}`)
    console.log(`📏 原始比例: ${originalRatio}`)
    console.log(`💾 原始大小: ${Math.round(originalMetadata.size / 1024)}KB`)
    
    // 創建測試輸出文件
    const testOutputPath = file.replace(/\.[^.]+$/, '_test_resized$&')
    
    // 測試按比例調整配置
    const resizeConfig = {
      resize: { 
        enabled: true,
        maxWidth: 400,  // 設定較小的最大寬度來測試
        maxHeight: 300, // 設定較小的最大高度來測試
        fit: 'inside',
        withoutEnlargement: true,
        maintainAspectRatio: true
      },
      compression: { quality: 80 },
      outputFormat: 'jpeg',
      backup: { enabled: false }
    }
    
    // 執行調整
    const result = await processImage(file, testOutputPath, resizeConfig)
    
    if (result.success) {
      // 檢查調整後的文件
      const resizedMetadata = await sharp(testOutputPath).metadata()
      const resizedRatio = calculateAspectRatio(resizedMetadata.width, resizedMetadata.height)
      
      console.log(`📐 調整後尺寸: ${resizedMetadata.width}x${resizedMetadata.height}`)
      console.log(`📏 調整後比例: ${resizedRatio}`)
      console.log(`💾 調整後大小: ${Math.round(resizedMetadata.size / 1024)}KB`)
      console.log(`📉 壓縮率: ${result.compressionRatio}%`)
      
      // 驗證比例是否保持
      const ratioDiff = Math.abs(parseFloat(originalRatio) - parseFloat(resizedRatio))
      if (ratioDiff < 0.01) { // 允許微小的誤差
        console.log('✅ 比例保持正確 - 測試通過')
      } else {
        console.log(`❌ 比例發生變化 - 測試失敗 (差異: ${ratioDiff})`)
      }
      
      // 驗證尺寸是否在限制範圍內
      const withinLimits = resizedMetadata.width <= 400 && resizedMetadata.height <= 300
      if (withinLimits) {
        console.log('✅ 尺寸在限制範圍內 - 測試通過')
      } else {
        console.log('❌ 尺寸超出限制範圍 - 測試失敗')
      }
      
      // 清理測試文件
      if (fs.existsSync(testOutputPath)) {
        fs.unlinkSync(testOutputPath)
        console.log('🧹 清理測試文件')
      }
    } else {
      console.log(`❌ 處理失敗: ${result.error}`)
    }
  }
  
  console.log('\n🎉 比例調整測試完成！')
}

// 執行測試
if (import.meta.url === `file://${process.argv[1]}`) {
  testAspectRatioResize().catch(console.error)
}

export { testAspectRatioResize }