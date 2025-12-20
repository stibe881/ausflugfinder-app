/**
 * Upload Images to Supabase Storage
 * 
 * This script uploads images from a local folder to Supabase Storage
 * and updates the ausfluege_fotos table with the new URLs.
 * 
 * Usage:
 * 1. Extract your ZIP file to a folder (e.g., ./uploads)
 * 2. Run: node scripts/upload-images.mjs ./uploads
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Supabase configuration
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://iopejcjkmuievlaclecn.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

// Storage bucket name - create this in Supabase Dashboard first!
const BUCKET_NAME = 'ausfluege-images';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function uploadImages(sourceFolder) {
    console.log('[Upload] Starting image upload to Supabase Storage...');
    console.log(`[Upload] Source folder: ${sourceFolder}`);

    // Check if source folder exists
    if (!fs.existsSync(sourceFolder)) {
        console.error(`[Upload] Source folder not found: ${sourceFolder}`);
        console.log('[Upload] Please extract your ZIP file first and provide the path.');
        process.exit(1);
    }

    // Create bucket if it doesn't exist (requires admin privileges)
    console.log(`[Upload] Checking bucket: ${BUCKET_NAME}`);
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === BUCKET_NAME);

    if (!bucketExists) {
        console.log(`[Upload] Creating bucket: ${BUCKET_NAME}`);
        const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
            public: true, // Make images publicly accessible
        });
        if (error) {
            console.error('[Upload] Error creating bucket:', error.message);
            console.log('[Upload] Please create the bucket manually in Supabase Dashboard:');
            console.log(`         Storage -> New Bucket -> Name: ${BUCKET_NAME} -> Public: Yes`);
        }
    }

    // Get all image files recursively
    function getImageFiles(dir, fileList = []) {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
            const filePath = path.join(dir, file);
            if (fs.statSync(filePath).isDirectory()) {
                getImageFiles(filePath, fileList);
            } else {
                const ext = path.extname(file).toLowerCase();
                if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
                    fileList.push(filePath);
                }
            }
        });
        return fileList;
    }

    const imageFiles = getImageFiles(sourceFolder);
    console.log(`[Upload] Found ${imageFiles.length} images to upload`);

    if (imageFiles.length === 0) {
        console.log('[Upload] No images found. Make sure your folder contains .jpg, .png, etc. files.');
        return;
    }

    let successCount = 0;
    let errorCount = 0;
    const uploadedPaths = new Map(); // old path -> new URL

    for (const filePath of imageFiles) {
        try {
            // Get relative path from source folder
            const relativePath = path.relative(sourceFolder, filePath).replace(/\\/g, '/');
            const fileName = path.basename(filePath);

            // Read file
            const fileBuffer = fs.readFileSync(filePath);
            const contentType = getContentType(filePath);

            // Upload to Supabase Storage
            const storagePath = relativePath; // Keep original folder structure
            const { data, error } = await supabase.storage
                .from(BUCKET_NAME)
                .upload(storagePath, fileBuffer, {
                    contentType,
                    upsert: true, // Overwrite if exists
                });

            if (error) {
                console.error(`[Upload] Error uploading ${relativePath}:`, error.message);
                errorCount++;
                continue;
            }

            // Get public URL
            const { data: urlData } = supabase.storage
                .from(BUCKET_NAME)
                .getPublicUrl(storagePath);

            uploadedPaths.set(relativePath, urlData.publicUrl);
            successCount++;

            if (successCount % 10 === 0) {
                console.log(`[Upload] Progress: ${successCount}/${imageFiles.length}`);
            }
        } catch (error) {
            console.error(`[Upload] Error processing ${filePath}:`, error.message);
            errorCount++;
        }
    }

    console.log(`[Upload] Upload complete!`);
    console.log(`[Upload] Success: ${successCount}, Errors: ${errorCount}`);

    // Update database with new URLs
    if (successCount > 0) {
        console.log('[Upload] Updating database with new URLs...');

        // Get all photos from database
        const { data: photos, error: fetchError } = await supabase
            .from('ausfluege_fotos')
            .select('id, path');

        if (fetchError) {
            console.error('[Upload] Error fetching photos from database:', fetchError.message);
            return;
        }

        let updateCount = 0;
        for (const photo of photos || []) {
            // Try to match with uploaded paths
            const newUrl = uploadedPaths.get(photo.path) ||
                uploadedPaths.get(`uploads/${photo.path}`) ||
                uploadedPaths.get(photo.path.replace('uploads/', ''));

            if (newUrl) {
                const { error: updateError } = await supabase
                    .from('ausfluege_fotos')
                    .update({ full_url: newUrl })
                    .eq('id', photo.id);

                if (!updateError) {
                    updateCount++;
                }
            }
        }

        console.log(`[Upload] Updated ${updateCount} database records with new URLs`);
    }
}

function getContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const types = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
    };
    return types[ext] || 'application/octet-stream';
}

// Get source folder from command line args
const sourceFolder = process.argv[2] || './uploads';

uploadImages(sourceFolder).catch(console.error);
