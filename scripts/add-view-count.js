import pg from 'pg';

const { Pool } = pg;
const couponPool = new Pool({
    connectionString: 'postgresql://nuxt-marketing_owner:ys7ZNVhOrg9c@ep-rough-voice-a1ele0z6-pooler.ap-southeast-1.aws.neon.tech/nuxt-marketing?sslmode=require&channel_binding=require',
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        const res = await couponPool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'article' AND column_name = 'view_count'
    `);

        if (res.rows.length === 0) {
            console.log('Adding view_count column...');
            await couponPool.query(`ALTER TABLE article ADD COLUMN view_count INT DEFAULT 0;`);
            console.log('Column added successfully.');
        } else {
            console.log('view_count column already exists.');
        }
    } catch (e) {
        console.error(e);
    } finally {
        await couponPool.end();
    }
}

run();
