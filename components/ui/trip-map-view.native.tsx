import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, StyleSheet, Text, Image } from 'react-native';
import MapView from 'react-native-map-clustering';
import { Marker, Callout, PROVIDER_DEFAULT, Region } from 'react-native-maps';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type Trip = {
    id: number;
    name: string;
    lat: string | null;
    lng: string | null;
    kosten_stufe: number | null;
    region: string | null;
    primaryPhotoUrl?: string | null;
    kategorie_alt?: string | null;
    adresse?: string;
};

type MapViewComponentProps = {
    trips: Trip[];
    onMarkerPress?: (tripId: number) => void;
};

const CostMarkerColors: Record<number, string> = {
    0: '#10B981',
    1: '#3B82F6',
    2: '#F59E0B',
    3: '#EF4444',
    4: '#9333EA',
};

const CostLabels: Record<number, string> = {
    0: 'Gratis',
    1: 'Günstig',
    2: 'Mittel',
    3: 'Teuer',
    4: 'Sehr teuer',
};

export function TripMapView({ trips, onMarkerPress }: MapViewComponentProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const mapRef = useRef<MapView>(null);

    const [region, setRegion] = useState<Region | null>(null);

    // Filter valid trips
    const tripsWithCoords = useMemo(
        () => trips
            .filter((trip) => trip.lat && trip.lng && !isNaN(parseFloat(trip.lat)) && !isNaN(parseFloat(trip.lng))),
        [trips]
    );

    // Handle region change
    const onRegionChangeComplete = (newRegion: Region) => {
        setRegion(newRegion);
    };

    const onMapLayout = (e: any) => {
        // Layout handler kept for safety
    };

    // Initial region - calculate once
    useEffect(() => {
        if (tripsWithCoords.length > 0 && !region) {
            const lats = tripsWithCoords.map((t) => parseFloat(t.lat!));
            const lngs = tripsWithCoords.map((t) => parseFloat(t.lng!));
            const minLat = Math.min(...lats);
            const maxLat = Math.max(...lats);
            const minLng = Math.min(...lngs);
            const maxLng = Math.max(...lngs);

            const centerLat = (minLat + maxLat) / 2;
            const centerLng = (minLng + maxLng) / 2;
            const latDelta = (maxLat - minLat) * 1.5 || 0.1;
            const lngDelta = (maxLng - minLng) * 1.5 || 0.1;

            setRegion({
                latitude: centerLat,
                longitude: centerLng,
                latitudeDelta: Math.max(latDelta, 0.05), // Ensure minimum delta
                longitudeDelta: Math.max(lngDelta, 0.05),
            });
        }
    }, [tripsWithCoords]);

    // No trips
    if (tripsWithCoords.length === 0) {
        return (
            <View style={[styles.fallback, { backgroundColor: colors.surface }]}>
                <ThemedText>Keine Standorte verfügbar</ThemedText>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {region && (
                <MapView
                    ref={mapRef}
                    style={styles.map}
                    initialRegion={region}
                    onRegionChangeComplete={onRegionChangeComplete}
                    onLayout={onMapLayout}
                    provider={PROVIDER_DEFAULT}
                    maxZoomLevel={20}
                    minZoomLevel={3}
                    showsUserLocation={true}
                    showsMyLocationButton={true}
                    toolbarEnabled={false}
                    moveOnMarkerPress={false}
                >
                    {tripsWithCoords.map((trip) => {
                        const latitude = parseFloat(trip.lat!);
                        const longitude = parseFloat(trip.lng!);

                        return (
                            <Marker
                                key={`trip-${trip.id}`}
                                coordinate={{ latitude, longitude }}
                                pinColor={CostMarkerColors[trip.kosten_stufe ?? 0] || CostMarkerColors[0]}
                                zIndex={1}
                                tracksViewChanges={false}
                                onPress={() => { }} // Empty handler to allow callout to open
                            >
                                <Callout tooltip onPress={() => onMarkerPress?.(trip.id)}>
                                    <View style={styles.calloutContainer}>
                                        {trip.primaryPhotoUrl && (
                                            <Image
                                                source={{ uri: trip.primaryPhotoUrl }}
                                                style={styles.calloutImage}
                                                resizeMode="cover"
                                            />
                                        )}
                                        <View style={styles.calloutContent}>
                                            <Text style={styles.calloutTitle} numberOfLines={1}>{trip.name}</Text>
                                            <Text style={styles.calloutSubtitle} numberOfLines={1}>
                                                {(() => {
                                                    const addr = trip.adresse || "";
                                                    const zipMatch = addr.match(/\b\d{4}\s+([^,]+)/);
                                                    if (zipMatch?.[1]) return zipMatch[1].trim();

                                                    if (addr.includes(",")) {
                                                        const parts = addr.split(",");
                                                        const lastPart = parts[parts.length - 1].trim();
                                                        if (lastPart && isNaN(Number(Number(lastPart)))) return lastPart;
                                                    }

                                                    return trip.region || "";
                                                })()}
                                            </Text>
                                            <Text style={styles.calloutCategory}>{CostLabels[trip.kosten_stufe ?? 0]}</Text>
                                        </View>
                                    </View>
                                </Callout>
                            </Marker>
                        );
                    })}
                </MapView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        flex: 1,
    },
    fallback: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl,
    },
    calloutContainer: {
        width: 240,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        overflow: 'hidden',
    },
    calloutImage: {
        width: '100%',
        height: 120,
        backgroundColor: '#E5E7EB',
    },
    calloutContent: {
        padding: 10,
    },
    calloutTitle: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 4,
        color: '#000',
    },
    calloutSubtitle: {
        fontSize: 13,
        color: '#666',
    },
    calloutCategory: {
        fontSize: 12,
        color: '#3B82F6',
        marginTop: 2,
        fontWeight: '500',
    },
});
