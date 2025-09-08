#!/usr/bin/env node

/**
 * SEO 配置測試腳本
 * 用於驗證網站的 SEO 基礎設定是否正確
 */

const https = require('https');
const http = require('http');

const SITE_URL = 'https://yilanpass.com';

// 顏色輸出
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 測試 URL 是否可訪問
function testUrl(url) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    
    client.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    }).on('error', (err) => {
      resolve({
        error: err.message
      });
    });
  });
}

// 主要測試函數
async function runTests() {
  log('🔍 開始 SEO 配置測試...', 'blue');
  log('='.repeat(50), 'blue');
  
  // 測試項目
  const tests = [
    {
      name: '主頁面訪問',
      url: SITE_URL,
      check: (result) => result.statusCode === 200
    },
    {
      name: 'Sitemap.xml',
      url: `${SITE_URL}/sitemap.xml`,
      check: (result) => result.statusCode === 200 && result.data.includes('<?xml')
    },
    {
      name: 'Robots.txt',
      url: `${SITE_URL}/robots.txt`,
      check: (result) => result.statusCode === 200 && result.data.includes('User-agent')
    },
    {
      name: '民宿列表頁面',
      url: `${SITE_URL}/homestay-list`,
      check: (result) => result.statusCode === 200
    }
  ];
  
  // 執行測試
  for (const test of tests) {
    process.stdout.write(`測試 ${test.name}... `);
    
    try {
      const result = await testUrl(test.url);
      
      if (result.error) {
        log(`❌ 錯誤: ${result.error}`, 'red');
      } else if (test.check(result)) {
        log(`✅ 通過 (${result.statusCode})`, 'green');
      } else {
        log(`⚠️  異常 (${result.statusCode})`, 'yellow');
      }
    } catch (error) {
      log(`❌ 測試失敗: ${error.message}`, 'red');
    }
  }
  
  log('\n📋 建議檢查項目:', 'blue');
  log('1. 確認網站已部署到生產環境', 'yellow');
  log('2. 在 Google Search Console 重新提交 sitemap', 'yellow');
  log('3. 使用「要求編入索引」功能提交主要頁面', 'yellow');
  log('4. 檢查網站的 SSL 憑證狀態', 'yellow');
  log('5. 測試頁面載入速度和行動裝置友善性', 'yellow');
}

// 執行測試
runTests().catch(console.error);
