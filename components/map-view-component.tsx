import { Platform, StyleSheet, View } from "react-native";
import Constants from "expo-constants";

import { ThemedText } from "./themed-text";
import { GoogleMapsWeb } from "./google-maps-web";
import { Colors, BrandColors, Spacing, CostColors } from "@/constants/theme";
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

  // For Expo Go or when native maps aren't available, show a fallback
  // react-native-maps requires a development build and won't work in Expo Go
  return (
    <View style={[styles.fallback, { backgroundColor: colors.surface }]}>
      <View style={[styles.fallbackIcon, { backgroundColor: colors.primary + "15" }]}>
        <ThemedText style={styles.fallbackEmoji}>🗺️</ThemedText>
      </View>
      <ThemedText style={styles.fallbackTitle}>
        Kartenansicht
      </ThemedText>
      <ThemedText style={[styles.fallbackText, { color: colors.textSecondary }]}>
        {tripsWithCoords.length} Ausflüge mit Standort
      </ThemedText>
      {isExpoGo && (
        <ThemedText style={[styles.fallbackNote, { color: colors.textSecondary }]}>
          Die Karte ist nur im Development Build verfügbar.{"\n"}
          Verwende "eas build" für die volle Funktionalität.
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
  fallbackNote: {
    fontSize: 13,
    textAlign: "center",
    fontStyle: "italic",
    paddingHorizontal: Spacing.lg,
  },
});
