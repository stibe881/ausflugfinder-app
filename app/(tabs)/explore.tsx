import { useRouter } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  TextInput,
  View,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, BrandColors, Spacing, BorderRadius, CostColors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { trpc } from "@/lib/trpc";

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
  title: string;
  description: string | null;
  destination: string;
  cost: string;
  region: string | null;
  image: string | null;
  isFavorite: number;
  latitude: string | null;
  longitude: string | null;
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

function TripCard({ trip, onPress, onFavoriteToggle }: { 
  trip: Trip; 
  onPress: () => void;
  onFavoriteToggle: () => void;
}) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

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
        {trip.image ? (
          <Image
            source={{ uri: trip.image }}
            style={styles.tripImage}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.tripImagePlaceholder, { backgroundColor: colors.surface }]}>
            <IconSymbol name="mountain.2.fill" size={32} color={colors.textSecondary} />
          </View>
        )}
        
        {/* Favorite Button */}
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            onFavoriteToggle();
          }}
          style={styles.favoriteButton}
        >
          <IconSymbol
            name={trip.isFavorite ? "heart.fill" : "heart.fill"}
            size={20}
            color={trip.isFavorite ? "#EF4444" : "#FFFFFF"}
          />
        </Pressable>
        
        {/* Cost Badge */}
        <View style={styles.costBadgeContainer}>
          <CostBadge cost={trip.cost} />
        </View>
      </View>

      {/* Content */}
      <View style={styles.tripContent}>
        <ThemedText style={styles.tripTitle} numberOfLines={2}>
          {trip.title}
        </ThemedText>
        <View style={styles.tripLocation}>
          <IconSymbol name="mappin.and.ellipse" size={14} color={colors.textSecondary} />
          <ThemedText style={[styles.tripLocationText, { color: colors.textSecondary }]} numberOfLines={1}>
            {trip.destination}
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
  const [selectedCost, setSelectedCost] = useState<string>("");
  const [refreshing, setRefreshing] = useState(false);

  // Fetch trips
  const { data: tripsData, isLoading, refetch } = trpc.trips.search.useQuery({
    keyword: keyword || undefined,
    cost: selectedCost || undefined,
    isPublic: true,
  });

  // Fetch statistics
  const { data: stats } = trpc.trips.statistics.useQuery();

  // Toggle favorite mutation
  const toggleFavoriteMutation = trpc.trips.toggleFavorite.useMutation({
    onSuccess: () => refetch(),
  });

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleTripPress = (tripId: number) => {
    router.push(`/trip/${tripId}` as any);
  };

  const handleFavoriteToggle = (tripId: number) => {
    toggleFavoriteMutation.mutate({ id: tripId });
  };

  const costFilters = [
    { key: "", label: "Alle" },
    { key: "free", label: "Kostenlos" },
    { key: "low", label: "Günstig" },
    { key: "medium", label: "Mittel" },
    { key: "high", label: "Teuer" },
  ];

  const trips = tripsData?.data || [];

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>Entdecken</ThemedText>
        <ThemedText style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          {stats?.totalActivities || 0} Ausflugsziele warten auf dich
        </ThemedText>
      </View>

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

      {/* Trips Grid */}
      {isLoading ? (
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
          data={trips}
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
              trip={item as Trip}
              onPress={() => handleTripPress(item.id)}
              onFavoriteToggle={() => handleFavoriteToggle(item.id)}
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
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
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
