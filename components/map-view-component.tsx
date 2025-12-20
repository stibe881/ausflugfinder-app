import { Platform, StyleSheet, View } from "react-native";

import { ThemedText } from "./themed-text";
import { Colors, BrandColors, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

type Trip = {
  id: number;
  title: string;
  latitude: string | null;
  longitude: string | null;
  cost: string | null;
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
    (trip) => trip.latitude && trip.longitude && !isNaN(parseFloat(trip.latitude)) && !isNaN(parseFloat(trip.longitude))
  );

  // Web fallback - Maps not supported on web
  return (
    <View style={[styles.webFallback, { backgroundColor: colors.surface }]}>
      <ThemedText style={styles.webFallbackText}>
        📍 Kartenansicht ist nur in der mobilen App verfügbar
      </ThemedText>
      <ThemedText style={[styles.webFallbackSubtext, { color: colors.textSecondary }]}>
        {tripsWithCoords.length} Ausflugsziele mit Standort
      </ThemedText>
      <View style={styles.tripsList}>
        {tripsWithCoords.slice(0, 5).map((trip) => (
          <View key={trip.id} style={[styles.tripItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ThemedText style={styles.tripTitle}>{trip.title}</ThemedText>
            <ThemedText style={[styles.tripCoords, { color: colors.textSecondary }]}>
              {parseFloat(trip.latitude!).toFixed(4)}, {parseFloat(trip.longitude!).toFixed(4)}
            </ThemedText>
          </View>
        ))}
      </View>
      <ThemedText style={[styles.webFallbackNote, { color: colors.textDisabled }]}>
        Öffne die App auf deinem Smartphone, um die interaktive Karte zu sehen
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
