import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Pressable, Linking, Dimensions, Alert } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

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

export function RouteTab({ planId }: RouteTabProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const [locations, setLocations] = useState<TripLocation[]>([]);
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
            // Fetch plan trips with trip locations
            const { data: planTrips } = await supabase
                .from('plan_trips')
                .select(`
                    id,
                    sequence,
                    custom_location,
                    trip:ausfluege(id, name, lat, lng)
                `)
                .eq('plan_id', planId)
                .order('sequence');

            if (planTrips && planTrips.length > 0) {
                const locs: TripLocation[] = [];

                for (const pt of planTrips as any[]) {
                    if (pt.trip?.lat && pt.trip?.lng) {
                        locs.push({
                            id: pt.id,
                            name: pt.trip.name,
                            lat: parseFloat(pt.trip.lat),
                            lng: parseFloat(pt.trip.lng),
                            sequence: pt.sequence,
                        });
                    } else if (pt.custom_location) {
                        // Custom locations don't have coordinates yet
                        // Could be enhanced with geocoding in future
                    }
                }

                setLocations(locs);

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

    const openInGoogleMaps = () => {
        if (locations.length === 0) {
            Alert.alert('Keine Route', 'Füge erst Trips hinzu um eine Route zu sehen');
            return;
        }

        // Build Google Maps URL with waypoints
        const waypoints = locations
            .map(loc => `${loc.lat},${loc.lng}`)
            .join('|');

        const url = `https://www.google.com/maps/dir/?api=1&waypoints=${waypoints}&travelmode=driving`;

        Linking.openURL(url).catch(() => {
            Alert.alert('Fehler', 'Google Maps konnte nicht geöffnet werden');
        });
    };

    const calculateTotalDistance = () => {
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
                {/* Markers for each location */}
                {locations.map((loc, index) => (
                    <Marker
                        key={loc.id}
                        coordinate={{ latitude: loc.lat, longitude: loc.lng }}
                        title={loc.name}
                        description={`Stop ${index + 1}`}
                        pinColor={index === 0 ? '#34C759' : index === locations.length - 1 ? '#FF3B30' : colors.primary}
                    />
                ))}

                {/* Route polyline */}
                {locations.length > 1 && (
                    <Polyline
                        coordinates={locations.map(loc => ({ latitude: loc.lat, longitude: loc.lng }))}
                        strokeColor={colors.primary}
                        strokeWidth={3}
                    />
                )}
            </MapView>

            {/* Info Card */}
            <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
                <View style={styles.infoRow}>
                    <IconSymbol name="mappin.and.ellipse" size={20} color={colors.primary} />
                    <ThemedText style={styles.infoText}>
                        {locations.length} {locations.length === 1 ? 'Stop' : 'Stops'}
                    </ThemedText>
                </View>
                <View style={styles.infoRow}>
                    <IconSymbol name="road.lanes" size={20} color={colors.primary} />
                    <ThemedText style={styles.infoText}>
                        ~{totalDistance.toFixed(0)} km
                    </ThemedText>
                </View>
            </View>

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
});
