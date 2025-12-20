import { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import { Loader } from "@googlemaps/js-api-loader";

import { ThemedText } from "./themed-text";
import { Colors, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

type Trip = {
  id: number;
  name: string;
  lat: string | null;
  lng: string | null;
};

type GoogleMapsWebProps = {
  trips: Trip[];
  onMarkerPress?: (tripId: number) => void;
};

export function GoogleMapsWeb({ trips, onMarkerPress }: GoogleMapsWebProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  // Filter trips with valid coordinates
  const tripsWithCoords = trips.filter(
    (trip) => trip.lat && trip.lng && !isNaN(parseFloat(trip.lat)) && !isNaN(parseFloat(trip.lng))
  );

  useEffect(() => {
    if (!mapRef.current || tripsWithCoords.length === 0) return;

    const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error("[GoogleMaps] API key not found");
      return;
    }

    const loader = new Loader({
      apiKey,
      version: "weekly",
    });

    (loader as any)
      .load()
      .then((google: any) => {
        if (!mapRef.current) return;

        // Calculate center and bounds
        const bounds = new google.maps.LatLngBounds();
        tripsWithCoords.forEach((trip) => {
          const lat = parseFloat(trip.lat!);
          const lng = parseFloat(trip.lng!);
          bounds.extend({ lat, lng });
        });

        const center = bounds.getCenter();

        // Create map
        const map = new google.maps.Map(mapRef.current, {
          center: { lat: center.lat(), lng: center.lng() },
          zoom: 8,
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
        });

        googleMapRef.current = map;

        // Clear old markers
        markersRef.current.forEach((marker) => marker.setMap(null));
        markersRef.current = [];

        // Add markers
        tripsWithCoords.forEach((trip) => {
          const lat = parseFloat(trip.lat!);
          const lng = parseFloat(trip.lng!);

          const marker = new google.maps.Marker({
            position: { lat, lng },
            map,
            title: trip.name,
          });

          // Info window
          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div style="padding: 8px; font-family: system-ui;">
                <h3 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600;">${trip.name}</h3>
                <p style="margin: 0; font-size: 12px; color: #666;">${lat.toFixed(4)}, ${lng.toFixed(4)}</p>
              </div>
            `,
          });

          marker.addListener("click", () => {
            infoWindow.open(map, marker);
            if (onMarkerPress) {
              onMarkerPress(trip.id);
            }
          });

          markersRef.current.push(marker);
        });

        // Fit bounds
        map.fitBounds(bounds);
      })
      .catch((error: any) => {
        console.error("[GoogleMaps] Error loading Google Maps:", error);
      });

    return () => {
      // Cleanup markers
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
    };
  }, [tripsWithCoords, onMarkerPress]);

  if (tripsWithCoords.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.surface }]}>
        <ThemedText style={styles.emptyText}>
          📍 Keine Ausflugsziele mit Standort gefunden
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <div
        ref={mapRef}
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 12,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
  },
});
