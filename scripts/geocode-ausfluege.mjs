import mysql from 'mysql2/promise';

// Original Webapp MySQL connection
const mysqlConfig = {
  host: '185.178.193.60',
  port: 3306,
  user: 'master',
  password: '!LeliBist.1561!',
  database: 'ausflugfinder'
};

// Free geocoding API (no API key required)
async function geocodeAddress(address) {
  try {
    const encodedAddress = encodeURIComponent(address);
    const url = `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'AusflugFinder-App/1.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }
    
    return null;
  } catch (error) {
    console.error(`Geocoding error for "${address}":`, error.message);
    return null;
  }
}

async function geocodeAusfluege() {
  console.log('[Geocoding] Starting geocoding for ausfluege...');
  
  let conn;
  
  try {
    // Connect to MySQL
    console.log('[Geocoding] Connecting to MySQL...');
    conn = await mysql.createConnection(mysqlConfig);
    console.log('[Geocoding] Connected to MySQL');
    
    // Get all ausfluege without coordinates
    const [ausfluege] = await conn.execute(
      'SELECT id, name, adresse FROM ausfluege WHERE lat IS NULL OR lng IS NULL'
    );
    
    console.log(`[Geocoding] Found ${ausfluege.length} ausfluege without coordinates`);
    
    if (ausfluege.length === 0) {
      console.log('[Geocoding] All ausfluege already have coordinates');
      return;
    }
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const ausflug of ausfluege) {
      console.log(`\n[Geocoding] Processing: ${ausflug.name}`);
      console.log(`[Geocoding] Address: ${ausflug.adresse}`);
      
      // Geocode address
      const coords = await geocodeAddress(ausflug.adresse);
      
      if (coords) {
        // Update database
        await conn.execute(
          'UPDATE ausfluege SET lat = ?, lng = ? WHERE id = ?',
          [coords.lat, coords.lng, ausflug.id]
        );
        
        console.log(`[Geocoding] ✅ Success: lat=${coords.lat}, lng=${coords.lng}`);
        successCount++;
      } else {
        console.log(`[Geocoding] ❌ Failed: Could not geocode address`);
        errorCount++;
      }
      
      // Rate limiting: wait 1 second between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`\n[Geocoding] ✅ Geocoding complete!`);
    console.log(`[Geocoding] Success: ${successCount} ausfluege`);
    console.log(`[Geocoding] Errors: ${errorCount} ausfluege`);
    
    // Show updated ausfluege
    const [updated] = await conn.execute(
      'SELECT id, name, lat, lng FROM ausfluege WHERE lat IS NOT NULL AND lng IS NOT NULL'
    );
    console.log(`\n[Geocoding] Total ausfluege with coordinates: ${updated.length}`);
    
  } catch (error) {
    console.error('[Geocoding] Fatal error:', error);
    throw error;
  } finally {
    if (conn) {
      await conn.end();
      console.log('[Geocoding] MySQL connection closed');
    }
  }
}

geocodeAusfluege().catch(console.error);
