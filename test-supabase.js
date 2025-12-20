const postgres = require('postgres');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:!LeliBist.1561!@db.iopejcjkmuievlaclecn.supabase.co:5432/postgres';

async function test() {
  try {
    const sql = postgres(connectionString);
    const result = await sql`SELECT version()`;
    console.log('✅ Supabase connection successful!');
    console.log('PostgreSQL version:', result[0].version);
    await sql.end();
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }
}

test();
