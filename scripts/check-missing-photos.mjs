/**
 * Check which Ausflüge are missing photos
 * 
 * Usage: node scripts/check-missing-photos.mjs
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkMissingPhotos() {
    console.log('[Check] Checking for Ausflüge without photos...\n');

    // Get all ausfluege
    const { data: ausfluege, error: ausfluegeError } = await supabase
        .from('ausfluege')
        .select('id, name')
        .order('id', { ascending: true });

    if (ausfluegeError) {
        console.error('[Check] Error fetching ausfluege:', ausfluegeError.message);
        return;
    }

    // Get all photos
    const { data: fotos, error: fotosError } = await supabase
        .from('ausfluege_fotos')
        .select('ausflug_id');

    if (fotosError) {
        console.error('[Check] Error fetching fotos:', fotosError.message);
        return;
    }

    // Create set of ausflug IDs that have photos
    const ausfluegeWithPhotos = new Set(fotos?.map(f => f.ausflug_id) || []);

    console.log(`[Check] Total Ausflüge: ${ausfluege?.length || 0}`);
    console.log(`[Check] Ausflüge with photos: ${ausfluegeWithPhotos.size}`);
    console.log(`[Check] Ausflüge without photos: ${(ausfluege?.length || 0) - ausfluegeWithPhotos.size}\n`);

    // List ausflüge without photos
    console.log('[Check] Ausflüge WITHOUT photos:');
    console.log('=========================================');

    const missing = [];
    for (const ausflug of ausfluege || []) {
        if (!ausfluegeWithPhotos.has(ausflug.id)) {
            console.log(`  ID ${ausflug.id}: ${ausflug.name}`);
            missing.push(ausflug);
        }
    }

    console.log('\n=========================================');
    console.log(`[Check] Total missing: ${missing.length} Ausflüge\n`);

    // Also check what's in Storage
    console.log('[Check] Checking Storage bucket...');
    const { data: files, error: storageError } = await supabase.storage
        .from('ausfluege-images')
        .list('', { limit: 100 });

    if (storageError) {
        console.log('[Check] Could not list storage files:', storageError.message);
    } else {
        console.log(`[Check] Files in Storage: ${files?.length || 0}`);

        // Show sample filenames
        console.log('\n[Check] Sample files in Storage:');
        files?.slice(0, 5).forEach(f => {
            console.log(`  - ${f.name}`);
        });
    }
}

checkMissingPhotos().catch(console.error);
