import { readBody, createError } from '#imports'
import fs from 'node:fs/promises'
import path from 'node:path'

const referralFilePath = path.resolve(process.cwd(), 'utils/referral.js')

async function getReferralData() {
  const content = await fs.readFile(referralFilePath, 'utf-8')
  const match = content.match(/export const referral = ([\s\S]*)/)
  if (!match || !match[1]) return []
  let arrayString = match[1].trim()
  if (arrayString.endsWith(';')) arrayString = arrayString.slice(0, -1)
  const parse = new Function(`return ${arrayString}`)
  return parse()
}

// 直接在处理函数中导入 referral 数据
export default defineEventHandler(async (event) => {
  try {
    // 讀取請求體
    const body = await readBody(event);
    
    // 驗證請求體中是否包含 code
    if (!body || !body.code) {
      throw createError({
        statusCode: 400,
        message: "缺少推薦代碼"
      });
    }

    const { code } = body;

    // 從檔案讀取最新 referral 資料
    const referral = await getReferralData()
    const referralData = referral.find(ref => ref.code === code && ref.name);

    if (!referralData) {
      throw createError({
        statusCode: 404,
        message: "無效的推薦代碼"
      });
    }

    return {
      success: true,
      data: referralData
    };

  } catch (error) {
    console.error('推薦代碼驗證錯誤:', error);
    
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "服務器錯誤，請稍後再試"
    });
  }
});