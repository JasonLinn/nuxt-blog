import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// 獲取當前文件的目錄（ES模組環境）
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 圖片處理配置
const config = {
  // 備份設定
  backup: {
    enabled: true,
    folder: 'backup_images'
  },
  
  // 壓縮設定
  compression: {
    quality: 80,
    progressive: true
  },
  
  // 調整尺寸設定（預設不調整尺寸，只壓縮）
  resize: {
    enabled: false, // 預設不調整尺寸
    maxWidth: 800,   // 最大寬度
    maxHeight: 600,  // 最大高度
    fit: 'inside',   // inside: 保持比例，完整顯示；contain: 同inside
    withoutEnlargement: true, // 不放大小圖片
    maintainAspectRatio: true // 保持原始比例
  },
  
  // 支援的圖片格式
  supportedFormats: ['.jpg', '.jpeg', '.png', '.webp'],
  
  // 輸出格式
  outputFormat: 'jpeg' // jpeg, png, webp
}

/**
 * 創建備份目錄
 */
function createBackupDir(baseDir) {
  const backupDir = path.join(baseDir, config.backup.folder)
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true })
    console.log(`✅ 創建備份目錄: ${backupDir}`)
  }
  return backupDir
}

/**
 * 備份原始文件
 */
function backupFile(filePath, backupDir) {
  const fileName = path.basename(filePath)
  const backupPath = path.join(backupDir, fileName)
  
  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(filePath, backupPath)
    console.log(`📦 備份文件: ${fileName}`)
    return true
  } else {
    console.log(`⚠️  備份已存在，跳過: ${fileName}`)
    return false
  }
}

/**
 * 處理單個圖片
 */
async function processImage(inputPath, outputPath, options = {}) {
  try {
    const processingOptions = { ...config, ...options }
    
    let processor = sharp(inputPath)
    
    // 獲取原始圖片資訊
    const metadata = await processor.metadata()
    console.log(`📊 處理圖片: ${path.basename(inputPath)} (${metadata.width}x${metadata.height}, ${Math.round(metadata.size / 1024)}KB)`)
    
    // 調整大小（僅在啟用時）
    if (processingOptions.resize && processingOptions.resize.enabled) {
      // 使用 maxWidth 和 maxHeight 來保持比例
      const resizeOptions = {
        fit: processingOptions.resize.fit || 'inside',
        withoutEnlargement: processingOptions.resize.withoutEnlargement || true
      }
      
      // 如果指定了最大寬度和高度，使用它們
      if (processingOptions.resize.maxWidth && processingOptions.resize.maxHeight) {
        resizeOptions.width = processingOptions.resize.maxWidth
        resizeOptions.height = processingOptions.resize.maxHeight
      } 
      // 向後兼容：如果還在使用舊的 width/height 屬性
      else if (processingOptions.resize.width && processingOptions.resize.height) {
        resizeOptions.width = processingOptions.resize.width
        resizeOptions.height = processingOptions.resize.height
      }
      // 如果只指定了寬度，按比例計算高度
      else if (processingOptions.resize.maxWidth) {
        resizeOptions.width = processingOptions.resize.maxWidth
      }
      // 如果只指定了高度，按比例計算寬度
      else if (processingOptions.resize.maxHeight) {
        resizeOptions.height = processingOptions.resize.maxHeight
      }
      
      processor = processor.resize(resizeOptions)
      
      const sizeInfo = resizeOptions.width && resizeOptions.height 
        ? `最大 ${resizeOptions.width}x${resizeOptions.height}`
        : resizeOptions.width 
          ? `最大寬度 ${resizeOptions.width}px`
          : `最大高度 ${resizeOptions.height}px`
      
      console.log(`🔄 按比例調整: ${sizeInfo} (保持原始比例)`)
    } else {
      console.log(`📐 保持原始尺寸: ${metadata.width}x${metadata.height}`)
    }
    
    // 根據輸出格式設定壓縮
    switch (processingOptions.outputFormat) {
      case 'jpeg':
        processor = processor.jpeg({
          quality: processingOptions.compression.quality,
          progressive: processingOptions.compression.progressive
        })
        break
      case 'png':
        processor = processor.png({
          quality: processingOptions.compression.quality,
          progressive: processingOptions.compression.progressive
        })
        break
      case 'webp':
        processor = processor.webp({
          quality: processingOptions.compression.quality
        })
        break
    }
    
    // 輸出處理後的圖片
    await processor.toFile(outputPath)
    
    // 獲取處理後的文件大小
    const outputStats = fs.statSync(outputPath)
    const inputStats = fs.statSync(inputPath)
    const compressionRatio = ((1 - outputStats.size / inputStats.size) * 100).toFixed(1)
    
    console.log(`✅ 完成處理: ${path.basename(outputPath)} (${Math.round(outputStats.size / 1024)}KB, 壓縮 ${compressionRatio}%)`)
    
    return {
      success: true,
      originalSize: inputStats.size,
      compressedSize: outputStats.size,
      compressionRatio: parseFloat(compressionRatio)
    }
  } catch (error) {
    console.error(`❌ 處理失敗: ${path.basename(inputPath)}`, error.message)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * 批量處理圖片
 */
async function batchProcess(inputDir, options = {}) {
  console.log(`🚀 開始批量處理圖片: ${inputDir}`)
  
  const processingOptions = { ...config, ...options }
  
  // 創建備份目錄
  let backupDir = null
  if (processingOptions.backup.enabled) {
    backupDir = createBackupDir(inputDir)
  }
  
  // 獲取所有圖片文件
  const files = getAllImageFiles(inputDir)
  console.log(`📁 找到 ${files.length} 個圖片文件`)
  
  if (files.length === 0) {
    console.log('❌ 沒有找到任何圖片文件')
    return
  }
  
  const results = {
    total: files.length,
    processed: 0,
    skipped: 0,
    failed: 0,
    totalOriginalSize: 0,
    totalCompressedSize: 0
  }
  
  // 處理每個文件
  for (const file of files) {
    const fileName = path.basename(file)
    const fileExt = path.extname(file).toLowerCase()
    
    // 跳過已經是備份目錄的文件
    if (file.includes(config.backup.folder)) {
      console.log(`⏭️  跳過備份目錄文件: ${fileName}`)
      results.skipped++
      continue
    }
    
    // 備份原始文件
    if (backupDir) {
      backupFile(file, backupDir)
    }
    
    // 生成輸出路徑
    const outputFileName = processingOptions.outputFormat === 'jpeg' && fileExt !== '.jpg' && fileExt !== '.jpeg'
      ? fileName.replace(fileExt, '.jpg')
      : fileName
    
    const outputPath = path.join(inputDir, outputFileName)
    
    // 如果輸出路徑和輸入路徑不同，創建臨時文件
    const tempOutputPath = file === outputPath ? file + '.tmp' : outputPath
    
    // 處理圖片
    const result = await processImage(file, tempOutputPath, processingOptions)
    
    if (result.success) {
      // 如果使用臨時文件，替換原文件
      if (tempOutputPath !== outputPath) {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file) // 刪除原文件
        }
        fs.renameSync(tempOutputPath, outputPath) // 重命名臨時文件
      } else {
        fs.renameSync(tempOutputPath, file) // 替換原文件
      }
      
      results.processed++
      results.totalOriginalSize += result.originalSize
      results.totalCompressedSize += result.compressedSize
    } else {
      results.failed++
      // 清理臨時文件
      if (fs.existsSync(tempOutputPath)) {
        fs.unlinkSync(tempOutputPath)
      }
    }
  }
  
  // 顯示統計結果
  const totalCompressionRatio = results.totalOriginalSize > 0 
    ? ((1 - results.totalCompressedSize / results.totalOriginalSize) * 100).toFixed(1)
    : 0
  
  console.log('\n📊 批量處理完成統計:')
  console.log(`✅ 成功處理: ${results.processed} 個文件`)
  console.log(`⏭️  跳過: ${results.skipped} 個文件`)
  console.log(`❌ 失敗: ${results.failed} 個文件`)
  console.log(`💾 原始總大小: ${(results.totalOriginalSize / 1024 / 1024).toFixed(2)} MB`)
  console.log(`💾 壓縮後總大小: ${(results.totalCompressedSize / 1024 / 1024).toFixed(2)} MB`)
  console.log(`📉 整體壓縮率: ${totalCompressionRatio}%`)
  
  return results
}

/**
 * 獲取目錄下所有圖片文件
 */
function getAllImageFiles(dir) {
  const files = []
  
  function walkDir(currentDir) {
    const items = fs.readdirSync(currentDir)
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item)
      const stat = fs.statSync(fullPath)
      
      if (stat.isDirectory()) {
        // 跳過備份目錄
        if (item !== config.backup.folder) {
          walkDir(fullPath)
        }
      } else if (stat.isFile()) {
        const ext = path.extname(item).toLowerCase()
        if (config.supportedFormats.includes(ext)) {
          files.push(fullPath)
        }
      }
    }
  }
  
  walkDir(dir)
  return files
}

/**
 * 預設配置的快速處理函數
 */
async function processForWeb(inputDir, customConfig = {}) {
  const webConfig = {
    resize: {
      enabled: false, // 預設不調整尺寸，只壓縮
      maxWidth: 800,  // 最大寬度
      maxHeight: 600, // 最大高度
      fit: 'inside',  // 保持比例
      withoutEnlargement: true,
      maintainAspectRatio: true
    },
    compression: {
      quality: 80,
      progressive: true
    },
    outputFormat: 'jpeg',
    backup: {
      enabled: true,
      folder: 'backup_original'
    }
  }
  
  return await batchProcess(inputDir, { ...webConfig, ...customConfig })
}

/**
 * 縮圖處理函數
 */
async function createThumbnails(inputDir, customConfig = {}) {
  const thumbnailConfig = {
    resize: {
      enabled: true, // 縮圖需要調整尺寸
      maxWidth: 300,  // 最大寬度
      maxHeight: 200, // 最大高度
      fit: 'inside',  // 保持比例，不裁剪
      withoutEnlargement: true,
      maintainAspectRatio: true
    },
    compression: {
      quality: 70,
      progressive: true
    },
    outputFormat: 'jpeg',
    backup: {
      enabled: false
    }
  }
  
  // 創建縮圖目錄
  const thumbnailDir = path.join(inputDir, 'thumbnails')
  if (!fs.existsSync(thumbnailDir)) {
    fs.mkdirSync(thumbnailDir, { recursive: true })
  }
  
  const files = getAllImageFiles(inputDir)
  console.log(`🖼️  開始創建縮圖: ${files.length} 個文件`)
  
  for (const file of files) {
    if (file.includes('thumbnails') || file.includes(config.backup.folder)) {
      continue
    }
    
    const fileName = path.basename(file)
    const outputPath = path.join(thumbnailDir, fileName.replace(path.extname(fileName), '.jpg'))
    
    await processImage(file, outputPath, { ...thumbnailConfig, ...customConfig })
  }
}

export {
  config,
  processImage,
  batchProcess,
  processForWeb,
  createThumbnails,
  getAllImageFiles
}