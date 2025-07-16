#!/usr/bin/env node

/**
 * 從備份恢復並重新處理圖片
 * 這個腳本會從備份文件夾恢復原始圖片，然後使用正確的比例調整設定重新處理
 */

import { batchProcess } from '../utils/imageProcessor.js'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function restoreFromBackup(targetDir) {
  console.log(`🔄 從備份恢復圖片: ${targetDir}`)
  
  const backupDir = path.join(targetDir, 'backup_images')
  
  if (!fs.existsSync(backupDir)) {
    console.log(`❌ 備份目錄不存在: ${backupDir}`)
    return false
  }
  
  // 獲取備份文件
  const backupFiles = fs.readdirSync(backupDir)
  console.log(`📁 找到 ${backupFiles.length} 個備份文件`)
  
  let restored = 0
  
  for (const fileName of backupFiles) {
    const backupPath = path.join(backupDir, fileName)
    const targetPath = path.join(targetDir, fileName)
    
    try {
      // 檢查是否為文件
      if (fs.statSync(backupPath).isFile()) {
        // 復製備份文件到目標位置
        fs.copyFileSync(backupPath, targetPath)
        console.log(`📦 恢復: ${fileName}`)
        restored++
      }
    } catch (error) {
      console.error(`❌ 恢復失敗: ${fileName}`, error.message)
    }
  }
  
  console.log(`✅ 成功恢復 ${restored} 個文件`)
  return true
}

async function cleanupOldFiles(targetDir) {
  console.log(`🧹 清理舊文件: ${targetDir}`)
  
  // 清理縮圖文件夾
  const thumbnailDir = path.join(targetDir, 'thumbnails')
  if (fs.existsSync(thumbnailDir)) {
    fs.rmSync(thumbnailDir, { recursive: true, force: true })
    console.log(`🗑️  清理縮圖目錄: ${thumbnailDir}`)
  }
  
  // 清理處理紀錄檔
  const recordPath = path.join(targetDir, 'image-process-record.json')
  if (fs.existsSync(recordPath)) {
    fs.unlinkSync(recordPath)
    console.log(`🗑️  清理處理紀錄檔: ${recordPath}`)
  }
}

async function reprocessWithCorrectSettings(targetDir) {
  console.log(`🔄 使用正確設定重新處理: ${targetDir}`)
  
  // 使用新的比例調整設定
  const correctConfig = {
    resize: {
      enabled: true,
      maxWidth: 800,
      maxHeight: 600,
      fit: 'inside',
      maintainAspectRatio: true,
      withoutEnlargement: true
    },
    compression: {
      quality: 80,
      progressive: true
    },
    outputFormat: 'jpeg',
    backup: {
      enabled: false // 不再備份，因為已經有備份了
    }
  }
  
  return await batchProcess(targetDir, correctConfig)
}

async function restoreAndReprocess(target = 'shop') {
  const targetDirs = {
    shop: path.join(__dirname, '../public/shop'),
    relative: path.join(__dirname, '../public/relative'),
    all: [
      path.join(__dirname, '../public/shop'),
      path.join(__dirname, '../public/relative')
    ]
  }
  
  const dirsToProcess = target === 'all' ? targetDirs.all : [targetDirs[target]]
  
  if (!dirsToProcess || dirsToProcess.length === 0) {
    console.error(`❌ 無效的目標: ${target}`)
    console.log(`✅ 可用目標: ${Object.keys(targetDirs).join(', ')}`)
    return
  }
  
  for (const targetDir of dirsToProcess) {
    console.log(`\n🎯 處理目錄: ${targetDir}`)
    console.log('='.repeat(60))
    
    try {
      // 步驟1: 清理舊文件
      await cleanupOldFiles(targetDir)
      
      // 步驟2: 從備份恢復
      const restored = await restoreFromBackup(targetDir)
      if (!restored) {
        console.log(`⏭️  跳過 ${targetDir}，無法恢復`)
        continue
      }
      
      // 步驟3: 使用正確設定重新處理
      const startTime = Date.now()
      const results = await reprocessWithCorrectSettings(targetDir)
      const endTime = Date.now()
      const duration = ((endTime - startTime) / 1000).toFixed(1)
      
      console.log(`\n🎉 ${path.basename(targetDir)} 處理完成！耗時 ${duration} 秒`)
      
      if (results) {
        console.log(`📊 處理統計:`)
        console.log(`  ✅ 成功: ${results.processed} 個`)
        console.log(`  ⏭️  跳過: ${results.skipped} 個`)
        console.log(`  ❌ 失敗: ${results.failed} 個`)
        console.log(`  💾 壓縮率: ${((1 - results.totalCompressedSize / results.totalOriginalSize) * 100).toFixed(1)}%`)
      }
      
    } catch (error) {
      console.error(`❌ 處理 ${targetDir} 時發生錯誤:`, error.message)
    }
  }
  
  console.log('\n🏁 全部處理完成！')
}

// 從命令行參數獲取目標
const target = process.argv[2] || 'shop'

// 執行恢復和重新處理
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🔄 圖片恢復並重新處理工具')
  console.log('========================')
  console.log(`目標: ${target}`)
  console.log(`用法: node restoreAndReprocess.js [shop|relative|all]`)
  console.log('')
  
  restoreAndReprocess(target)
}

export { restoreAndReprocess }