const { Pool, neonConfig } = require('@neondatabase/serverless')
const fs = require('fs')
const path = require('path')
const ws = require('ws')

// WebSocket Configuration for Neon serverless
if (typeof window === 'undefined') {
    neonConfig.webSocketConstructor = ws
}

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_DSt86GUynwli@ep-fancy-snow-a8232ddc-pooler.eastus2.azure.neon.tech/neondb?sslmode=require'
const pool = new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
})

async function runReferralsMigration() {
    try {
        console.log('🔄 Starting referrals table migration...')

        // Test connection
        console.log('📡 Testing database connection...')
        await pool.query('SELECT 1')
        console.log('✅ Database connected')

        // Create Table
        console.log('📄 Creating referrals table if not exists...')
        await pool.query(`
      CREATE TABLE IF NOT EXISTS referrals (
        code VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `)
        console.log('✅ Table verified')

        // Read existing codes from utils/referral.js
        console.log('📖 Reading static referral codes from utils/referral.js...')
        const content = fs.readFileSync(path.join(__dirname, '../utils/referral.js'), 'utf8')
        const match = content.match(/export const referral = ([\s\S]*)/)

        if (!match || !match[1]) {
            throw new Error("Could not parse utils/referral.js")
        }

        let arrayString = match[1].trim()
        if (arrayString.endsWith(';')) arrayString = arrayString.slice(0, -1)

        // Safe parse via eval-like Function since they might not be perfect JSON
        const parse = new Function(`return ${arrayString}`)
        const referralData = parse()

        console.log(`📊 Found ${referralData.length} referral codes. Inserting...`)

        // Insert data within a transaction
        const client = await pool.connect()
        try {
            await client.query('BEGIN')

            let inserted = 0
            for (const item of referralData) {
                if (!item.code || !item.name) continue

                await client.query(`
          INSERT INTO referrals (code, name) 
          VALUES ($1, $2)
          ON CONFLICT (code) DO UPDATE 
          SET name = EXCLUDED.name, updated_at = CURRENT_TIMESTAMP
        `, [item.code, item.name])

                inserted++
            }

            await client.query('COMMIT')
            console.log(`✅ Successfully migrated ${inserted} valid referral codes into Neon DB.`)

        } catch (err) {
            await client.query('ROLLBACK')
            throw err
        } finally {
            client.release()
        }

        // Check results
        const countResult = await pool.query('SELECT COUNT(*) FROM referrals')
        console.log(`\n🎉 Migration complete! Total records in DB: ${countResult.rows[0].count}`)

    } catch (error) {
        console.error('❌ Migration failed:', error.message)
        process.exit(1)
    } finally {
        await pool.end()
    }
}

// Execute migration
runReferralsMigration()
