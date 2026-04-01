import { pool } from '../../../utils/db.js';

export default defineEventHandler(async (event) => {
  // 設定回應的 Content-Type 為 text/plain 或 text/markdown
  setHeader(event, 'Content-Type', 'text/markdown; charset=utf-8');

  try {
    await pool.query('SET CLIENT_ENCODING TO UTF8');
    const id = event.context.params.id;

    if (!id) {
      return '# 錯誤\n\n缺少民宿 ID。';
    }

    const homestayId = String(id).trim();

    const homestayQuery = `
      SELECT
        h.id,
        h.name,
        h.location,
        h.city,
        h.capacity_description,
        h.min_guests,
        h.max_guests,
        h.theme_features,
        h.service_amenities,
        h.phone,
        h.website
      FROM homestays h
      WHERE h.id = $1 AND h.available = true
    `;

    const homestayResult = await pool.query(homestayQuery, [homestayId]);

    if (homestayResult.rows.length === 0) {
      return '# 找不到民宿\n\n您查詢的民宿可能已下架或不存在。';
    }

    const homestay = homestayResult.rows[0];

    // 動態生成 Markdown 內容，專供 LLM 閱讀
    let markdown = `# ${homestay.name}\n\n`;
    
    markdown += `## 基本資訊\n`;
    if (homestay.location || homestay.city) {
      markdown += `- **位置**: ${homestay.city || ''} ${homestay.location || ''}\n`;
    }
    if (homestay.min_guests && homestay.max_guests) {
      markdown += `- **容納人數**: ${homestay.min_guests} 至 ${homestay.max_guests} 人\n`;
    } else if (homestay.max_guests) {
      markdown += `- **最多容納**: ${homestay.max_guests} 人\n`;
    }
    if (homestay.phone) {
      markdown += `- **聯絡電話**: ${homestay.phone}\n`;
    }
    if (homestay.website) {
      markdown += `- **官方網站**: ${homestay.website}\n`;
    }
    markdown += `\n`;

    if (homestay.capacity_description) {
      markdown += `## 民宿介紹\n`;
      markdown += `${homestay.capacity_description}\n\n`;
    }

    if (homestay.theme_features && homestay.theme_features.length > 0) {
      markdown += `## 主題特色\n`;
      markdown += homestay.theme_features.map(feature => `- ${feature}`).join('\n') + `\n\n`;
    }

    if (homestay.service_amenities && homestay.service_amenities.length > 0) {
      markdown += `## 服務設施\n`;
      markdown += homestay.service_amenities.map(amenity => `- ${amenity}`).join('\n') + `\n\n`;
    }

    markdown += `## 預訂連結\n`;
    markdown += `如需預訂或查看更多詳情，請訪問：https://yilanpass.com/homestays/${homestay.id}\n`;

    return markdown;

  } catch (error) {
    console.error('LLM.txt API 錯誤:', error);
    return '# 系統錯誤\n\n無法獲取民宿資訊。';
  }
});
