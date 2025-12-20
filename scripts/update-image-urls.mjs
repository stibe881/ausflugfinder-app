/**
 * Update ausfluege_fotos URLs to Supabase Storage
 * 
 * This script updates the full_url column in ausfluege_fotos table
 * to point to Supabase Storage URLs.
 * 
 * Usage: node scripts/update-image-urls.mjs
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://iopejcjkmuievlaclecn.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

// Storage bucket name
const BUCKET_NAME = 'ausfluege-images';

// New base URL for Supabase Storage
const STORAGE_BASE_URL = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}`;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function updateImageUrls() {
    console.log('[Update] Starting URL update for ausfluege_fotos...');
    console.log(`[Update] New base URL: ${STORAGE_BASE_URL}`);

    // Get all photos from database
    const { data: photos, error: fetchError } = await supabase
        .from('ausfluege_fotos')
        .select('id, path, full_url');

    if (fetchError) {
        console.error('[Update] Error fetching photos:', fetchError.message);
        return;
    }

    console.log(`[Update] Found ${photos?.length || 0} photos to update`);

    let updateCount = 0;
    let errorCount = 0;

    for (const photo of photos || []) {
        try {
            // Build new URL from path
            // The path could be like "uploads/image.jpg" or just "image.jpg"
            let imagePath = photo.path;

            // Remove leading slash if present
            if (imagePath.startsWith('/')) {
                imagePath = imagePath.substring(1);
            }

            // Build new URL
            const newUrl = `${STORAGE_BASE_URL}/${imagePath}`;

            // Update database
            const { error: updateError } = await supabase
                .from('ausfluege_fotos')
                .update({ full_url: newUrl })
                .eq('id', photo.id);

            if (updateError) {
                console.error(`[Update] Error updating photo ${photo.id}:`, updateError.message);
                errorCount++;
            } else {
                updateCount++;
                if (updateCount % 20 === 0) {
                    console.log(`[Update] Progress: ${updateCount}/${photos.length}`);
                }
            }
        } catch (error) {
            console.error(`[Update] Error processing photo ${photo.id}:`, error.message);
            errorCount++;
        }
    }

    console.log('[Update] ✅ Update complete!');
    console.log(`[Update] Success: ${updateCount}`);
    console.log(`[Update] Errors: ${errorCount}`);

    // Show sample URLs
    console.log('\n[Update] Sample updated URLs:');
    const { data: samples } = await supabase
        .from('ausfluege_fotos')
        .select('ausflug_id, full_url')
        .limit(5);

    samples?.forEach(s => {
        console.log(`  - Ausflug ${s.ausflug_id}: ${s.full_url}`);
    });
}

updateImageUrls().catch(console.error);
