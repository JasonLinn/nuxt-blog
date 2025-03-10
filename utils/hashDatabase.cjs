const { Pool } = require('pg');
const dotenv = require('dotenv');

// 加載環境變量
dotenv.config();

class HashDatabase {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
  }

  // 初始化 hash 列表
  async initializeHashList(hashList) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      // 檢查表是否存在，如果不存在則創建
      await client.query(`
        CREATE TABLE IF NOT EXISTS available_hash (
          id SERIAL PRIMARY KEY,
          index_number VARCHAR(8) NOT NULL UNIQUE,
          hash_value VARCHAR(255) NOT NULL UNIQUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      await client.query(`
        CREATE TABLE IF NOT EXISTS used_hash (
          id SERIAL PRIMARY KEY,
          index_number VARCHAR(8) NOT NULL,
          hash_value VARCHAR(255) NOT NULL,
          article_id VARCHAR(255) NOT NULL,
          used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // 檢查是否已有數據
      const result = await client.query('SELECT COUNT(*) FROM available_hash');
      if (parseInt(result.rows[0].count) === 0) {
        // 插入新數據
        for (const item of hashList) {
          await client.query(
            'INSERT INTO available_hash (index_number, hash_value) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [item.index, item.hash]
          );
        }
      }
      
      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('初始化 hash 列表失敗:', error);
      return false;
    } finally {
      client.release();
    }
  }

  // 獲取一個可用的 hash
  async getAvailableHash() {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      // 獲取第一個可用的 hash
      const result = await client.query(`
        SELECT id, index_number, hash_value 
        FROM available_hash 
        LIMIT 1
        FOR UPDATE
      `);

      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return null;
      }

      const hash = result.rows[0];
      
      // 從可用列表中刪除
      await client.query(
        'DELETE FROM available_hash WHERE id = $1',
        [hash.id]
      );
      
      await client.query('COMMIT');
      
      return {
        id: hash.id,
        index: hash.index_number,
        hash: hash.hash_value
      };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('獲取 hash 失敗:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // 記錄 hash 使用情況
  async recordHashUsage(index, hash, articleId) {
    const client = await this.pool.connect();
    try {
      await client.query(
        'INSERT INTO used_hash (index_number, hash_value, article_id) VALUES ($1, $2, $3)',
        [index, hash, articleId]
      );
      return true;
    } catch (error) {
      console.error('記錄 hash 使用失敗:', error);
      return false;
    } finally {
      client.release();
    }
  }

  // 檢查 hash 是否已被使用
  async isHashUsed(hashValue) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT COUNT(*) FROM used_hash WHERE hash_value = $1',
        [hashValue]
      );
      return parseInt(result.rows[0].count) > 0;
    } catch (error) {
      console.error('檢查 hash 使用狀態失敗:', error);
      return false;
    } finally {
      client.release();
    }
  }
}

module.exports = { hashDatabase: new HashDatabase() }; 