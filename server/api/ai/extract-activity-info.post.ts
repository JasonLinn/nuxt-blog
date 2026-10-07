import { requireAdmin } from '../../utils/admin-auth.js'
import { GoogleGenerativeAI } from '@google/generative-ai'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  console.log('🚀 AI 提取活動資訊 API 被調用')
  
  try {
    // 讀取上傳的檔案
    console.log('📁 開始處理上傳檔案...')
    const formData = await readMultipartFormData(event)
    
    console.log('📋 表單數據數量:', formData?.length || 0)
    
    if (!formData || formData.length === 0) {
      console.log('❌ 沒有上傳檔案')
      throw createError({
        statusCode: 400,
        statusMessage: '請上傳活動海報圖片'
      })
    }

    // 尋找圖片檔案
    console.log('🔍 尋找圖片檔案...')
    const imageFile = formData.find(item => 
      item.name === 'image' && item.data && item.data.length > 0
    )

    console.log('🖼️ 找到圖片檔案:', !!imageFile)
    
    if (!imageFile || !imageFile.data) {
      console.log('❌ 未找到有效的圖片檔案')
      throw createError({
        statusCode: 400,
        statusMessage: '請選擇有效的圖片檔案'
      })
    }

    console.log('📏 圖片檔案大小:', imageFile.data.length, 'bytes')

    // 檢查檔案大小 (最大 5MB)
    if (imageFile.data.length > 5 * 1024 * 1024) {
      console.log('❌ 圖片太大:', imageFile.data.length, 'bytes')
      throw createError({
        statusCode: 400,
        statusMessage: '圖片大小不能超過 5MB'
      })
    }

    // 檢查檔案類型
    const mimeType = imageFile.type || 'image/jpeg'
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    
    console.log('📝 檢查檔案類型:', mimeType)
    
    if (!allowedTypes.includes(mimeType)) {
      console.log('❌ 不支援的檔案類型:', mimeType)
      throw createError({
        statusCode: 400,
        statusMessage: '不支援的圖片格式，請使用 JPG、PNG 或 WebP'
      })
    }

    // 初始化 Gemini AI
    const apiKey = process.env.GEMINI_API_KEY
    console.log('🔑 Gemini API Key 存在:', !!apiKey)
    
    if (!apiKey) {
      console.log('❌ 缺少 Gemini API Key')
      throw createError({
        statusCode: 500,
        statusMessage: 'Gemini API 金鑰未設定'
      })
    }

    console.log('🤖 開始初始化 Gemini AI...')
    const genAI = new GoogleGenerativeAI(apiKey)
    console.log('✅ Gemini AI 初始化成功')
    
    console.log('📋 準備獲取模型...')
    // 改用 gemini-2.5-flash，這是更新且支援多模態（圖片讀取）的模型
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    console.log('✅ 成功獲取模型: gemini-2.5-flash')

    console.log('🔄 準備轉換圖片格式...')
    // 將圖片轉換為 Gemini 支援的格式
    const imagePart = {
      inlineData: {
        data: imageFile.data.toString('base64'),
        mimeType: mimeType
      }
    }
    console.log('✅ 圖片轉換完成，Base64 長度:', imagePart.inlineData.data.length)

    console.log('📝 準備 AI 提示...')
    // 構建提示詞
    const prompt = `請分析這張活動海報或宣傳圖片，提取以下資訊並以 JSON 格式回傳。請仔細觀察圖片中的文字、日期、時間、地點等資訊：

{
  "title": "活動標題",
  "description": "活動描述（100-200字，根據圖片內容推測活動性質和特色）",
  "activity_type": "活動類型（從以下選擇最符合的：文化藝術、觀光旅遊、美食餐飲、戶外運動、親子活動、節慶慶典、教育講座、其他）",
  "event_start_date": "活動開始日期（YYYY-MM-DD格式）",
  "event_end_date": "活動結束日期（YYYY-MM-DD格式，如果是單日活動則與開始日期相同）",
  "event_start_time": "活動開始時間（HH:MM格式，24小時制）",
  "event_end_time": "活動結束時間（HH:MM格式，24小時制）",
  "is_multi_day": true/false,
  "location": "活動地點（詳細地址，優先宜蘭縣內地址）",
  "organizer_name": "主辦單位名稱",
  "organizer_phone": "聯絡電話",
  "organizer_email": "聯絡信箱",
  "price": 活動費用（數字，免費填0），
  "capacity": 參與人數限制（數字，不限制填null），
  "website": "活動網站或報名連結"
}

重要注意事項：
1. 如果某項資訊在圖片中找不到，請填寫 null
2. 日期必須是有效的 YYYY-MM-DD 格式，如果無法確定年份，使用 2025
3. 時間使用24小時制 HH:MM 格式
4. 活動類型必須從提供的選項中選擇最符合的
5. 只回傳 JSON，不要有其他說明文字
6. 活動地點優先找宜蘭縣內的地址
7. 描述請根據活動類型和圖片內容推測，不要只是重複標題
8. 仔細觀察圖片中的繁體中文文字內容

請只回傳 JSON 格式的結果，不要包含任何其他文字或解釋。`

    console.log('🚀 開始調用 Gemini AI...')
    console.log('🤖 正在使用 Gemini AI 分析活動海報...')

    // 發送請求到 Gemini
    const result = await model.generateContent([prompt, imagePart])
    console.log('✅ AI 分析完成')
    
    console.log('📊 獲取回應...')
    const response = await result.response
    console.log('✅ 回應獲取成功')
    
    console.log('📜 提取文字內容...')
    const text = response.text()
    console.log('✅ 文字提取完成，長度:', text.length)

    console.log('🔍 Gemini AI 原始回應:', text)

    console.log('🧹 清理回應格式...')
    // 提取 JSON 內容
    let jsonText = text.trim()
    
    // 移除可能的 markdown 代碼塊標記
    jsonText = jsonText.replace(/^```json\s*\n?/i, '').replace(/\n?```\s*$/i, '')
    
    // 移除其他可能的標記
    jsonText = jsonText.replace(/^```\s*\n?/i, '').replace(/\n?```\s*$/i, '')
    console.log('✅ 格式清理完成')
    console.log('🧹 清理後內容:', jsonText)

    let extractedData
    try {
      console.log('🔍 開始解析 JSON...')
      extractedData = JSON.parse(jsonText)
      console.log('✅ JSON 解析成功')
    } catch (parseError) {
      console.error('❌ JSON 解析失敗:', parseError)
      console.error('原始文字:', jsonText)
      throw createError({
        statusCode: 500,
        statusMessage: 'AI 回應格式錯誤，無法解析為 JSON'
      })
    }

    console.log('🔧 開始驗證和清理數據...')
    // 驗證和清理數據
    const cleanedData = {
      title: extractedData.title || null,
      description: extractedData.description || null,
      activity_type: extractedData.activity_type || null,
      event_start_date: extractedData.event_start_date || null,
      event_end_date: extractedData.event_end_date || null,
      event_start_time: extractedData.event_start_time || null,
      event_end_time: extractedData.event_end_time || null,
      is_multi_day: extractedData.is_multi_day || false,
      location: extractedData.location || null,
      organizer_name: extractedData.organizer_name || null,
      organizer_phone: extractedData.organizer_phone || null,
      organizer_email: extractedData.organizer_email || null,
      price: extractedData.price !== null ? Number(extractedData.price) || null : null,
      capacity: extractedData.capacity !== null ? Number(extractedData.capacity) || null : null,
      website: extractedData.website || null
    }

    console.log('✅ AI 分析完成，提取的資料:', cleanedData)
    console.log('🎉 AI 分析流程完成，準備回傳結果')

    return {
      success: true,
      data: cleanedData,
      message: 'AI 分析完成'
    }

  } catch (error: any) {
    console.error('💥 AI 分析過程發生錯誤:', error)
    console.error('💥 錯誤詳細:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    })
    
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || error.message || 'AI 分析失敗'
    })
  }
})