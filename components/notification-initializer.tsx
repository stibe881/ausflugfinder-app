import { useEffect } from "react";
import { useNotifications } from "@/hooks/use-notifications";
import { useSupabaseAuth } from "@/contexts/supabase-auth-context";

/**
 * Component that initializes notification permissions and registers push token
 * Must be rendered in the app root to ensure it runs on startup
 */
export function NotificationInitializer() {
    const { registerPushToken, requestPermissions } = useNotifications();
    const { user, loading } = useSupabaseAuth();

    useEffect(() => {
        // Only attempt to register if user is authenticated and not loading
        if (!loading && user) {
            console.log('[NotificationInitializer] User authenticated, checking notifications...');

            // First ensure permissions are asked
            requestPermissions().then((granted) => {
                if (granted) {
                    console.log('[NotificationInitializer] Permission granted, registering token for user:', user.id);
                    registerPushToken();
                } else {
                    console.log('[NotificationInitializer] Permission denied');
                }
            });
        }
    }, [user, loading]);

    // This component doesn't render anything, it just ensures the hook runs
    return null;
}
