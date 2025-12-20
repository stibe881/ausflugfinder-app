import mysql from 'mysql2/promise';
import postgres from 'postgres';

// Original Webapp MySQL connection
const mysqlConfig = {
  host: '185.178.193.60',
  port: 3306,
  user: 'master',
  password: '!LeliBist.1561!',
  database: 'ausflugfinder' // Assuming database name, will check available databases
};

// Supabase PostgreSQL connection
const supabaseUrl = process.env.SUPABASE_DATABASE_URL;

async function migrateData() {
  console.log('[Migration] Starting data migration from Webapp MySQL to Supabase...');
  
  let mysqlConn;
  let pgClient;
  
  try {
    // Connect to MySQL
    console.log('[Migration] Connecting to Webapp MySQL...');
    try {
      mysqlConn = await mysql.createConnection(mysqlConfig);
      console.log('[Migration] Connected to MySQL');
    } catch (error) {
      // Try without database name first
      console.log('[Migration] Trying to connect without database name...');
      const { database, ...configWithoutDb } = mysqlConfig;
      mysqlConn = await mysql.createConnection(configWithoutDb);
      console.log('[Migration] Connected to MySQL');
      
      // List available databases
      const [databases] = await mysqlConn.execute('SHOW DATABASES');
      console.log('[Migration] Available databases:', databases.map(d => d.Database));
      
      // Try to use ausflugfinder database
      await mysqlConn.execute('USE ausflugfinder');
      console.log('[Migration] Using database: ausflugfinder');
    }
    
    // Connect to PostgreSQL
    console.log('[Migration] Connecting to Supabase PostgreSQL...');
    pgClient = postgres(supabaseUrl);
    console.log('[Migration] Connected to Supabase');
    
    // Check which tables exist in MySQL
    console.log('[Migration] Checking available tables in MySQL...');
    const [tables] = await mysqlConn.execute('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);
    console.log('[Migration] Available tables:', tableNames);
    
    // Determine which table contains the ausflüge data
    let sourceTable = null;
    if (tableNames.includes('ausfluege')) {
      sourceTable = 'ausfluege';
    } else if (tableNames.includes('trips')) {
      sourceTable = 'trips';
    } else if (tableNames.includes('destinations')) {
      sourceTable = 'destinations';
    } else {
      console.error('[Migration] No suitable table found. Available tables:', tableNames);
      return;
    }
    
    console.log(`[Migration] Using source table: ${sourceTable}`);
    
    // Get all records from source table
    console.log(`[Migration] Fetching data from ${sourceTable}...`);
    const [records] = await mysqlConn.execute(`SELECT * FROM ${sourceTable}`);
    console.log(`[Migration] Found ${records.length} records in MySQL`);
    
    if (records.length === 0) {
      console.log('[Migration] No records to migrate');
      return;
    }
    
    // Show first record structure
    console.log('[Migration] Sample record structure:', Object.keys(records[0]));
    
    // Clear existing data in Supabase ausfluege table
    console.log('[Migration] Clearing existing ausfluege in Supabase...');
    await pgClient`DELETE FROM ausfluege`;
    
    // Insert records into Supabase ausfluege table
    console.log('[Migration] Inserting records into Supabase...');
    let successCount = 0;
    let errorCount = 0;
    
    for (const record of records) {
      try {
        // Map MySQL fields to Supabase ausfluege table
        await pgClient`
          INSERT INTO ausfluege (
            user_id, name, beschreibung, adresse, land, region,
            kategorie_alt, parkplatz, parkplatz_kostenlos, kosten_stufe,
            jahreszeiten, website_url, lat, lng, created_at
          ) VALUES (
            ${record.userId || record.user_id || null},
            ${record.name || record.title || record.destination || 'Unbekannt'},
            ${record.beschreibung || record.description || null},
            ${record.adresse || record.address || record.destination || 'Unbekannt'},
            ${record.land || 'Schweiz'},
            ${record.region || null},
            ${record.kategorieAlt || record.kategorie_alt || record.category || null},
            ${record.parkplatz || null},
            ${record.parkplatzKostenlos || record.parkplatz_kostenlos || false},
            ${record.kostenStufe || record.kosten_stufe || record.cost || null},
            ${record.jahreszeiten || null},
            ${record.websiteUrl || record.website_url || record.websiteUrl || null},
            ${record.lat || record.latitude || null},
            ${record.lng || record.longitude || null},
            ${record.createdAt || record.created_at || new Date()}
          )
        `;
        successCount++;
        if (successCount % 10 === 0) {
          console.log(`[Migration] Migrated ${successCount}/${records.length} records...`);
        }
      } catch (error) {
        console.error(`[Migration] Error migrating record ${record.id}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`[Migration] ✅ Migration complete!`);
    console.log(`[Migration] Success: ${successCount} records`);
    console.log(`[Migration] Errors: ${errorCount} records`);
    
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
