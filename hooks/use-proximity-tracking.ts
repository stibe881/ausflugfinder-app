import { useEffect, useRef, useCallback } from "react";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

import { useLocation, LocationSettings, DEFAULT_LOCATION_SETTINGS } from "./use-location";
import { getAllAusfluege, type Ausflug } from "@/lib/supabase-api";

// Task name for background location tracking
const PROXIMITY_TASK_NAME = "proximity-location-tracking";
const NOTIFIED_TRIPS_KEY = "notified_proximity_trips";

// Configure notifications
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowInForeground: true,
    }),
});

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

// Get list of already notified trips (to avoid duplicate notifications)
async function getNotifiedTrips(): Promise<Set<number>> {
    try {
        const data = await AsyncStorage.getItem(NOTIFIED_TRIPS_KEY);
        if (data) {
            const parsed = JSON.parse(data);
            // Clear entries older than 24 hours
            const now = Date.now();
            const filtered = Object.entries(parsed)
                .filter(([_, timestamp]) => now - (timestamp as number) < 24 * 60 * 60 * 1000)
                .map(([id]) => parseInt(id));
            return new Set(filtered);
        }
    } catch (e) {
        console.error("[ProximityTracking] Error reading notified trips:", e);
    }
    return new Set();
}

// Mark a trip as notified
async function markTripNotified(tripId: number): Promise<void> {
    try {
        const data = await AsyncStorage.getItem(NOTIFIED_TRIPS_KEY);
        const parsed = data ? JSON.parse(data) : {};
        parsed[tripId] = Date.now();
        await AsyncStorage.setItem(NOTIFIED_TRIPS_KEY, JSON.stringify(parsed));
    } catch (e) {
        console.error("[ProximityTracking] Error saving notified trip:", e);
    }
}

// Send proximity notification
async function sendProximityNotification(trip: Ausflug, distance: number): Promise<void> {
    const distanceText = distance < 1000
        ? `${Math.round(distance)}m`
        : `${(distance / 1000).toFixed(1)}km`;

    await Notifications.scheduleNotificationAsync({
        content: {
            title: "📍 Ausflugsziel in der Nähe!",
            body: `${trip.name} ist nur ${distanceText} entfernt.`,
            data: { tripId: trip.id },
        },
        trigger: null, // Immediate
    });

    console.log(`[ProximityTracking] Notification sent for trip ${trip.id}: ${trip.name}`);
}

// Define the background task
TaskManager.defineTask(PROXIMITY_TASK_NAME, async ({ data, error }) => {
    if (error) {
        console.error("[ProximityTracking] Background task error:", error);
        return;
    }

    if (data) {
        const { locations } = data as { locations: Location.LocationObject[] };
        if (locations && locations.length > 0) {
            const location = locations[0];
            await checkProximityToTrips(location.coords.latitude, location.coords.longitude);
        }
    }
});

// Check proximity to all trips
async function checkProximityToTrips(userLat: number, userLng: number): Promise<void> {
    try {
        // Get settings
        const settingsData = await AsyncStorage.getItem("location_settings");
        const settings: LocationSettings = settingsData
            ? { ...DEFAULT_LOCATION_SETTINGS, ...JSON.parse(settingsData) }
            : DEFAULT_LOCATION_SETTINGS;

        if (!settings.locationEnabled || !settings.proximityNotificationsEnabled) {
            return;
        }

        // Get all trips
        const trips = await getAllAusfluege();

        // Get already notified trips
        const notifiedTrips = await getNotifiedTrips();

        // Check each trip
        for (const trip of trips) {
            if (!trip.lat || !trip.lng) continue;
            if (notifiedTrips.has(trip.id)) continue;

            const tripLat = parseFloat(trip.lat);
            const tripLng = parseFloat(trip.lng);

            if (isNaN(tripLat) || isNaN(tripLng)) continue;

            const distance = calculateDistance(userLat, userLng, tripLat, tripLng);

            if (distance <= settings.proximityDistance) {
                await sendProximityNotification(trip, distance);
                await markTripNotified(trip.id);
            }
        }
    } catch (e) {
        console.error("[ProximityTracking] Error checking proximity:", e);
    }
}

export function useProximityTracking() {
    const { settings, permissionGranted, requestPermission } = useLocation();
    const isTrackingRef = useRef(false);

    // Start background location tracking
    const startTracking = useCallback(async () => {
        if (Platform.OS === "web") {
            console.log("[ProximityTracking] Not available on web");
            return false;
        }

        if (!settings.locationEnabled || !settings.proximityNotificationsEnabled) {
            console.log("[ProximityTracking] Tracking disabled in settings");
            return false;
        }

        // Request notification permissions
        const { status: notifStatus } = await Notifications.requestPermissionsAsync();
        if (notifStatus !== "granted") {
            console.log("[ProximityTracking] Notification permission not granted");
            return false;
        }

        // Request background location permission
        const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
        if (bgStatus !== "granted") {
            console.log("[ProximityTracking] Background location permission not granted");
            return false;
        }

        // Check if already tracking
        const hasStarted = await Location.hasStartedLocationUpdatesAsync(PROXIMITY_TASK_NAME);
        if (hasStarted) {
            console.log("[ProximityTracking] Already tracking");
            isTrackingRef.current = true;
            return true;
        }

        // Start background location updates
        await Location.startLocationUpdatesAsync(PROXIMITY_TASK_NAME, {
            accuracy: Location.Accuracy.Balanced,
            distanceInterval: 100, // Update every 100 meters
            timeInterval: 60000, // Or every minute
            showsBackgroundLocationIndicator: true,
            foregroundService: {
                notificationTitle: "AusflugFinder",
                notificationBody: "Suche nach Ausflugszielen in deiner Nähe",
                notificationColor: "#22C55E",
            },
        });

        isTrackingRef.current = true;
        console.log("[ProximityTracking] Started background tracking");
        return true;
    }, [settings]);

    // Stop background location tracking
    const stopTracking = useCallback(async () => {
        if (Platform.OS === "web") return;

        try {
            const hasStarted = await Location.hasStartedLocationUpdatesAsync(PROXIMITY_TASK_NAME);
            if (hasStarted) {
                await Location.stopLocationUpdatesAsync(PROXIMITY_TASK_NAME);
                console.log("[ProximityTracking] Stopped background tracking");
            }
        } catch (e) {
            console.error("[ProximityTracking] Error stopping tracking:", e);
        }

        isTrackingRef.current = false;
    }, []);

    // Foreground proximity check (for when app is open)
    const checkProximityNow = useCallback(async () => {
        if (Platform.OS === "web") return;

        if (!settings.locationEnabled || !settings.proximityNotificationsEnabled) {
            return;
        }

        try {
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });
            await checkProximityToTrips(location.coords.latitude, location.coords.longitude);
        } catch (e) {
            console.error("[ProximityTracking] Error checking proximity:", e);
        }
    }, [settings]);

    // Auto-start/stop tracking based on settings
    useEffect(() => {
        if (settings.locationEnabled && settings.proximityNotificationsEnabled) {
            startTracking();
        } else {
            stopTracking();
        }

        return () => {
            // Don't stop on unmount - we want background tracking to continue
        };
    }, [settings.locationEnabled, settings.proximityNotificationsEnabled, startTracking, stopTracking]);

    return {
        startTracking,
        stopTracking,
        checkProximityNow,
        isTracking: isTrackingRef.current,
    };
}
