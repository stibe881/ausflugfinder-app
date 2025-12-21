import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useProximityTracking } from "@/hooks/use-proximity-tracking";

/**
 * Component that initializes proximity tracking when mounted.
 * Also handles navigation when user taps on a proximity notification.
 * Should be placed in the root layout to start background tracking.
 */
export function ProximityTrackingInitializer() {
    const { startTracking, checkProximityNow } = useProximityTracking();
    const router = useRouter();
    const notificationListener = useRef<Notifications.EventSubscription>();
    const responseListener = useRef<Notifications.EventSubscription>();

    useEffect(() => {
        if (Platform.OS === "web") return;

        // Start tracking when app mounts
        startTracking();

        // Also do an immediate check when app opens
        checkProximityNow();

        // Listen for notification responses (when user taps on notification)
        responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
            const data = response.notification.request.content.data;

            // If the notification has a tripId, navigate to that trip
            if (data?.tripId) {
                console.log(`[ProximityTracking] User tapped notification for trip ${data.tripId}`);
                router.push(`/trip/${data.tripId}` as any);
            }
        });

        // Cleanup listeners on unmount
        return () => {
            notificationListener.current?.remove();
            responseListener.current?.remove();
        };
    }, [startTracking, checkProximityNow, router]);

    // This component doesn't render anything
    return null;
}
