/**
 * Fix ausfluege_fotos URLs - Remove uploads/ prefix
 * 
 * Usage: node scripts/fix-image-urls.mjs
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://iopejcjkmuievlaclecn.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const BUCKET_NAME = 'ausfluege-images';
const STORAGE_BASE_URL = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}`;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function fixImageUrls() {
    console.log('[Fix] Starting URL fix for ausfluege_fotos...');
    console.log(`[Fix] New base URL: ${STORAGE_BASE_URL}`);

    const { data: photos, error: fetchError } = await supabase
        .from('ausfluege_fotos')
        .select('id, path, full_url');

    if (fetchError) {
        console.error('[Fix] Error fetching photos:', fetchError.message);
        return;
    }

    console.log(`[Fix] Found ${photos?.length || 0} photos to fix`);

    let updateCount = 0;

    for (const photo of photos || []) {
        // Get just the filename, removing any path prefixes
        let fileName = photo.path;

        // Remove "uploads/" prefix if present
        if (fileName.startsWith('uploads/')) {
            fileName = fileName.replace('uploads/', '');
        }

        // Remove any leading slashes
        if (fileName.startsWith('/')) {
            fileName = fileName.substring(1);
        }

        // Build new URL - files are directly in bucket root
        const newUrl = `${STORAGE_BASE_URL}/${fileName}`;

        const { error: updateError } = await supabase
            .from('ausfluege_fotos')
            .update({ full_url: newUrl })
            .eq('id', photo.id);

        if (!updateError) {
            updateCount++;
        }
    }

    console.log('[Fix] ✅ Fix complete!');
    console.log(`[Fix] Updated: ${updateCount} photos`);

    // Show sample URLs
    console.log('\n[Fix] Sample fixed URLs:');
    const { data: samples } = await supabase
        .from('ausfluege_fotos')
        .select('ausflug_id, full_url')
        .limit(3);

    samples?.forEach(s => {
        console.log(`  - Ausflug ${s.ausflug_id}: ${s.full_url}`);
    });

    console.log('\n[Fix] Test one of these URLs in your browser!');
}

fixImageUrls().catch(console.error);
