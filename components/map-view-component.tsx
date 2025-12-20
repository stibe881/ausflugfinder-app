import { Platform, StyleSheet, View } from "react-native";

import { ThemedText } from "./themed-text";
import { GoogleMapsWeb } from "./google-maps-web";
import { Colors, BrandColors, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

type Trip = {
  id: number;
  name: string; // ausfluege uses 'name'
  lat: string | null; // ausfluege uses 'lat'
  lng: string | null; // ausfluege uses 'lng'
  kostenStufe: number | null;
};

type MapViewComponentProps = {
  trips: Trip[];
  onMarkerPress?: (tripId: number) => void;
};

export function MapViewComponent({ trips, onMarkerPress }: MapViewComponentProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  // Filter trips with valid coordinates
  const tripsWithCoords = trips.filter(
    (trip) => trip.lat && trip.lng && !isNaN(parseFloat(trip.lat)) && !isNaN(parseFloat(trip.lng))
  );

  // Use Google Maps for web
  if (Platform.OS === 'web') {
    return <GoogleMapsWeb trips={trips} onMarkerPress={onMarkerPress} />;
  }

  // Mobile fallback - React Native Maps would go here
  return (
    <View style={[styles.webFallback, { backgroundColor: colors.surface }]}>
      <ThemedText style={styles.webFallbackText}>
        📍 Kartenansicht ist nur in der mobilen App verfügbar
      </ThemedText>
      <ThemedText style={[styles.webFallbackSubtext, { color: colors.textSecondary }]}>
        {tripsWithCoords.length} Ausflugsziele mit Standort
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  webFallback: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  webFallbackText: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  webFallbackSubtext: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  tripsList: {
    width: "100%",
    maxWidth: 400,
    gap: Spacing.sm,
  },
  tripItem: {
    padding: Spacing.md,
    borderRadius: 8,
    borderWidth: 1,
  },
  tripTitle: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: Spacing.xs,
  },
  tripCoords: {
    fontSize: 12,
  },
  webFallbackNote: {
    fontSize: 12,
    textAlign: "center",
    marginTop: Spacing.lg,
    fontStyle: "italic",
  },
});
