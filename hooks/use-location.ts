import { useEffect, useState, useCallback } from "react";
import * as Location from "expo-location";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const LOCATION_SETTINGS_KEY = "location_settings";

export type LocationSettings = {
    locationEnabled: boolean;
    proximityNotificationsEnabled: boolean;
    proximityDistance: number; // in meters
};

export const DEFAULT_LOCATION_SETTINGS: LocationSettings = {
    locationEnabled: false,
    proximityNotificationsEnabled: false,
    proximityDistance: 2000, // 2km default
};

export const DISTANCE_OPTIONS = [
    { value: 500, label: "500 m" },
    { value: 1000, label: "1 km" },
    { value: 2000, label: "2 km" },
    { value: 5000, label: "5 km" },
    { value: 10000, label: "10 km" },
];

export function useLocation() {
    const [permissionGranted, setPermissionGranted] = useState(false);
    const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
    const [settings, setSettings] = useState<LocationSettings>(DEFAULT_LOCATION_SETTINGS);
    const [isLoading, setIsLoading] = useState(true);

    // Load settings from AsyncStorage
    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const saved = await AsyncStorage.getItem(LOCATION_SETTINGS_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                setSettings({ ...DEFAULT_LOCATION_SETTINGS, ...parsed });
            }
        } catch (error) {
            console.error("[Location] Error loading settings:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const saveSettings = async (newSettings: LocationSettings) => {
        try {
            await AsyncStorage.setItem(LOCATION_SETTINGS_KEY, JSON.stringify(newSettings));
            setSettings(newSettings);
        } catch (error) {
            console.error("[Location] Error saving settings:", error);
        }
    };

    // Check current permission status
    const checkPermission = useCallback(async () => {
        if (Platform.OS === "web") {
            return false;
        }

        const { status } = await Location.getForegroundPermissionsAsync();
        const granted = status === "granted";
        setPermissionGranted(granted);
        return granted;
    }, []);

    // Request location permission
    const requestPermission = useCallback(async () => {
        if (Platform.OS === "web") {
            return false;
        }

        const { status } = await Location.requestForegroundPermissionsAsync();
        const granted = status === "granted";
        setPermissionGranted(granted);
        return granted;
    }, []);

    // Get current location
    const getCurrentLocation = useCallback(async () => {
        if (Platform.OS === "web") {
            return null;
        }

        const hasPermission = await checkPermission();
        if (!hasPermission) {
            const granted = await requestPermission();
            if (!granted) {
                return null;
            }
        }

        try {
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });
            setCurrentLocation(location);
            return location;
        } catch (error) {
            console.error("[Location] Error getting location:", error);
            return null;
        }
    }, [checkPermission, requestPermission]);

    // Toggle location tracking
    const toggleLocationEnabled = useCallback(async (enabled: boolean) => {
        if (enabled) {
            const granted = await requestPermission();
            if (!granted) {
                return false;
            }
        }

        const newSettings = {
            ...settings,
            locationEnabled: enabled,
            // Disable proximity notifications if location is disabled
            proximityNotificationsEnabled: enabled ? settings.proximityNotificationsEnabled : false,
        };
        await saveSettings(newSettings);
        return true;
    }, [settings, requestPermission]);

    // Toggle proximity notifications
    const toggleProximityNotifications = useCallback(async (enabled: boolean) => {
        // Can only enable if location is enabled
        if (enabled && !settings.locationEnabled) {
            return false;
        }

        const newSettings = {
            ...settings,
            proximityNotificationsEnabled: enabled,
        };
        await saveSettings(newSettings);
        return true;
    }, [settings]);

    // Update proximity distance
    const updateProximityDistance = useCallback(async (distance: number) => {
        const newSettings = {
            ...settings,
            proximityDistance: distance,
        };
        await saveSettings(newSettings);
    }, [settings]);

    // Calculate distance between two coordinates (Haversine formula)
    const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371e3; // Earth's radius in meters
        const φ1 = (lat1 * Math.PI) / 180;
        const φ2 = (lat2 * Math.PI) / 180;
        const Δφ = ((lat2 - lat1) * Math.PI) / 180;
        const Δλ = ((lon2 - lon1) * Math.PI) / 180;

        const a =
            Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // Distance in meters
    }, []);

    // Check if a trip is within proximity
    const isWithinProximity = useCallback((tripLat: number, tripLng: number): boolean => {
        if (!currentLocation || !settings.proximityNotificationsEnabled) {
            return false;
        }

        const distance = calculateDistance(
            currentLocation.coords.latitude,
            currentLocation.coords.longitude,
            tripLat,
            tripLng
        );

        return distance <= settings.proximityDistance;
    }, [currentLocation, settings, calculateDistance]);

    return {
        permissionGranted,
        currentLocation,
        settings,
        isLoading,
        checkPermission,
        requestPermission,
        getCurrentLocation,
        toggleLocationEnabled,
        toggleProximityNotifications,
        updateProximityDistance,
        calculateDistance,
        isWithinProximity,
    };
}
