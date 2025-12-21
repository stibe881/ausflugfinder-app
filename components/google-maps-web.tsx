import { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import { Loader } from "@googlemaps/js-api-loader";
import { MarkerClusterer } from "@googlemaps/markerclusterer";

import { ThemedText } from "./themed-text";
import { Colors, BrandColors, Spacing } from "@/constants/theme";
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

type GoogleMapsWebProps = {
  trips: Trip[];
  onMarkerPress?: (tripId: number) => void;
};

// Cost level colors and labels
const CostInfo: Record<number, { color: string; label: string }> = {
  0: { color: BrandColors.primary, label: "Gratis" },
  1: { color: "#22C55E", label: "Günstig" },
  2: { color: BrandColors.secondary, label: "Mittel" },
  3: { color: "#EF4444", label: "Teuer" },
  4: { color: "#7C3AED", label: "Sehr teuer" },
};

function createInfoWindowTemplate(trip: Trip): string {
  const costInfo = CostInfo[trip.kosten_stufe ?? 0];
  const imageHtml = trip.primaryPhotoUrl
    ? `<img src="${trip.primaryPhotoUrl}" style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px 8px 0 0;" />`
    : "";

  return `
    <div style="
      max-width: 280px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      cursor: pointer;
    ">
      ${imageHtml}
      <div style="padding: 12px;">
        <h3 style="
          margin: 0 0 8px 0;
          font-size: 16px;
          font-weight: 600;
          color: #1a1a1a;
          line-height: 1.3;
        ">${trip.name}</h3>
        
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
          <span style="
            display: inline-block;
            padding: 2px 8px;
            background-color: ${costInfo.color}20;
            color: ${costInfo.color};
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
          ">${costInfo.label}</span>
        </div>
        
        ${trip.region ? `<p style="margin: 4px 0 0 0; font-size: 13px; color: #666;">📍 ${trip.region}</p>` : ""}
        
        <p style="
          margin: 8px 0 0 0;
          font-size: 12px;
          color: #999;
          font-style: italic;
        ">Antippen für Details →</p>
      </div>
    </div>
  `;
}

export function GoogleMapsWeb({ trips, onMarkerPress }: GoogleMapsWebProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);

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
          styles: colorScheme === "dark" ? [
            { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
          ] : [],
        });

        googleMapRef.current = map;

        // Clear old markers and clusterer
        if (clustererRef.current) {
          clustererRef.current.clearMarkers();
        }
        markersRef.current.forEach((marker) => marker.setMap(null));
        markersRef.current = [];

        // Create markers with info windows
        const markers = tripsWithCoords.map((trip) => {
          const lat = parseFloat(trip.lat!);
          const lng = parseFloat(trip.lng!);
          const costInfo = CostInfo[trip.kosten_stufe ?? 0];

          const marker = new google.maps.Marker({
            position: { lat, lng },
            title: trip.name,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: costInfo.color,
              fillOpacity: 0.9,
              strokeColor: "#ffffff",
              strokeWeight: 2,
              scale: 10,
            },
          });

          // Create custom info window
          const infoWindow = new google.maps.InfoWindow({
            content: createInfoWindowTemplate(trip),
          });

          // Open info window on marker click
          marker.addListener("click", () => {
            // Close all other info windows
            markersRef.current.forEach((m) => {
              if (m.infoWindow && m.infoWindow !== infoWindow) {
                m.infoWindow.close();
              }
            });

            infoWindow.open(map, marker);
          });

          // Navigate to trip details when info window content is clicked
          google.maps.event.addListener(infoWindow, "domready", () => {
            const content = document.querySelector(`[data-trip-id="${trip.id}"]`) as HTMLElement;
            if (content) {
              content.style.cursor = "pointer";
              content.onclick = () => {
                if (onMarkerPress) {
                  onMarkerPress(trip.id);
                }
              };
            }
          });

          // Store info window reference
          (marker as any).infoWindow = infoWindow;

          return marker;
        });

        markersRef.current = markers;

        // Create marker clusterer (simplified, no custom algorithm)
        clustererRef.current = new MarkerClusterer({
          map,
          markers,
          renderer: {
            render: ({ count, position }: any) => {
              const color = count > 20 ? "#EF4444" : count > 10 ? BrandColors.secondary : BrandColors.primary;

              return new google.maps.Marker({
                position,
                icon: {
                  path: google.maps.SymbolPath.CIRCLE,
                  fillColor: color,
                  fillOpacity: 0.8,
                  strokeColor: "#ffffff",
                  strokeWeight: 3,
                  scale: 20,
                },
                label: {
                  text: String(count),
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: "bold",
                },
                zIndex: Number(google.maps.Marker.MAX_ZINDEX) + count,
              });
            },
          },
          onClusterClick: (_, cluster: any) => {
            const currentZoom = map.getZoom();
            if (currentZoom < 15) {
              map.setZoom(Math.min(currentZoom + 2, 15));
            }
            google.maps.event.removeListener(listener);
          });
      },
        });

  // Initial fit bounds
  map.fitBounds(bounds);
})
      .catch ((error: any) => {
  console.error("[GoogleMaps] Error loading Google Maps:", error);
});

return () => {
  // Cleanup
  if (clustererRef.current) {
    clustererRef.current.clearMarkers();
  }
  markersRef.current.forEach((marker) => {
    if ((marker as any).infoWindow) {
      (marker as any).infoWindow.close();
    }
    marker.setMap(null);
  });
  markersRef.current = [];
};
  }, [tripsWithCoords, onMarkerPress, colorScheme]);

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
