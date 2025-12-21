import { Platform, StyleSheet, View, Text, TouchableOpacity, Alert } from "react-native";
import Constants from "expo-constants";
import { useState } from "react";
import * as Clipboard from 'expo-clipboard';

import { ThemedText } from "./themed-text";
import { GoogleMapsWeb } from "./google-maps-web";
import { Colors, BrandColors, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

type Trip = {
  id: number;
  name: string;
  lat: string | null;
  lng: string | null;
  kosten_stufe: number | null;
};

type MapViewComponentProps = {
  trips: Trip[];
  onMarkerPress?: (tripId: number) => void;
};

// Check if we're running in Expo Go (which doesn't support native modules like react-native-maps)
const isExpoGo = Constants.appOwnership === 'expo';

// Cost level colors for markers
const CostMarkerColors: Record<number, string> = {
  0: BrandColors.primary, // Free - green
  1: "#22C55E", // Low
  2: BrandColors.secondary, // Medium - orange
  3: "#EF4444", // High - red
  4: "#7C3AED", // Very high - purple
};

// Collect debug info
const debugInfo = {
  appOwnership: Constants.appOwnership,
  isExpoGo,
  platform: Platform.OS,
  mapLoadError: null as string | null,
  mapViewAvailable: false,
};

// Dynamically import react-native-maps only when not in Expo Go and not on web
let MapView: any = null;
let Marker: any = null;
let PROVIDER_DEFAULT: any = null;

// Only try to load react-native-maps on native platforms in production builds
if (Platform.OS !== 'web' && !isExpoGo) {
  try {
    const Maps = require('react-native-maps');
    MapView = Maps.default;
    Marker = Maps.Marker;
    // Use default provider (Apple Maps on iOS, Google Maps on Android)
    PROVIDER_DEFAULT = Platform.OS === 'android' ? Maps.PROVIDER_GOOGLE : undefined;
    debugInfo.mapViewAvailable = true;
  } catch (e: any) {
    debugInfo.mapLoadError = e?.message || String(e);
  }
}

export function MapViewComponent({ trips, onMarkerPress }: MapViewComponentProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [renderError, setRenderError] = useState<string | null>(null);

  // Filter trips with valid coordinates
  const tripsWithCoords = trips.filter(
    (trip) => trip.lat && trip.lng && !isNaN(parseFloat(trip.lat)) && !isNaN(parseFloat(trip.lng))
  );

  // Use Google Maps for web
  if (Platform.OS === 'web') {
    return <GoogleMapsWeb trips={trips} onMarkerPress={onMarkerPress} />;
  }

  // Copy debug info to clipboard
  const handleCopyDebugInfo = async () => {
    const info = {
      ...debugInfo,
      renderError,
      tripsCount: trips.length,
      tripsWithCoordsCount: tripsWithCoords.length,
      timestamp: new Date().toISOString(),
    };
    const text = JSON.stringify(info, null, 2);

    try {
      await Clipboard.setStringAsync(text);
      Alert.alert("Kopiert!", "Debug-Info wurde in die Zwischenablage kopiert.");
    } catch (e) {
      Alert.alert("Debug Info", text);
    }
  };

  // For Expo Go or when native maps aren't available, show a fallback with debug info
  if (isExpoGo || !MapView) {
    return (
      <View style={[styles.fallback, { backgroundColor: colors.surface }]}>
        <View style={[styles.fallbackIcon, { backgroundColor: colors.primary + "15" }]}>
          <ThemedText style={styles.fallbackEmoji}>🗺️</ThemedText>
        </View>
        <ThemedText style={styles.fallbackTitle}>
          Kartenansicht nicht verfügbar
        </ThemedText>
        <ThemedText style={[styles.fallbackText, { color: colors.textSecondary }]}>
          {tripsWithCoords.length} Ausflüge mit Standort
        </ThemedText>

        {/* Debug Info Box */}
        <View style={[styles.debugBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ThemedText style={[styles.debugTitle, { color: colors.text }]}>Debug Info:</ThemedText>
          <Text style={[styles.debugText, { color: colors.textSecondary }]} selectable>
            appOwnership: {String(debugInfo.appOwnership)}{"\n"}
            isExpoGo: {String(debugInfo.isExpoGo)}{"\n"}
            platform: {debugInfo.platform}{"\n"}
            mapViewAvailable: {String(debugInfo.mapViewAvailable)}{"\n"}
            {debugInfo.mapLoadError && `loadError: ${debugInfo.mapLoadError}\n`}
            {renderError && `renderError: ${renderError}\n`}
          </Text>
          <TouchableOpacity
            onPress={handleCopyDebugInfo}
            style={[styles.copyButton, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.copyButtonText}>📋 Debug-Info kopieren</Text>
          </TouchableOpacity>
        </View>
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
        <ThemedText style={styles.fallbackTitle}>
          Keine Standorte
        </ThemedText>
        <ThemedText style={[styles.fallbackText, { color: colors.textSecondary }]}>
          Keine Ausflugsziele mit Standort gefunden
        </ThemedText>
      </View>
    );
  }

  // Calculate initial region from trips
  const latitudes = tripsWithCoords.map((t) => parseFloat(t.lat!));
  const longitudes = tripsWithCoords.map((t) => parseFloat(t.lng!));
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);

  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;
  const latDelta = Math.max(0.1, (maxLat - minLat) * 1.5);
  const lngDelta = Math.max(0.1, (maxLng - minLng) * 1.5);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={{
          latitude: centerLat,
          longitude: centerLng,
          latitudeDelta: latDelta,
          longitudeDelta: lngDelta,
        }}
        showsUserLocation
        showsMyLocationButton
        onError={(e: any) => setRenderError(e?.nativeEvent?.error || "Unknown map error")}
      >
        {tripsWithCoords.map((trip) => (
          <Marker
            key={trip.id}
            coordinate={{
              latitude: parseFloat(trip.lat!),
              longitude: parseFloat(trip.lng!),
            }}
            title={trip.name}
            pinColor={CostMarkerColors[trip.kosten_stufe ?? 0] || BrandColors.primary}
            onPress={() => onMarkerPress?.(trip.id)}
          />
        ))}
      </MapView>

      {/* Show error overlay if there's a render error */}
      {renderError && (
        <View style={[styles.errorOverlay, { backgroundColor: 'rgba(255,0,0,0.9)' }]}>
          <Text style={styles.errorTitle}>Karten-Fehler</Text>
          <Text style={styles.errorText} selectable>{renderError}</Text>
          <TouchableOpacity
            onPress={handleCopyDebugInfo}
            style={styles.copyButtonError}
          >
            <Text style={styles.copyButtonText}>📋 Debug-Info kopieren</Text>
          </TouchableOpacity>
        </View>
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
    width: "100%",
    height: "100%",
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
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  fallbackText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  debugBox: {
    marginTop: Spacing.lg,
    padding: Spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    width: "100%",
    maxWidth: 320,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  debugText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: Spacing.md,
  },
  copyButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 8,
    alignItems: "center",
  },
  copyButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  errorOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.md,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  errorTitle: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
    marginBottom: Spacing.sm,
  },
  errorText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: Spacing.md,
  },
  copyButtonError: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 8,
    alignItems: "center",
  },
});
