import mysql from 'mysql2/promise';
import postgres from 'postgres';

// Original Webapp MySQL connection
const mysqlConfig = {
  host: '185.178.193.60',
  port: 3306,
  user: 'master',
  password: '!LeliBist.1561!',
  database: 'ausflugfinder'
};

// Supabase PostgreSQL connection
const supabaseUrl = process.env.SUPABASE_DATABASE_URL;

async function syncCoordsToSupabase() {
  console.log('[Sync] Starting coordinate sync from MySQL to Supabase...');
  
  let mysqlConn;
  let pgClient;
  
  try {
    // Connect to MySQL
    console.log('[Sync] Connecting to MySQL...');
    mysqlConn = await mysql.createConnection(mysqlConfig);
    console.log('[Sync] Connected to MySQL');
    
    // Connect to PostgreSQL
    console.log('[Sync] Connecting to Supabase PostgreSQL...');
    pgClient = postgres(supabaseUrl);
    console.log('[Sync] Connected to Supabase');
    
    // Get all ausfluege with coordinates from MySQL
    const [ausfluege] = await mysqlConn.execute(
      'SELECT id, name, lat, lng FROM ausfluege WHERE lat IS NOT NULL AND lng IS NOT NULL'
    );
    
    console.log(`[Sync] Found ${ausfluege.length} ausfluege with coordinates in MySQL`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const ausflug of ausfluege) {
      try {
        await pgClient`
          UPDATE ausfluege 
          SET lat = ${ausflug.lat}, lng = ${ausflug.lng}
          WHERE id = ${ausflug.id}
        `;
        
        console.log(`[Sync] ✅ Updated: ${ausflug.name} (lat=${ausflug.lat}, lng=${ausflug.lng})`);
        successCount++;
      } catch (error) {
        console.error(`[Sync] ❌ Error updating ${ausflug.name}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n[Sync] ✅ Sync complete!`);
    console.log(`[Sync] Success: ${successCount} ausfluege`);
    console.log(`[Sync] Errors: ${errorCount} ausfluege`);
    
    // Verify in Supabase
    const result = await pgClient`
      SELECT COUNT(*) as total, 
             COUNT(lat) as with_coords
      FROM ausfluege
    `;
    console.log(`\n[Sync] Supabase status:`);
    console.log(`[Sync] Total ausfluege: ${result[0].total}`);
    console.log(`[Sync] With coordinates: ${result[0].with_coords}`);
    
  } catch (error) {
    console.error('[Sync] Fatal error:', error);
    throw error;
  } finally {
    if (mysqlConn) {
      await mysqlConn.end();
      console.log('[Sync] MySQL connection closed');
    }
    if (pgClient) {
      await pgClient.end();
      console.log('[Sync] PostgreSQL connection closed');
    }
  }
}

syncCoordsToSupabase().catch(console.error);
