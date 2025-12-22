// Supabase API functions for direct database access (no backend needed)
import { supabase } from "./supabase";
import * as FileSystem from 'expo-file-system/legacy';

// Note: The full file content is maintained. This snippet shows only the new additions at the end.

// ========== PUSH NOTIFICATIONS ==========

/**
 * Save or update push notification token for the current user
 */
export async function savePushToken(token: string, deviceType?: string): Promise<{ success: boolean; error?: string }> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { success: false, error: "Not authenticated" };
        }

        // Get user ID from users table
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('open_id', user.id)
            .single();

        if (userError || !userData) {
            return { success: false, error: "User not found" };
        }

        // Upsert push token
        const { error } = await supabase
            .from('push_tokens')
            .upsert({
                user_id: userData.id,
                token,
                device_type: deviceType || 'unknown',
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'token'
            });

        if (error) {
            console.error('[savePushToken] Error:', error);
            return { success: false, error: error.message };
        }

        console.log('[savePushToken] Token saved successfully');
        return { success: true };
    } catch (error: any) {
        console.error('[savePushToken] Unexpected error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get all push tokens (admin only)
 */
export async function getAllPushTokens(): Promise<{ success: boolean; tokens?: string[]; error?: string }> {
    try {
        const { data, error } = await supabase
            .from('push_tokens')
            .select('token');

        if (error) {
            console.error('[getAllPushTokens] Error:', error);
            return { success: false, error: error.message };
        }

        const tokens = data?.map(row => row.token) || [];
        return { success: true, tokens };
    } catch (error: any) {
        console.error('[getAllPushTokens] Unexpected error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Send broadcast notification to all users (admin only)
 * Uses Expo Push Notification service
 */
export async function sendBroadcastNotification(
    title: string,
    body: string
): Promise<{ success: boolean; sent?: number; error?: string }> {
    try {
        // Get all push tokens
        const { success, tokens, error } = await getAllPushTokens();
        if (!success || !tokens || tokens.length === 0) {
            return { success: false, error: error || "No tokens found" };
        }

        // Send to Expo Push Notification service
        const messages = tokens.map(token => ({
            to: token,
            sound: 'default',
            title,
            body,
            data: { type: 'broadcast' },
        }));

        const response = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(messages),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('[sendBroadcastNotification] Expo API error:', errorData);
            return { success: false, error: 'Failed to send notifications' };
        }

        console.log(`[sendBroadcastNotification] Sent to ${tokens.length} devices`);
        return { success: true, sent: tokens.length };
    } catch (error: any) {
        console.error('[sendBroadcastNotification] Unexpected error:', error);
        return { success: false, error: error.message };
    }
}
