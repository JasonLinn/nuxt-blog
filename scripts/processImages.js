#!/usr/bin/env node

import { processForWeb, createThumbnails, batchProcess } from '../utils/imageProcessor.js'
import path from 'path'
import { fileURLToPath } from 'url'
import readline from 'readline'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 預設圖片目錄
const IMAGE_DIRS = {
  public: path.join(__dirname, '../public'),
  shop: path.join(__dirname, '../public/shop'),
  relative: path.join(__dirname, '../public/relative'),
  icons: path.join(__dirname, '../public/icon')
}

// 處理模式配置
const PROCESSING_MODES = {
  web: {
    name: 'Web 優化',
    description: '適合網頁顯示的壓縮 (800x600, 80% 品質)',
    config: {
      resize: { width: 800, height: 600, fit: 'cover' },
      compression: { quality: 80 },
      outputFormat: 'jpeg'
    }
  },
  mobile: {
    name: '手機優化', 
    description: '適合手機顯示的壓縮 (600x400, 75% 品質)',
    config: {
      resize: { width: 600, height: 400, fit: 'cover' },
      compression: { quality: 75 },
      outputFormat: 'jpeg'
    }
  },
  thumbnail: {
    name: '縮圖',
    description: '創建縮圖 (300x200, 70% 品質)',
    config: {
      resize: { width: 300, height: 200, fit: 'cover' },
      compression: { quality: 70 },
      outputFormat: 'jpeg'
    }
  },
  compress: {
    name: '壓縮',
    description: '只壓縮不改變尺寸 (85% 品質)',
    config: {
      resize: null,
      compression: { quality: 85 },
      outputFormat: 'jpeg'
    }
  },
  webp: {
    name: 'WebP 轉換',
    description: '轉換為 WebP 格式 (80% 品質)',
    config: {
      resize: { width: 800, height: 600, fit: 'cover' },
      compression: { quality: 80 },
      outputFormat: 'webp'
    }
  }
}

// 創建命令行介面
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve)
  })
}

function showDirectories() {
  console.log('\n📁 可用的圖片目錄:')
  Object.entries(IMAGE_DIRS).forEach(([key, dir], index) => {
    console.log(`${index + 1}. ${key}: ${dir}`)
  })
  console.log(`${Object.keys(IMAGE_DIRS).length + 1}. 自定義路徑`)
}

function showProcessingModes() {
  console.log('\n⚙️  處理模式:')
  Object.entries(PROCESSING_MODES).forEach(([key, mode], index) => {
    console.log(`${index + 1}. ${mode.name}: ${mode.description}`)
  })
}

async function selectDirectory() {
  showDirectories()
  
  const choice = await askQuestion('\n請選擇要處理的目錄 (輸入數字): ')
  const dirKeys = Object.keys(IMAGE_DIRS)
  const choiceNum = parseInt(choice) - 1
  
  if (choiceNum >= 0 && choiceNum < dirKeys.length) {
    return IMAGE_DIRS[dirKeys[choiceNum]]
  } else if (choiceNum === dirKeys.length) {
    return await askQuestion('請輸入自定義路徑: ')
  } else {
    console.log('❌ 無效選擇，使用預設目錄: public')
    return IMAGE_DIRS.public
  }
}

async function selectProcessingMode() {
  showProcessingModes()
  
  const choice = await askQuestion('\n請選擇處理模式 (輸入數字): ')
  const modeKeys = Object.keys(PROCESSING_MODES)
  const choiceNum = parseInt(choice) - 1
  
  if (choiceNum >= 0 && choiceNum < modeKeys.length) {
    return PROCESSING_MODES[modeKeys[choiceNum]]
  } else {
    console.log('❌ 無效選擇，使用預設模式: Web 優化')
    return PROCESSING_MODES.web
  }
}

async function confirmProcessing(directory, mode) {
  console.log('\n📋 處理設定確認:')
  console.log(`📁 目錄: ${directory}`)
  console.log(`⚙️  模式: ${mode.name}`)
  console.log(`📝 說明: ${mode.description}`)
  console.log(`⚠️  注意: 原始文件將會被備份到 backup_images 目錄`)
  
  const confirm = await askQuestion('\n確定要開始處理嗎？ (y/N): ')
  return confirm.toLowerCase() === 'y' || confirm.toLowerCase() === 'yes'
}

async function main() {
  console.log('🖼️  圖片批量處理工具')
  console.log('====================\n')
  
  try {
    // 選擇目錄
    const directory = await selectDirectory()
    console.log(`✅ 選擇目錄: ${directory}`)
    
    // 選擇處理模式
    const mode = await selectProcessingMode()
    console.log(`✅ 選擇模式: ${mode.name}`)
    
    // 確認處理
    const confirmed = await confirmProcessing(directory, mode)
    
    if (!confirmed) {
      console.log('❌ 取消處理')
      rl.close()
      return
    }
    
    console.log('\n🚀 開始處理...')
    
    // 執行處理
    const startTime = Date.now()
    const results = await batchProcess(directory, {
      ...mode.config,
      backup: { enabled: true, folder: 'backup_images' }
    })
    
    const endTime = Date.now()
    const duration = ((endTime - startTime) / 1000).toFixed(1)
    
    console.log(`\n🎉 處理完成！耗時 ${duration} 秒`)
    
    // 詢問是否創建縮圖
    if (mode.name !== '縮圖') {
      const createThumb = await askQuestion('\n是否要創建縮圖？ (y/N): ')
      if (createThumb.toLowerCase() === 'y') {
        console.log('\n🖼️  創建縮圖中...')
        await createThumbnails(directory)
        console.log('✅ 縮圖創建完成')
      }
    }
    
  } catch (error) {
    console.error('❌ 處理過程中發生錯誤:', error.message)
  } finally {
    rl.close()
  }
}

// 如果直接執行此腳本
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { main, IMAGE_DIRS, PROCESSING_MODES }