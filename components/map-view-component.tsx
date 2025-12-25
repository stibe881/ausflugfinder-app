import { Platform, StyleSheet, View, Text, Dimensions } from "react-native";
import Constants from "expo-constants";
import { useState, useRef, useEffect } from "react";
import { Image } from "expo-image";

import { ThemedText } from "./themed-text";
import { GoogleMapsWeb } from "./google-maps-web";
import { Colors, BrandColors, Spacing, BorderRadius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

type Trip = {
  id: number;
  name: string;
  lat: string | null;
  lng: string | null;
  kosten_stufe: number | null;
  region: string | null;
  primaryPhotoUrl?: string | null;
};

type MapViewComponentProps = {
  trips: Trip[];
  onMarkerPress?: (tripId: number) => void;
};

// Check if we're running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// Cost level colors and labels
const CostMarkerColors: Record<number, string> = {
  0: BrandColors.primary, // Free
  1: "#22C55E", // Low
  2: BrandColors.secondary, // Medium
  3: "#EF4444", // High
  4: "#7C3AED", // Very high
};

const CostLabels: Record<number, string> = {
  0: "Gratis",
  1: "Günstig",
  2: "Mittel",
  3: "Teuer",
  4: "Sehr teuer",
};

// Dynamically import react-native-maps
let MapView: any = null;
let Marker: any = null;
let Callout: any = null;
let PROVIDER_DEFAULT: any = null;
let ClusteredMapView: any = null;

if (Platform.OS !== 'web' && !isExpoGo) {
  try {
    const Maps = require('react-native-maps');
    MapView = Maps.default;
    Marker = Maps.Marker;
    Callout = Maps.Callout;
    PROVIDER_DEFAULT = Platform.OS === 'android' ? Maps.PROVIDER_GOOGLE : undefined;

    // Import clustering
    ClusteredMapView = require('react-native-map-clustering').default;
  } catch (e) {
    console.error('[MapView] Failed to load react-native-maps:', e);
  }
}

export function MapViewComponent({ trips, onMarkerPress }: MapViewComponentProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const mapRef = useRef<any>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number, longitude: number } | null>(null);

  // Get user location
  useEffect(() => {
    if (Platform.OS !== 'web' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => console.log('[MapView] Geolocation error:', error)
      );
    }
  }, []);

  // Auto-zoom to user location when available
  useEffect(() => {
    if (userLocation && mapRef.current) {
      // ClusteredMapView requires getMapRef() to access underlying MapView
      const map = mapRef.current.getMapRef?.() || mapRef.current;
      if (map && map.animateToRegion) {
        setTimeout(() => {
          map.animateToRegion({
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1,
          }, 1000);
        }, 500); // Small delay to ensure map is ready
      }
    }
  }, [userLocation]);

  // Filter trips with valid coordinates
  const tripsWithCoords = trips.filter(
    (trip) => trip.lat && trip.lng && !isNaN(parseFloat(trip.lat)) && !isNaN(parseFloat(trip.lng))
  );

  // Use Google Maps for web
  if (Platform.OS === 'web') {
    return <GoogleMapsWeb trips={trips} onMarkerPress={onMarkerPress} />;
  }

  // Expo Go fallback
  if (isExpoGo || !MapView) {
    return (
      <View style={[styles.fallback, { backgroundColor: colors.surface }]}>
        <View style={[styles.fallbackIcon, { backgroundColor: colors.primary + "15" }]}>
          <ThemedText style={styles.fallbackEmoji}>🗺️</ThemedText>
        </View>
        <ThemedText style={styles.fallbackTitle}>
          {isExpoGo ? "Karte nur in Production Build" : "Kartenansicht nicht verfügbar"}
        </ThemedText>
        <ThemedText style={[styles.fallbackText, { color: colors.textSecondary }]}>
          {isExpoGo
            ? `Google Maps funktioniert nicht in Expo Go.\n${tripsWithCoords.length} Ausflüge mit Standort verfügbar im TestFlight Build.`
            : `${tripsWithCoords.length} Ausflüge mit Standort`
          }
        </ThemedText>
      </View>
    );
  }

  // No trips with coordinates
  if (tripsWithCoords.length === 0) {
    return (
      <View style={[styles.fallback, { backgroundColor: colors.surface }]}>
        <View style={[styles.fallbackIcon, { backgroundColor: colors.primary + "15" }]}>
          <ThemedText style={styles.fallbackEmoji}>📍</ThemedText>
        </View>
        <ThemedText style={styles.fallbackTitle}>Keine Standorte</ThemedText>
        <ThemedText style={[styles.fallbackText, { color: colors.textSecondary }]}>
          Keine Ausflugsziele mit Standort gefunden
        </ThemedText>
      </View>
    );
  }

  // Calculate initial region - prioritize user location
  let centerLat: number;
  let centerLng: number;
  let latDelta: number;
  let lngDelta: number;

  if (userLocation) {
    // Center on user location with closer zoom
    centerLat = userLocation.latitude;
    centerLng = userLocation.longitude;
    latDelta = 0.05; // Closer zoom (was 0.1 minimum)
    lngDelta = 0.05;
  } else {
    // Fallback to trips bounds
    const latitudes = tripsWithCoords.map((t) => parseFloat(t.lat!));
    const longitudes = tripsWithCoords.map((t) => parseFloat(t.lng!));
    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);

    centerLat = (minLat + maxLat) / 2;
    centerLng = (minLng + maxLng) / 2;
    latDelta = Math.max(0.1, (maxLat - minLat) * 1.5);
    lngDelta = Math.max(0.1, (maxLng - minLng) * 1.5);
  }

  // Render marker with custom callout
  const renderMarker = (trip: Trip) => {
    const costColor = CostMarkerColors[trip.kosten_stufe ?? 0];
    const costLabel = CostLabels[trip.kosten_stufe ?? 0];

    return (
      <Marker
        key={trip.id}
        coordinate={{
          latitude: parseFloat(trip.lat!),
          longitude: parseFloat(trip.lng!),
        }}
        pinColor={costColor}
        zIndex={1}
      >
        <Callout tooltip onPress={() => onMarkerPress?.(trip.id)}>
          <View style={[styles.callout, { backgroundColor: colors.card }]}>
            {/* Photo */}
            {trip.primaryPhotoUrl ? (
              <Image
                source={{ uri: trip.primaryPhotoUrl }}
                style={styles.calloutImage}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.calloutImagePlaceholder, { backgroundColor: colors.surface }]}>
                <Text style={{ fontSize: 24 }}>🏔️</Text>
              </View>
            )}

            {/* Content */}
            <View style={styles.calloutContent}>
              <Text style={[styles.calloutTitle, { color: colors.text }]} numberOfLines={2}>
                {trip.name}
              </Text>

              <View style={styles.calloutRow}>
                {trip.region && (
                  <Text style={[styles.calloutRegion, { color: colors.textSecondary }]}>
                    📍 {trip.region}
                  </Text>
                )}
              </View>

              <View style={[styles.calloutCostBadge, { backgroundColor: costColor + "20" }]}>
                <Text style={[styles.calloutCostText, { color: costColor }]}>
                  {costLabel}
                </Text>
              </View>

              <Text style={[styles.calloutTap, { color: colors.primary }]}>
                👆 Antippen für Details
              </Text>
            </View>
          </View>
        </Callout>
      </Marker>
    );
  };

  // Render cluster marker
  const renderCluster = (cluster: any, onPress: any) => {
    const { pointCount, coordinate } = cluster;
    const color = pointCount > 20 ? "#EF4444" : pointCount > 10 ? BrandColors.secondary : BrandColors.primary;

    return (
      <Marker
        key={`cluster-${cluster.clusterId}`}
        coordinate={coordinate}
        onPress={onPress}
      >
        <View style={[styles.clusterMarker, { backgroundColor: color }]}>
          <Text style={styles.clusterText}>{pointCount}</Text>
        </View>
      </Marker>
    );
  };

  return (
    <View style={styles.container}>
      <ClusteredMapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: centerLat,
          longitude: centerLng,
          latitudeDelta: latDelta,
          longitudeDelta: lngDelta,
        }}
        provider={PROVIDER_DEFAULT}
        showsUserLocation={false} // Disable default, use custom marker
        showsMyLocationButton
        clusterColor={BrandColors.primary}
        clusterTextColor="#FFFFFF"
        clusterFontSize={16}
        spiralEnabled={false}
      >
        {tripsWithCoords.map((trip) => renderMarker(trip))}

        {/* Custom User Location Marker with high zIndex */}
        {userLocation && (
          <Marker
            coordinate={userLocation}
            zIndex={9999} // Highest zIndex to appear on top
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.userLocationMarker}>
              <View style={styles.userLocationDot} />
            </View>
          </Marker>
        )}
      </ClusteredMapView>
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
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  fallbackIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  fallbackEmoji: {
    fontSize: 40,
  },
  fallbackTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  fallbackText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  // Custom Callout Styles
  callout: {
    width: 250,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  calloutImage: {
    width: "100%",
    height: 120,
  },
  calloutImagePlaceholder: {
    width: "100%",
    height: 120,
    justifyContent: "center",
    alignItems: "center",
  },
  calloutContent: {
    padding: Spacing.md,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  calloutRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  calloutRegion: {
    fontSize: 13,
  },
  calloutCostBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
  calloutCostText: {
    fontSize: 12,
    fontWeight: "600",
  },
  calloutTap: {
    fontSize: 12,
    fontStyle: "italic",
  },
  // Cluster Marker Styles
  clusterMarker: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  clusterText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  // User Location Marker Styles
  userLocationMarker: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(74, 144, 226, 0.3)", // Larger, more visible
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(74, 144, 226, 0.5)",
  },
  userLocationDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#4A90E2", // Brand color
    borderWidth: 4,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});
