import { supabase } from './supabase';

// ============================================================================
// FILE UPLOAD HELPERS
// ============================================================================

export interface FileUploadResult {
    success: boolean;
    filePath?: string;
    error?: string;
}

/**
 * Upload a file to Supabase Storage
 * @param planId - Plan ID (used for folder organization)
 * @param file - File object (from DocumentPicker or ImagePicker)
 * @param type - 'ticket' or 'booking'
 * @param itemId - Ticket or booking ID
 * @returns File path in storage if successful
 */
export async function uploadFile(
    planId: string,
    file: { uri: string; name: string; type?: string },
    type: 'ticket' | 'booking',
    itemId: string
): Promise<FileUploadResult> {
    try {
        // Fetch file from URI
        const response = await fetch(file.uri);
        const blob = await response.blob();

        // Generate file path: {planId}/{type}s/{itemId}_{filename}
        const filePath = `${planId}/${type}s/${itemId}_${file.name}`;

        // Upload to storage
        const { data, error } = await supabase.storage
            .from('trip-documents')
            .upload(filePath, blob, {
                contentType: file.type || 'application/octet-stream',
                upsert: true, // Overwrite if exists
            });

        if (error) {
            console.error('[uploadFile] Error:', error);
            return { success: false, error: error.message };
        }

        return { success: true, filePath: data.path };
    } catch (error) {
        console.error('[uploadFile] Exception:', error);
        return { success: false, error: String(error) };
    }
}

/**
 * Get public URL for a file in storage
 * @param filePath - File path in storage
 * @returns Public URL
 */
export function getFileUrl(filePath: string): string {
    const { data } = supabase.storage
        .from('trip-documents')
        .getPublicUrl(filePath);

    return data.publicUrl;
}

/**
 * Delete a file from storage
 * @param filePath - File path to delete
 * @returns Success status
 */
export async function deleteFile(filePath: string): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase.storage
            .from('trip-documents')
            .remove([filePath]);

        if (error) {
            console.error('[deleteFile] Error:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error) {
        console.error('[deleteFile] Exception:', error);
        return { success: false, error: String(error) };
    }
}

/**
 * Download a file from storage
 * @param filePath - File path in storage
 * @returns File blob if successful
 */
export async function downloadFile(filePath: string): Promise<{ success: boolean; blob?: Blob; error?: string }> {
    try {
        const { data, error } = await supabase.storage
            .from('trip-documents')
            .download(filePath);

        if (error) {
            console.error('[downloadFile] Error:', error);
            return { success: false, error: error.message };
        }

        return { success: true, blob: data };
    } catch (error) {
        console.error('[downloadFile] Exception:', error);
        return { success: false, error: String(error) };
    }
}
