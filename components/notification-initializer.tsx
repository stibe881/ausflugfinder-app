import { useEffect } from "react";
import { useNotifications } from "@/hooks/use-notifications";

/**
 * Component that initializes notification permissions and registers push token
 * Must be rendered in the app root to ensure it runs on startup
 */
export function NotificationInitializer() {
    const { permissionGranted } = useNotifications();

    useEffect(() => {
        console.log('[NotificationInitializer] Mounted - permissions:', permissionGranted);
    }, [permissionGranted]);

    // This component doesn't render anything, it just ensures the hook runs
    return null;
}
