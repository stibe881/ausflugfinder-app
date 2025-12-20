import mysql from 'mysql2/promise';
import postgres from 'postgres';

// MySQL connection (TiDB Cloud)
const mysqlConfig = {
  host: 'gateway02.us-east-1.prod.aws.tidbcloud.com',
  port: 4000,
  user: '39nB9MMxm8dKKgZ.4569459278e8',
  password: '2rCLIdJN2t6bj0W4UFb3',
  database: 'fEUDbtjH5ohSpNbohx5Qrr',
  ssl: { rejectUnauthorized: true }
};

// Supabase PostgreSQL connection
const supabaseUrl = process.env.SUPABASE_DATABASE_URL;

async function migrateData() {
  console.log('[Migration] Starting data migration from MySQL to Supabase...');
  
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
    
    // Check which tables exist in MySQL
    console.log('[Migration] Checking available tables in MySQL...');
    const [tables] = await mysqlConn.execute('SHOW TABLES');
    console.log('[Migration] Available tables:', tables.map(t => Object.values(t)[0]));
    
    // Get all ausfluege from MySQL
    console.log('[Migration] Fetching ausfluege from MySQL...');
    const [ausfluege] = await mysqlConn.execute('SELECT * FROM ausfluege');
    console.log(`[Migration] Found ${ausfluege.length} ausfluege in MySQL`);
    
    if (ausfluege.length === 0) {
      console.log('[Migration] No ausfluege to migrate');
      return;
    }
    
    // Clear existing ausfluege in Supabase
    console.log('[Migration] Clearing existing ausfluege in Supabase...');
    await pgClient`DELETE FROM ausfluege`;
    
    // Insert ausfluege into Supabase
    console.log('[Migration] Inserting ausfluege into Supabase...');
    let successCount = 0;
    let errorCount = 0;
    
    for (const ausflug of ausfluege) {
      try {
        await pgClient`
          INSERT INTO ausfluege (
            id, user_id, name, beschreibung, adresse, land, region,
            kategorie_alt, parkplatz, parkplatz_kostenlos, kosten_stufe,
            jahreszeiten, website_url, lat, lng, created_at
          ) VALUES (
            ${ausflug.id},
            ${ausflug.userId || ausflug.user_id || null},
            ${ausflug.name},
            ${ausflug.beschreibung || null},
            ${ausflug.adresse},
            ${ausflug.land || 'Schweiz'},
            ${ausflug.region || null},
            ${ausflug.kategorieAlt || ausflug.kategorie_alt || null},
            ${ausflug.parkplatz || null},
            ${ausflug.parkplatzKostenlos || ausflug.parkplatz_kostenlos || false},
            ${ausflug.kostenStufe || ausflug.kosten_stufe || null},
            ${ausflug.jahreszeiten || null},
            ${ausflug.websiteUrl || ausflug.website_url || null},
            ${ausflug.lat || null},
            ${ausflug.lng || null},
            ${ausflug.createdAt || ausflug.created_at || new Date()}
          )
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            beschreibung = EXCLUDED.beschreibung,
            adresse = EXCLUDED.adresse,
            region = EXCLUDED.region
        `;
        successCount++;
        if (successCount % 10 === 0) {
          console.log(`[Migration] Migrated ${successCount}/${ausfluege.length} ausfluege...`);
        }
      } catch (error) {
        console.error(`[Migration] Error migrating ausflug ${ausflug.id}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`[Migration] ✅ Migration complete!`);
    console.log(`[Migration] Success: ${successCount} ausfluege`);
    console.log(`[Migration] Errors: ${errorCount} ausfluege`);
    
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

migrateData().catch(console.error);
