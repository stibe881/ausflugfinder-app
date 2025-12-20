import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase configuration
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const IMAGES_DIR = path.join(__dirname, '../temp_images');
const BUCKET_NAME = 'ausflug-images';

async function uploadImages() {
  console.log('[Upload] Starting image upload to Supabase Storage...');
  console.log('[Upload] Supabase URL:', supabaseUrl);
  console.log('[Upload] Images directory:', IMAGES_DIR);
  
  try {
    // Check if bucket exists, create if not
    console.log('[Upload] Checking if bucket exists...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('[Upload] Error listing buckets:', bucketsError);
      throw bucketsError;
    }
    
    const bucketExists = buckets.some(b => b.name === BUCKET_NAME);
    
    if (!bucketExists) {
      console.log('[Upload] Creating bucket...');
      const { data, error } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: 10485760, // 10MB
      });
      
      if (error) {
        console.error('[Upload] Error creating bucket:', error);
        throw error;
      }
      console.log('[Upload] Bucket created successfully');
    } else {
      console.log('[Upload] Bucket already exists');
    }
    
    // Get all image files
    const files = fs.readdirSync(IMAGES_DIR);
    console.log(`[Upload] Found ${files.length} files to upload`);
    
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    for (const filename of files) {
      const filePath = path.join(IMAGES_DIR, filename);
      const stats = fs.statSync(filePath);
      
      if (!stats.isFile()) {
        skippedCount++;
        continue;
      }
      
      try {
        // Read file
        const fileBuffer = fs.readFileSync(filePath);
        
        // Determine content type
        const ext = path.extname(filename).toLowerCase();
        const contentType = {
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.png': 'image/png',
          '.webp': 'image/webp',
        }[ext] || 'application/octet-stream';
        
        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(filename, fileBuffer, {
            contentType,
            upsert: true,
          });
        
        if (error) {
          console.error(`[Upload] Error uploading ${filename}:`, error.message);
          errorCount++;
        } else {
          successCount++;
          if (successCount % 50 === 0) {
            console.log(`[Upload] Uploaded ${successCount}/${files.length} files...`);
          }
        }
      } catch (error) {
        console.error(`[Upload] Error processing ${filename}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('[Upload] ✅ Upload complete!');
    console.log(`[Upload] Success: ${successCount} files`);
    console.log(`[Upload] Errors: ${errorCount} files`);
    console.log(`[Upload] Skipped: ${skippedCount} files`);
    
    // Get public URL for first image as example
    if (files.length > 0) {
      const { data } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(files[0]);
      console.log('[Upload] Example public URL:', data.publicUrl);
    }
    
  } catch (error) {
    console.error('[Upload] Fatal error:', error);
    throw error;
  }
}

uploadImages().catch(console.error);
