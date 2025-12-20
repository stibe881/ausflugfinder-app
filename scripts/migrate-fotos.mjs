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

// Base URL for images
const IMAGE_BASE_URL = 'https://ausflugmanager.ch/';

async function migrateFotos() {
  console.log('[Migration] Starting fotos migration from MySQL to Supabase...');
  
  let mysqlConn;
  let pgClient;
  
  try {
    // Connect to MySQL
    console.log('[Migration] Connecting to MySQL...');
    mysqlConn = await mysql.createConnection(mysqlConfig);
    console.log('[Migration] Connected to MySQL');
    
    // Connect to PostgreSQL
    console.log('[Migration] Connecting to Supabase PostgreSQL...');
    pgClient = postgres(supabaseUrl);
    console.log('[Migration] Connected to Supabase');
    
    // Get all fotos from MySQL
    console.log('[Migration] Fetching fotos from MySQL...');
    const [fotos] = await mysqlConn.execute('SELECT * FROM fotos');
    console.log(`[Migration] Found ${fotos.length} fotos in MySQL`);
    
    if (fotos.length === 0) {
      console.log('[Migration] No fotos to migrate');
      return;
    }
    
    // Check if ausfluege_fotos table exists in Supabase
    console.log('[Migration] Checking if ausfluege_fotos table exists...');
    try {
      await pgClient`SELECT 1 FROM ausfluege_fotos LIMIT 1`;
      console.log('[Migration] Table ausfluege_fotos exists');
    } catch (error) {
      console.log('[Migration] Creating ausfluege_fotos table...');
      await pgClient`
        CREATE TABLE IF NOT EXISTS ausfluege_fotos (
          id SERIAL PRIMARY KEY,
          ausflug_id INTEGER NOT NULL,
          user_id INTEGER,
          path TEXT NOT NULL,
          full_url TEXT NOT NULL,
          is_primary BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `;
      console.log('[Migration] Table created');
    }
    
    // Clear existing fotos in Supabase
    console.log('[Migration] Clearing existing fotos in Supabase...');
    await pgClient`DELETE FROM ausfluege_fotos`;
    
    // Insert fotos into Supabase
    console.log('[Migration] Inserting fotos into Supabase...');
    let successCount = 0;
    let errorCount = 0;
    
    for (const foto of fotos) {
      try {
        // Build full URL
        const fullUrl = IMAGE_BASE_URL + foto.path;
        
        await pgClient`
          INSERT INTO ausfluege_fotos (
            ausflug_id, user_id, path, full_url, is_primary, created_at
          ) VALUES (
            ${foto.ausflug_id},
            ${foto.user_id || null},
            ${foto.path},
            ${fullUrl},
            ${foto.is_primary === 1},
            ${foto.created_at || new Date()}
          )
        `;
        successCount++;
        if (successCount % 20 === 0) {
          console.log(`[Migration] Migrated ${successCount}/${fotos.length} fotos...`);
        }
      } catch (error) {
        console.error(`[Migration] Error migrating foto ${foto.id}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`[Migration] ✅ Migration complete!`);
    console.log(`[Migration] Success: ${successCount} fotos`);
    console.log(`[Migration] Errors: ${errorCount} fotos`);
    
    // Show primary photos per ausflug
    console.log('[Migration] Primary photos per ausflug:');
    const primaryPhotos = await pgClient`
      SELECT ausflug_id, full_url 
      FROM ausfluege_fotos 
      WHERE is_primary = true 
      ORDER BY ausflug_id
    `;
    primaryPhotos.forEach(photo => {
      console.log(`  - Ausflug ${photo.ausflug_id}: ${photo.full_url}`);
    });
    
  } catch (error) {
    console.error('[Migration] Fatal error:', error);
    throw error;
  } finally {
    if (mysqlConn) {
      await mysqlConn.end();
      console.log('[Migration] MySQL connection closed');
    }
    if (pgClient) {
      await pgClient.end();
      console.log('[Migration] PostgreSQL connection closed');
    }
  }
}

migrateFotos().catch(console.error);
