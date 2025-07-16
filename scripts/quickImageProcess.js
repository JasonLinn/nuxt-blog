#!/usr/bin/env node

/**
 * 快速圖片處理工具
 * 快速處理常用的圖片目錄，無需互動選擇
 */

import { processForWeb, createThumbnails } from '../utils/imageProcessor.js'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 預設處理配置
const QUICK_CONFIGS = {
  shop: {
    path: path.join(__dirname, '../public/shop'),
    config: {
      resize: { enabled: false }, // 只壓縮，不調整尺寸
      compression: { quality: 80 },
      outputFormat: 'jpeg',
      backup: { enabled: true, folder: 'backup_original' }
    }
  },
  relative: {
    path: path.join(__dirname, '../public/relative'),
    config: {
      resize: { enabled: false }, // 只壓縮，不調整尺寸
      compression: { quality: 80 },
      outputFormat: 'jpeg',
      backup: { enabled: true, folder: 'backup_original' }
    }
  },
  all: {
    path: path.join(__dirname, '../public'),
    config: {
      resize: { enabled: false }, // 只壓縮，不調整尺寸
      compression: { quality: 80 },
      outputFormat: 'jpeg',
      backup: { enabled: true, folder: 'backup_original' }
    }
  }
}

async function quickProcess(target = 'shop') {
  console.log(`🚀 快速處理開始: ${target}`)
  
  const config = QUICK_CONFIGS[target]
  if (!config) {
    console.error(`❌ 無效的目標: ${target}`)
    console.log(`✅ 可用目標: ${Object.keys(QUICK_CONFIGS).join(', ')}`)
    return
  }
  
  try {
    console.log(`📁 處理目錄: ${config.path}`)
    console.log(`⚙️  配置: 壓縮優化 (保持原始尺寸, 80%品質)`)
    console.log(`💾 備份: 啟用`)
    
    const startTime = Date.now()
    
    // 執行批量處理
    const results = await processForWeb(config.path, config.config)
    
    const endTime = Date.now()
    const duration = ((endTime - startTime) / 1000).toFixed(1)
    
    console.log(`\n🎉 處理完成！耗時 ${duration} 秒`)
    
    // 自動創建縮圖
    console.log('\n🖼️  自動創建縮圖...')
    await createThumbnails(config.path, {
      resize: { width: 300, height: 200, fit: 'cover' },
      compression: { quality: 70 },
      outputFormat: 'jpeg'
    })
    console.log('✅ 縮圖創建完成')
    
  } catch (error) {
    console.error('❌ 處理失敗:', error.message)
  }
}

// 從命令行參數獲取目標
const target = process.argv[2] || 'shop'

// 執行處理
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🖼️  快速圖片處理工具')
  console.log('===================')
  console.log(`用法: node quickImageProcess.js [${Object.keys(QUICK_CONFIGS).join('|')}]`)
  console.log('預設處理 shop 目錄\n')
  
  quickProcess(target)
}

export { quickProcess, QUICK_CONFIGS }