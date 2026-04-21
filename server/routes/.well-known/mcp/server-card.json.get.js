/**
 * GET /.well-known/mcp/server-card.json
 * MCP Server Card (SEP-1649 / SEP-2127) for agent discovery
 */
export default defineEventHandler((event) => {
  setResponseHeader(event, 'Content-Type', 'application/json')
  setResponseHeader(event, 'Access-Control-Allow-Origin', '*')
  setResponseHeader(event, 'Cache-Control', 'public, max-age=86400')

  return {
    $schema: 'https://modelcontextprotocol.io/schemas/server-card/1.0.0',
    serverInfo: {
      name: '宜蘭旅遊通 MCP Server',
      version: '1.0.0',
      description: '宜蘭地區合法民宿搜尋與資訊查詢服務，提供 AI 代理存取民宿列表、詳細資訊及優惠券資訊。',
      homepage: 'https://yilanpass.com',
      logo: 'https://yilanpass.com/logo.png',
    },
    transport: {
      type: 'http',
      // MCP over HTTP (Streamable HTTP transport)
      // 目前提供 REST-like 端點，未來可升級至完整 MCP 協議
      endpoint: 'https://yilanpass.com/api',
    },
    capabilities: {
      tools: true,
      resources: true,
      prompts: false,
      sampling: false,
    },
    tools: [
      {
        name: 'search_homestays',
        description: '依條件（地區、特色、人數、日期）搜尋宜蘭合法民宿列表',
        inputSchema: {
          type: 'object',
          properties: {
            area: {
              type: 'string',
              description: '宜蘭地區，例如：宜蘭市、羅東鎮、礁溪鄉、冬山鄉',
            },
            features: {
              type: 'array',
              items: { type: 'string' },
              description: '特色篩選，例如：["親子", "寵物", "海景", "包棟", "戲水池"]',
            },
            capacity: {
              type: 'integer',
              description: '入住人數',
            },
            checkIn: {
              type: 'string',
              description: '入住日期，格式 YYYY-MM-DD',
            },
            checkOut: {
              type: 'string',
              description: '退房日期，格式 YYYY-MM-DD',
            },
          },
        },
        endpoint: 'https://yilanpass.com/api/fetchBnbs',
      },
      {
        name: 'get_homestay_detail',
        description: '取得特定民宿的詳細資訊，包含房型、價格、設施、圖片、位置',
        inputSchema: {
          type: 'object',
          required: ['id'],
          properties: {
            id: {
              type: 'string',
              description: '民宿 ID',
            },
          },
        },
        endpoint: 'https://yilanpass.com/api/fetchBnbDetail',
      },
      {
        name: 'get_articles',
        description: '取得宜蘭旅遊文章列表，包含景點推薦、美食、活動資訊',
        inputSchema: {
          type: 'object',
          properties: {
            category: {
              type: 'string',
              description: '文章分類',
            },
            limit: {
              type: 'integer',
              description: '回傳筆數，預設 10',
            },
          },
        },
        endpoint: 'https://yilanpass.com/api/articles',
      },
    ],
  }
})
