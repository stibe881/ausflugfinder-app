import React, { useEffect, useState, useMemo } from 'react';
import { View, StyleSheet, Pressable, Linking, Dimensions, Alert, ScrollView, Switch, Text } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { geocodeAddress } from '@/lib/geocoding';

interface RouteTabProps {
    planId: string;
}

interface TripLocation {
    id: string;
    name: string;
    lat: number;
    lng: number;
    sequence: number;
}

interface RouteLeg {
    distance: number; // in km
    duration: number; // in seconds
}

export function RouteTab({ planId }: RouteTabProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const [locations, setLocations] = useState<TripLocation[]>([]);
    const [activeTripIds, setActiveTripIds] = useState<Set<string>>(new Set());
    const [routeCoordinates, setRouteCoordinates] = useState<{ latitude: number; longitude: number }[]>([]);
    const [routeDistance, setRouteDistance] = useState(0); // in km
    const [routeDuration, setRouteDuration] = useState(0); // in seconds
    const [routeLegs, setRouteLegs] = useState<RouteLeg[]>([]); // Segments between stops
    const [loading, setLoading] = useState(true);
    const [region, setRegion] = useState({
        latitude: 46.8182,
        longitude: 8.2275,
        latitudeDelta: 2,
        longitudeDelta: 2,
    });

    useEffect(() => {
        loadLocations();
    }, [planId]);

    const loadLocations = async () => {
        try {
            console.log('[RouteTab] Loading locations for plan:', planId);

            // Fetch plan trips with trip locations
            const { data: planTrips, error } = await supabase
                .from('plan_trips')
                .select(`
                    id,
                    sequence,
                    custom_location,
                    custom_address,
                    trip:ausfluege(id, name, adresse, lat, lng)
                `)
                .eq('plan_id', planId)
                .order('sequence');

            console.log('[RouteTab] Fetched plan trips:', planTrips?.length || 0, 'trips');
            if (error) {
                console.error('[RouteTab] Error fetching plan trips:', error);
            }

            if (planTrips && planTrips.length > 0) {
                const locs: TripLocation[] = [];

                for (const pt of planTrips as any[]) {
                    console.log('[RouteTab] Processing trip:', {
                        name: pt.trip?.name || pt.custom_location,
                        hasCoords: !!(pt.trip?.lat && pt.trip?.lng),
                        hasAddress: !!(pt.trip?.adresse || pt.custom_address),
                        tripData: pt.trip,
                        customData: { location: pt.custom_location, address: pt.custom_address }
                    });

                    if (pt.trip?.lat && pt.trip?.lng) {
                        // Database trip with coordinates
                        console.log('[RouteTab] ✓ Using existing coordinates for:', pt.trip.name);
                        locs.push({
                            id: pt.id,
                            name: pt.trip.name,
                            lat: parseFloat(pt.trip.lat),
                            lng: parseFloat(pt.trip.lng),
                            sequence: pt.sequence,
                        });
                    } else if (pt.trip?.adresse && !pt.trip?.lat) {
                        // Database trip with address but no coordinates - try geocoding
                        console.log('[RouteTab] ⚠️ Trip has address but no coords, geocoding:', pt.trip.name, pt.trip.adresse);
                        try {
                            const geocoded = await geocodeAddress(pt.trip.adresse);
                            if (geocoded) {
                                console.log('[RouteTab] ✓ Geocoded successfully:', pt.trip.name, geocoded);
                                locs.push({
                                    id: pt.id,
                                    name: pt.trip.name,
                                    lat: parseFloat(geocoded.lat),
                                    lng: parseFloat(geocoded.lng),
                                    sequence: pt.sequence,
                                });
                            } else {
                                console.log('[RouteTab] ✗ Geocoding failed for trip:', pt.trip.name, pt.trip.adresse);
                            }
                        } catch (error) {
                            console.log('[RouteTab] ✗ Geocoding error for trip:', pt.trip.name, error);
                        }
                    } else if (pt.custom_location && pt.custom_address) {
                        // Custom location - try to geocode the address
                        console.log('[RouteTab] ⚠️ Custom location, geocoding:', pt.custom_location, pt.custom_address);
                        try {
                            const geocoded = await geocodeAddress(pt.custom_address);
                            if (geocoded) {
                                console.log('[RouteTab] ✓ Geocoded custom location:', pt.custom_location, geocoded);
                                locs.push({
                                    id: pt.id,
                                    name: pt.custom_location,
                                    lat: parseFloat(geocoded.lat),
                                    lng: parseFloat(geocoded.lng),
                                    sequence: pt.sequence,
                                });
                            } else {
                                console.log('[RouteTab] ✗ Geocoding failed for custom location:', pt.custom_location, pt.custom_address);
                            }
                        } catch (error) {
                            console.log('[RouteTab] ✗ Geocoding error for custom location:', pt.custom_location, error);
                        }
                    } else {
                        console.log('[RouteTab] ✗ Trip has neither coordinates nor address, skipping:', pt.trip?.name || pt.custom_location);
                    }
                }

                console.log('[RouteTab] Total locations found:', locs.length);
                setLocations(locs);

                // Initialize all trips as active
                setActiveTripIds(new Set(locs.map(l => l.id)));

                // Fetch driving route with all trips initially
                if (locs.length > 1) {
                    await fetchDrivingRoute(locs);
                }

                // Calculate center and zoom to fit all markers
                if (locs.length > 0) {
                    const lats = locs.map(l => l.lat);
                    const lngs = locs.map(l => l.lng);
                    const minLat = Math.min(...lats);
                    const maxLat = Math.max(...lats);
                    const minLng = Math.min(...lngs);
                    const maxLng = Math.max(...lngs);

                    const centerLat = (minLat + maxLat) / 2;
                    const centerLng = (minLng + maxLng) / 2;
                    const deltaLat = (maxLat - minLat) * 1.3; // Add padding
                    const deltaLng = (maxLng - minLng) * 1.3;

                    setRegion({
                        latitude: centerLat,
                        longitude: centerLng,
                        latitudeDelta: Math.max(deltaLat, 0.1),
                        longitudeDelta: Math.max(deltaLng, 0.1),
                    });
                }
            }
        } catch (error) {
            console.error('Load locations error:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDrivingRoute = async (locs: TripLocation[]) => {
        try {
            // Build OSRM coordinates string: lng,lat;lng,lat;...
            const coords = locs.map(loc => `${loc.lng},${loc.lat}`).join(';');

            // Use OSRM public API (OpenStreetMap routing) with steps for leg information
            const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=true`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
                const route = data.routes[0];

                // Convert GeoJSON coordinates [lng, lat] to map coordinates
                const routeCoords = route.geometry.coordinates.map((coord: [number, number]) => ({
                    latitude: coord[1],
                    longitude: coord[0]
                }));

                setRouteCoordinates(routeCoords);
                setRouteDistance(route.distance / 1000); // Convert meters to km
                setRouteDuration(route.duration); // Duration in seconds

                // Extract leg information (segments between waypoints)
                if (route.legs && route.legs.length > 0) {
                    const legs = route.legs.map((leg: any) => ({
                        distance: leg.distance / 1000, // Convert to  km
                        duration: leg.duration // seconds
                    }));
                    setRouteLegs(legs);
                }
            } else {
                // Fallback to straight lines if routing fails
                console.log('Routing failed, using straight lines');
                const straightLine = locs.map(loc => ({
                    latitude: loc.lat,
                    longitude: loc.lng
                }));
                setRouteCoordinates(straightLine);
            }
        } catch (error) {
            console.error('Routing error:', error);
            // Fallback to straight lines
            const straightLine = locs.map(loc => ({
                latitude: loc.lat,
                longitude: loc.lng
            }));
            setRouteCoordinates(straightLine);
        }
    };

    const openInGoogleMaps = () => {
        if (activeLocations.length === 0) {
            Alert.alert('Keine Route', 'Aktiviere mindestens einen Trip um eine Route zu sehen');
            return;
        }

        // Build Google Maps URL with waypoints (only active trips)
        const waypoints = activeLocations
            .map(loc => `${loc.lat},${loc.lng}`)
            .join('|');

        const url = `https://www.google.com/maps/dir/?api=1&waypoints=${waypoints}&travelmode=driving`;

        Linking.openURL(url).catch(() => {
            Alert.alert('Fehler', 'Google Maps konnte nicht geöffnet werden');
        });
    };

    const calculateTotalDistance = () => {
        // Use route distance from OSRM if available
        if (routeDistance > 0) {
            return routeDistance;
        }

        // Fallback to straight-line distance
        if (locations.length < 2) return 0;

        let total = 0;
        for (let i = 0; i < locations.length - 1; i++) {
            const d = getDistanceFromLatLonInKm(
                locations[i].lat,
                locations[i].lng,
                locations[i + 1].lat,
                locations[i + 1].lng
            );
            total += d;
        }
        return total;
    };

    const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; // Radius of the earth in km
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c; // Distance in km
        return d;
    };

    const deg2rad = (deg: number) => {
        return deg * (Math.PI / 180);
    };

    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.round((seconds % 3600) / 60);

        if (hours > 0) {
            return `${hours}h ${minutes}min`;
        }
        return `${minutes}min`;
    };

    // Filter locations to only active ones for route calculations
    const activeLocations = useMemo(() => {
        return locations.filter(loc => activeTripIds.has(loc.id));
    }, [locations, activeTripIds]);

    // Apply offset to markers at same location to prevent overlapping/flickering
    const offsetLocations = useMemo(() => {
        const threshold = 0.0001; // ~11 meters
        const offsetDistance = 0.0003; // ~33 meters offset
        const locationsWithOffset = [];

        for (let i = 0; i < locations.length; i++) {
            const loc = locations[i];
            let offsetLat = loc.lat;
            let offsetLng = loc.lng;

            // Check if this location overlaps with any previous location
            let overlapCount = 0;
            for (let j = 0; j < i; j++) {
                const prevLoc = locationsWithOffset[j];
                const latDiff = Math.abs(prevLoc.lat - loc.lat);
                const lngDiff = Math.abs(prevLoc.lng - loc.lng);

                if (latDiff < threshold && lngDiff < threshold) {
                    overlapCount++;
                }
            }

            // If overlapping, offset in a circular pattern
            if (overlapCount > 0) {
                const angle = (overlapCount * (360 / 8)) * (Math.PI / 180); // 8 positions max
                offsetLat = loc.lat + (offsetDistance * Math.cos(angle));
                offsetLng = loc.lng + (offsetDistance * Math.sin(angle));
            }

            locationsWithOffset.push({
                ...loc,
                lat: offsetLat,
                lng: offsetLng,
                originalLat: loc.lat,
                originalLng: loc.lng,
            });
        }

        return locationsWithOffset;
    }, [locations]);

    // Toggle trip active state
    const toggleTrip = async (tripId: string) => {
        const newActiveTripIds = new Set(activeTripIds);
        if (newActiveTripIds.has(tripId)) {
            newActiveTripIds.delete(tripId);
        } else {
            newActiveTripIds.add(tripId);
        }
        setActiveTripIds(newActiveTripIds);

        // Recalculate route with active trips
        const newActiveLocations = locations.filter(loc => newActiveTripIds.has(loc.id));
        if (newActiveLocations.length > 1) {
            await fetchDrivingRoute(newActiveLocations);
        } else {
            // Clear route if only 0-1 active trips
            setRouteCoordinates([]);
            setRouteDistance(0);
            setRouteDuration(0);
            setRouteLegs([]);
        }
    };

    const totalDistance = calculateTotalDistance();

    if (loading) {
        return (
            <View style={[styles.center, { backgroundColor: colors.background }]}>
                <ThemedText>Lädt Karte...</ThemedText>
            </View>
        );
    }

    if (locations.length === 0) {
        return (
            <View style={[styles.center, { backgroundColor: colors.background }]}>
                <IconSymbol name="map" size={64} color={colors.textSecondary} />
                <ThemedText style={styles.emptyText}>Keine Route verfügbar</ThemedText>
                <ThemedText style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                    Füge Trips hinzu um die Route zu sehen
                </ThemedText>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <MapView
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                region={region}
                showsUserLocation
                showsMyLocationButton
            >
                {/* Markers for each location with numbered custom markers */}
                {offsetLocations.map((loc, index) => {
                    const isActive = activeTripIds.has(loc.id);
                    const markerColor = isActive
                        ? (index === 0 ? '#34C759' : index === offsetLocations.length - 1 ? '#FF3B30' : colors.primary)
                        : '#999999';

                    return (
                        <Marker
                            key={loc.id}
                            coordinate={{ latitude: loc.lat, longitude: loc.lng }}
                            title={loc.name}
                            description={isActive ? 'Aktiv' : 'Inaktiv'}
                            onPress={() => toggleTrip(loc.id)}
                        >
                            <View style={styles.customMarker}>
                                <View style={[styles.markerCircle, { backgroundColor: markerColor }]}>
                                    <Text style={styles.markerNumber}>{index + 1}</Text>
                                </View>
                                {!isActive && (
                                    <View style={styles.inactiveOverlay}>
                                        <IconSymbol name="slash.circle.fill" size={20} color="#FFF" />
                                    </View>
                                )}
                            </View>
                        </Marker>
                    );
                })}

                {/* Route polyline - uses actual driving route from OSRM */}
                {routeCoordinates.length > 1 && (
                    <Polyline
                        coordinates={routeCoordinates}
                        strokeColor={colors.primary}
                        strokeWidth={4}
                        lineCap="round"
                        lineJoin="round"
                    />
                )}
            </MapView>

            {/* Info Card */}
            <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
                <View style={styles.infoRow}>
                    <IconSymbol name="mappin.and.ellipse" size={20} color={colors.primary} />
                    <ThemedText style={styles.infoText}>
                        {activeLocations.length}/{locations.length} Stops
                    </ThemedText>
                </View>
                <View style={styles.infoRow}>
                    <IconSymbol name="speedometer" size={20} color={colors.primary} />
                    <ThemedText style={styles.infoText}>
                        {totalDistance.toFixed(1)} km
                    </ThemedText>
                </View>

                {routeDuration > 0 && (
                    <View style={styles.infoRow}>
                        <IconSymbol name="clock.fill" size={20} color={colors.primary} />
                        <ThemedText style={styles.infoText}>
                            {formatDuration(routeDuration)}
                        </ThemedText>
                    </View>
                )}
            </View>

            {/* Horizontal Trip List with Toggles */}
            <ScrollView
                horizontal
                style={[styles.tripListContainer, { backgroundColor: colors.card }]}
                contentContainerStyle={styles.tripListContent}
                showsHorizontalScrollIndicator={false}
            >
                {locations.map((loc, idx) => {
                    const isActive = activeTripIds.has(loc.id);
                    return (
                        <Pressable
                            key={loc.id}
                            style={[
                                styles.tripChip,
                                {
                                    backgroundColor: isActive ? colors.primary + '15' : colors.surface,
                                    borderColor: isActive ? colors.primary : colors.border,
                                }
                            ]}
                            onPress={() => toggleTrip(loc.id)}
                        >
                            <View style={styles.tripChipContent}>
                                <View style={styles.tripChipHeader}>
                                    <Text style={[styles.tripChipNumber, { color: colors.primary }]}>{idx + 1}</Text>
                                    <Switch
                                        value={isActive}
                                        onValueChange={() => toggleTrip(loc.id)}
                                        trackColor={{ false: colors.border, true: colors.primary }}
                                        thumbColor={isActive ? '#FFF' : '#f4f3f4'}
                                        style={styles.tripSwitch}
                                    />
                                </View>
                                <ThemedText
                                    style={[styles.tripChipName, { opacity: isActive ? 1 : 0.5 }]}
                                    numberOfLines={2}
                                >
                                    {loc.name}
                                </ThemedText>
                            </View>
                        </Pressable>
                    );
                })}
            </ScrollView>

            {/* Google Maps Button */}
            <Pressable
                style={[styles.fabButton, { backgroundColor: colors.primary }]}
                onPress={openInGoogleMaps}
            >
                <IconSymbol name="map.fill" size={20} color="#FFF" />
                <ThemedText style={styles.fabButtonText}>In Google Maps öffnen</ThemedText>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.xl,
        gap: Spacing.md,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
    },
    emptySubtext: {
        fontSize: 14,
        textAlign: 'center',
    },
    map: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height - 200,
    },
    infoCard: {
        position: 'absolute',
        top: Spacing.md,
        left: Spacing.md,
        right: Spacing.md,
        padding: Spacing.md,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'space-around',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    infoText: {
        fontSize: 15,
        fontWeight: '600',
    },
    fabButton: {
        position: 'absolute',
        bottom: Spacing.lg,
        left: Spacing.md,
        right: Spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        padding: Spacing.md,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    fabButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    customMarker: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    markerCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: '#FFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 5,
    },
    markerNumber: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    inactiveOverlay: {
        position: 'absolute',
        top: -2,
        right: -2,
        backgroundColor: '#EF4444',
        borderRadius: 10,
        padding: 2,
    },
    tripListContainer: {
        position: 'absolute',
        bottom: 80,
        left: 0,
        right: 0,
        maxHeight: 120,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    tripListContent: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        gap: Spacing.sm,
    },
    tripChip: {
        width: 140,
        padding: Spacing.sm,
        borderRadius: 12,
        borderWidth: 2,
        marginRight: Spacing.xs,
    },
    tripChipContent: {
        flex: 1,
    },
    tripChipHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.xs,
    },
    tripChipNumber: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    tripSwitch: {
        transform: [{ scale: 0.8 }],
    },
    tripChipName: {
        fontSize: 13,
        fontWeight: '500',
    },
});
