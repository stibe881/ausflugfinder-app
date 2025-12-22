import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  TextInput,
  View,
  Dimensions,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { MapViewComponent } from "@/components/map-view-component";
import { Colors, BrandColors, Spacing, BorderRadius, CostColors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { searchAusfluege, getAusflugeStatistics, type Ausflug, type AusflugWithPhoto, getPrimaryPhoto, addUserTrip } from "@/lib/supabase-api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.md) / 2;

const COST_LABELS: Record<string, string> = {
  free: "Kostenlos",
  low: "CHF 🪙",
  medium: "CHF 🪙🪙",
  high: "CHF 🪙🪙🪙",
  very_high: "CHF 🪙🪙🪙🪙",
};

const REGIONS = [
  "Aargau", "Appenzell Ausserrhoden", "Appenzell Innerrhoden", "Basel-Landschaft",
  "Basel-Stadt", "Bern", "Fribourg", "Genève", "Glarus", "Graubünden", "Jura",
  "Luzern", "Neuchâtel", "Nidwalden", "Obwalden", "Schaffhausen", "Schwyz",
  "Solothurn", "St. Gallen", "Tessin", "Thurgau", "Uri", "Valais", "Vaud",
  "Zug", "Zürich", "Deutschland", "Frankreich", "Italien", "Österreich",
];

type Trip = {
  id: number;
  name: string;
  beschreibung: string | null;
  adresse: string;
  kosten_stufe: number | null;
  region: string | null;
  lat: string | null;
  lng: string | null;
  primaryPhotoUrl?: string | null;
};

function CostBadge({ cost }: { cost: string }) {
  const color = CostColors[cost as keyof typeof CostColors] || CostColors.free;
  return (
    <View style={[styles.costBadge, { backgroundColor: color + "20" }]}>
      <ThemedText style={[styles.costBadgeText, { color }]}>
        {COST_LABELS[cost] || cost}
      </ThemedText>
    </View>
  );
}

function TripCard({
  trip,
  onPress,
  onFavoriteToggle,
  onAddToTrips,
  isSaved,
  isFavorite,
}: {
  trip: Trip;
  onPress: () => void;
  onFavoriteToggle: () => void;
  onAddToTrips: () => void;
  isSaved?: boolean;
  isFavorite?: boolean;
}) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  // Local state for immediate feedback
  const [localIsFavorite, setLocalIsFavorite] = useState(isFavorite || false);
  const [localIsSaved, setLocalIsSaved] = useState(isSaved || false);

  const handleFavoritePress = () => {
    setLocalIsFavorite(!localIsFavorite);
    onFavoriteToggle();
  };

  const handleAddPress = () => {
    setLocalIsSaved(!localIsSaved);
    onAddToTrips();
  };

  // Debug log
  console.log(`[TripCard] ${trip.name} - Photo URL:`, trip.primaryPhotoUrl);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tripCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      {/* Image */}
      <View style={styles.tripImageContainer}>
        {trip.primaryPhotoUrl ? (
          <Image
            source={{ uri: trip.primaryPhotoUrl }}
            style={styles.tripImage}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.tripImagePlaceholder, { backgroundColor: colors.surface }]}>
            <IconSymbol name="mountain.2.fill" size={32} color={colors.textSecondary} />
          </View>
        )}

        {/* Actions Overlay */}
        <View style={styles.tripCardActions}>
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              handleFavoritePress();
            }}
            style={[styles.tripActionButton, { backgroundColor: localIsFavorite ? "#EF4444" : colors.surface + "CC" }]}
          >
            <IconSymbol name="heart.fill" size={20} color={localIsFavorite ? "#FFFFFF" : "#EF4444"} />
          </Pressable>
        </View>

        {/* Cost Badge */}
        <View style={styles.costBadgeContainer}>
          <CostBadge cost={trip.kosten_stufe !== null ? ['free', 'low', 'medium', 'high', 'very_high'][trip.kosten_stufe] : 'free'} />
        </View>
      </View>

      {/* Content */}
      <View style={styles.tripContent}>
        <ThemedText style={styles.tripTitle} numberOfLines={2}>
          {trip.name}
        </ThemedText>
        <View style={styles.tripLocation}>
          <IconSymbol name="mappin.and.ellipse" size={14} color={colors.textSecondary} />
          <ThemedText style={[styles.tripLocationText, { color: colors.textSecondary }]} numberOfLines={1}>
            {trip.adresse}
          </ThemedText>
        </View>
      </View>
    </Pressable>
  );
}

function CategoryChip({
  label,
  selected,
  onPress
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.categoryChip,
        {
          backgroundColor: selected ? colors.primary : colors.surface,
          borderColor: selected ? colors.primary : colors.border,
        },
      ]}
    >
      <ThemedText
        style={[
          styles.categoryChipText,
          { color: selected ? "#FFFFFF" : colors.text },
        ]}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}

export default function ExploreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [keyword, setKeyword] = useState("");
  const [selectedCost, setSelectedCost] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const [sortBy, setSortBy] = useState<"name" | "cost_asc" | "cost_desc" | "region">("name");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [trips, setTrips] = useState<Ausflug[]>([]);
  const [stats, setStats] = useState<{ totalActivities: number; freeActivities: number; totalRegions: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const params = useLocalSearchParams();

  // Handle URL params for view mode and cost filter
  useEffect(() => {
    if (params.view === 'map') {
      setViewMode('map');
    }
    if (params.cost === 'free') {
      setSelectedCost('free');
    }
  }, [params]);

  const SORT_OPTIONS = [
    { key: "name", label: "Name (A-Z)" },
    { key: "cost_asc", label: "Preis (aufsteigend)" },
    { key: "cost_desc", label: "Preis (absteigend)" },
    { key: "region", label: "Region" },
  ] as const;

  // Fetch trips with filters and photos
  const fetchTrips = useCallback(async () => {
    setIsLoading(true);
    const kostenStufe = selectedCost ? { free: 0, low: 1, medium: 2, high: 3, very_high: 4 }[selectedCost] : undefined;
    const result = await searchAusfluege({
      keyword: keyword || undefined,
      kostenStufe,
    });

    // Fetch primary photos for all trips
    const tripsWithPhotos = await Promise.all(
      result.data.map(async (ausflug) => {
        const primaryPhotoUrl = await getPrimaryPhoto(ausflug.id);
        return { ...ausflug, primaryPhotoUrl };
      })
    );

    setTrips(tripsWithPhotos as any);
    setIsLoading(false);
  }, [keyword, selectedCost]);

  // Sort trips based on selected sort option
  const sortedTrips = [...trips].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return (a.name || "").localeCompare(b.name || "");
      case "cost_asc":
        return (a.kosten_stufe ?? 0) - (b.kosten_stufe ?? 0);
      case "cost_desc":
        return (b.kosten_stufe ?? 0) - (a.kosten_stufe ?? 0);
      case "region":
        return (a.region || "").localeCompare(b.region || "");
      default:
        return 0;
    }
  });

  // Fetch statistics
  const fetchStats = useCallback(async () => {
    const result = await getAusflugeStatistics();
    setStats(result);
  }, []);

  // Initial load
  useEffect(() => {
    fetchTrips();
    fetchStats();
  }, []);

  // Refetch when filters change
  useEffect(() => {
    fetchTrips();
  }, [keyword, selectedCost, fetchTrips]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTrips();
    await fetchStats();
    setRefreshing(false);
  }, [fetchTrips, fetchStats]);

  const handleTripPress = (tripId: number) => {
    router.push(`/trip/${tripId}` as any);
  };

  const handleFavoriteToggle = async (tripId: number) => {
    await addUserTrip(tripId, true);
    // Silentfeedback - status updates happen in parent
  };

  const handleAddToTrips = async (tripId: number) => {
    await addUserTrip(tripId);
    // Silent feedback - status updates happen in parent
  };

  const costFilters = [
    { key: "", label: "Alle" },
    { key: "free", label: "Kostenlos" },
    { key: "low", label: "Günstig" },
    { key: "medium", label: "Mittel" },
    { key: "high", label: "Teuer" },
  ];

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <ThemedText style={styles.headerTitle}>Entdecken</ThemedText>
          <ThemedText style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {stats?.totalActivities || 0} Ausflugsziele warten auf dich
          </ThemedText>
        </View>
        <View style={styles.headerButtons}>
          {/* Sort Button */}
          <Pressable
            onPress={() => setShowSortMenu(!showSortMenu)}
            style={[styles.viewModeButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <IconSymbol
              name="line.3.horizontal.decrease"
              size={20}
              color={colors.primary}
            />
          </Pressable>
          {/* View Mode Button */}
          <Pressable
            onPress={() => setViewMode(viewMode === "grid" ? "map" : "grid")}
            style={[styles.viewModeButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <IconSymbol
              name={viewMode === "grid" ? "map" : "square.grid.2x2"}
              size={20}
              color={colors.primary}
            />
          </Pressable>
        </View>
      </View>

      {/* Sort Menu Dropdown */}
      {showSortMenu && (
        <View style={[styles.sortMenu, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {SORT_OPTIONS.map((option) => (
            <Pressable
              key={option.key}
              onPress={() => {
                setSortBy(option.key);
                setShowSortMenu(false);
              }}
              style={[
                styles.sortMenuItem,
                sortBy === option.key && { backgroundColor: colors.primary + "15" },
              ]}
            >
              <ThemedText
                style={[
                  styles.sortMenuItemText,
                  sortBy === option.key && { color: colors.primary, fontWeight: "600" },
                ]}
              >
                {option.label}
              </ThemedText>
              {sortBy === option.key && (
                <IconSymbol name="checkmark" size={16} color={colors.primary} />
              )}
            </Pressable>
          ))}
        </View>
      )}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <IconSymbol name="magnifyingglass" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Suche nach Ausflügen..."
            placeholderTextColor={colors.textSecondary}
            value={keyword}
            onChangeText={setKeyword}
          />
          {keyword.length > 0 && (
            <Pressable onPress={() => setKeyword("")}>
              <IconSymbol name="xmark" size={18} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Cost Filter Chips */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={costFilters}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <CategoryChip
              label={item.label}
              selected={selectedCost === item.key}
              onPress={() => setSelectedCost(item.key)}
            />
          )}
        />
      </View>

      {/* Content - Grid or Map */}
      {viewMode === "map" ? (
        <MapViewComponent
          trips={trips as any}
          onMarkerPress={handleTripPress}
        />
      ) : isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : trips.length === 0 ? (
        <View style={styles.emptyContainer}>
          <IconSymbol name="magnifyingglass" size={48} color={colors.textSecondary} />
          <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
            Keine Ausflüge gefunden
          </ThemedText>
          <ThemedText style={[styles.emptySubtext, { color: colors.textDisabled }]}>
            Versuche andere Suchbegriffe oder Filter
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={sortedTrips}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={styles.tripRow}
          contentContainerStyle={styles.tripList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => (
            <TripCard
              trip={item as any}
              onPress={() => handleTripPress(item.id)}
              onFavoriteToggle={() => handleFavoriteToggle(item.id)}
              onAddToTrips={() => handleAddToTrips(item.id)}
            />
          )}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: Platform.OS === "web" ? 16 : 24,
    paddingBottom: Spacing.md,
  },
  viewModeButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  headerButtons: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  sortMenu: {
    position: "absolute",
    top: 110,
    right: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
    minWidth: 180,
  },
  sortMenuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
  },
  sortMenuItemText: {
    fontSize: 14,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginTop: Spacing.sm,
    lineHeight: 36,
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: Spacing.xs,
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Spacing.xs,
  },
  filterContainer: {
    paddingVertical: Spacing.sm,
  },
  filterList: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    marginRight: Spacing.sm,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: Spacing.lg,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
    marginTop: Spacing.sm,
  },
  tripList: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  tripRow: {
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  tripCard: {
    width: CARD_WIDTH,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  tripImageContainer: {
    width: "100%",
    height: CARD_WIDTH * 0.75,
    position: "relative",
  },
  tripImage: {
    width: "100%",
    height: "100%",
  },
  tripImagePlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  tripCardActions: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
    flexDirection: "row",
    gap: Spacing.xs,
  },
  tripActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  favoriteButton: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  costBadgeContainer: {
    position: "absolute",
    bottom: Spacing.sm,
    left: Spacing.sm,
  },
  costBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  costBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  tripContent: {
    padding: Spacing.sm,
  },
  tripTitle: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 18,
  },
  tripLocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  tripLocationText: {
    fontSize: 12,
    flex: 1,
  },
});
