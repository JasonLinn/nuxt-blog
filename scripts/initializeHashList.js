import wayBubble from '../utils/hashList.js'
import { hashDatabase } from '../utils/hashDatabase.js'
import dotenv from 'dotenv'

// 加載環境變量
dotenv.config()

async function initializeHashList() {
  try {
    console.log('開始初始化 hash 列表...')
    const result = await hashDatabase.initializeHashList(wayBubble)
    if (result) {
      console.log('hash 列表初始化完成')
    } else {
      console.log('hash 列表初始化失敗')
    }
  } catch (error) {
    console.error('初始化失敗:', error)
    process.exit(1)
  }
}

initializeHashList() 