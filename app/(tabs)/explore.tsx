import { useFocusEffect, useRouter, useLocalSearchParams } from "expo-router";
import { useState, useEffect, useCallback, useMemo } from "react";
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
import { Colors, BrandColors, SemanticColors, Spacing, BorderRadius, CostColors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  searchAusfluege,
  getAusflugeStatistics,
  type Ausflug,
  type AusflugWithPhoto,
  getPrimaryPhoto,
  getPrimaryPhotosForTrips,
  addUserTrip,
  getUserTrips,
  toggleTripFavorite, // Added from instruction
  toggleTripBookmarked, // Added from instruction
  getKategorieOptions, // Added from instruction
  getNiceToKnowOptions, // Added from instruction
} from "@/lib/supabase-api";
import { useAuth } from "@/hooks/use-auth";
import { useDebounce } from "@/hooks/use-debounce";
import { useLanguage } from "@/contexts/language-context";
import * as Location from "expo-location";

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
  kategorie_alt?: string | null;
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
  isBookmarked,
  onBookmarkToggle,
}: {
  trip: Trip;
  onPress: () => void;
  onFavoriteToggle: () => void;
  onAddToTrips: () => void;
  isSaved?: boolean;
  isFavorite?: boolean;
  isBookmarked?: boolean;
  onBookmarkToggle?: () => void;
}) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { t } = useLanguage();

  const getCostLabel = (level: number) => {
    switch (level) {
      case 0: return t.costFree;
      case 1: return t.cheap;
      case 2: return t.medium;
      case 3: return t.expensive;
      case 4: return t.expensive; // Using expensive for "Sehr teuer"
      default: return "";
    }
  };

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
            transition={200}
          />
        ) : (
          <View style={[styles.tripImagePlaceholder, { backgroundColor: colors.surface }]}>
            <IconSymbol name="mountain.2.fill" size={32} color={colors.textSecondary} />
          </View>
        )}

        {/* Cost Badge */}
        <View style={styles.costBadgeContainer}>
          <View style={[styles.costBadge, { backgroundColor: CostColors[trip.kosten_stufe ?? 0] + "D0" }]}>
            <ThemedText style={[styles.costBadgeText, { color: "#FFFFFF", fontSize: 10 }]}>
              {getCostLabel(trip.kosten_stufe ?? 0)}
            </ThemedText>
          </View>
        </View>

        {/* Action Buttons Overlay */}
        <View style={styles.tripCardActions}>
          {/* Favorite Button */}
          <Pressable
            onPress={onFavoriteToggle}
            style={styles.tripActionButton}
          >
            <IconSymbol
              name={isFavorite ? "heart.fill" : "heart"}
              size={18}
              color={isFavorite ? "#EF4444" : "#FFFFFF"}
            />
          </Pressable>

          {/* Bookmark Button */}
          <Pressable
            onPress={onBookmarkToggle}
            style={styles.tripActionButton}
          >
            <IconSymbol
              name={isBookmarked ? "bookmark.fill" : "bookmark"}
              size={18}
              color={isBookmarked ? colors.primary : "#FFFFFF"}
            />
          </Pressable>
        </View>
      </View>

      {/* Content */}
      <View style={styles.tripContent}>
        <ThemedText style={styles.tripTitle} numberOfLines={2}>
          {trip.name}
        </ThemedText>

        <View style={styles.tripLocation}>
          <IconSymbol name="mappin.and.ellipse" size={12} color={colors.textSecondary} />
          <ThemedText style={[styles.tripLocationText, { color: colors.textSecondary }]} numberOfLines={1}>
            {trip.region || trip.adresse.split(",")[0]}
          </ThemedText>
          {isSaved && (
            <IconSymbol name="checkmark.circle.fill" size={14} color={SemanticColors.success} />
          )}
        </View>

        {/* Category Badges */}
        {trip.kategorie_alt && (
          <View style={styles.tripCategories}>
            {trip.kategorie_alt.split(',').slice(0, 2).map((cat: string, index: number) => (
              <View key={index} style={[styles.tripCategoryBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <ThemedText style={[styles.tripCategoryText, { color: colors.textSecondary }]} numberOfLines={1}>
                  {cat.trim()}
                </ThemedText>
              </View>
            ))}
          </View>
        )}
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
  const { t } = useLanguage();

  const SORT_OPTIONS: Array<{ key: "name" | "cost_asc" | "cost_desc" | "region" | "distance"; label: string }> = [
    { key: "name", label: t.sortByName },
    { key: "distance", label: t.sortByDistance },
    { key: "cost_asc", label: t.sortByPriceAsc },
    { key: "cost_desc", label: t.sortByPriceDesc },
    { key: "region", label: t.sortByRegion },
  ];

  const [keyword, setKeyword] = useState("");
  const [selectedCost, setSelectedCost] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const [sortBy, setSortBy] = useState<"name" | "cost_asc" | "cost_desc" | "region" | "distance">("name");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [trips, setTrips] = useState<Ausflug[]>([]);
  const [stats, setStats] = useState<{ totalActivities: number; freeActivities: number; totalRegions: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userTripIds, setUserTripIds] = useState<Set<number>>(new Set());
  const [favoriteTripIds, setFavoriteTripIds] = useState<Set<number>>(new Set());
  const [doneTripIds, setDoneTripIds] = useState<Set<number>>(new Set());
  const [bookmarkedTripIds, setBookmarkedTripIds] = useState<Set<number>>(new Set());
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    favorites: false,
    notDone: false,
    bookmarked: false, // New filter
  });
  const { isAuthenticated } = useAuth();
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const params = useLocalSearchParams();

  // Debounced filter values to prevent rapid API calls
  const debouncedKeyword = useDebounce(keyword, 500);
  const debouncedCost = useDebounce(selectedCost, 500);

  // Handle URL params for view mode and cost filter
  useEffect(() => {
    if (params.view === 'map') {
      setViewMode('map');
    } else if (params.view === 'list') {
      setViewMode('grid');
    }
    if (params.cost === 'free') {
      setSelectedCost('free');
    }
  }, [params.view, params.cost]); // React to URL parameter changes


  // Fetch trips with filters and photos
  // Refactored to accept arguments for immediate usage (e.g. refresh) or use debounced values
  const fetchTrips = useCallback(async (searchKeyword?: string, searchCost?: string | null) => {
    setIsLoading(true);
    // Use arguments if provided, otherwise fallback to debounced values (or undefined if not yet ready, though usually passed)
    // Note: In useEffect we pass debounced. In refresh we pass current state.
    const queryKeyword = searchKeyword === undefined ? debouncedKeyword : searchKeyword;
    const queryCost = searchCost === undefined ? debouncedCost : searchCost;

    const kostenStufe = queryCost ? { free: 0, low: 1, medium: 2, high: 3, very_high: 4 }[queryCost] : undefined;
    const result = await searchAusfluege({
      keyword: queryKeyword || undefined,
      kostenStufe,
    });

    // Fetch primary photos in batches to avoid overwhelming the network
    // OPTIMIZED: Use bulk fetch for photos to prevent N+1 DB calls and memory crash
    const ausflugIds = result.data.map(t => t.id);
    const photoMap = await getPrimaryPhotosForTrips(ausflugIds);

    const tripsWithPhotos = result.data.map(ausflug => ({
      ...ausflug,
      primaryPhotoUrl: photoMap[ausflug.id] || null,
    }));

    setTrips(tripsWithPhotos as any);
    setIsLoading(false);
  }, []); // Removed dependencies on state to avoid closure staleness, passed as args now

  // Get user location for distance sorting
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    })();
  }, []);

  // Calculate distance using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km   
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Filter and sort trips
  const filteredTrips = trips.filter(trip => {
    // Apply "Favorites Only" filter
    if (activeFilters.favorites && !favoriteTripIds.has(trip.id)) {
      return false;
    }
    // Apply "Bookmarked" filter
    if (activeFilters.bookmarked && !bookmarkedTripIds.has(trip.id)) {
      return false;
    }
    // Apply "Not Done" filter
    if (activeFilters.notDone && doneTripIds.has(trip.id)) {
      return false;
    }
    return true;
  });

  const sortedTrips = [...filteredTrips].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return (a.name || "").localeCompare(b.name || "");
      case "cost_asc":
        return (a.kosten_stufe ?? 0) - (b.kosten_stufe ?? 0);
      case "cost_desc":
        return (b.kosten_stufe ?? 0) - (a.kosten_stufe ?? 0);
      case "region":
        return (a.region || "").localeCompare(b.region || "");
      case "distance":
        if (!userLocation) return 0;
        const latA = parseFloat(a.lat || "0");
        const lngA = parseFloat(a.lng || "0");
        const latB = parseFloat(b.lat || "0");
        const lngB = parseFloat(b.lng || "0");
        if (!latA || !lngA) return 1;
        if (!latB || !lngB) return -1;
        const distA = calculateDistance(userLocation.latitude, userLocation.longitude, latA, lngA);
        const distB = calculateDistance(userLocation.latitude, userLocation.longitude, latB, lngB);
        return distA - distB;
      default:
        return 0;
    }
  });

  // Fetch statistics
  const fetchStats = useCallback(async () => {
    const result = await getAusflugeStatistics();
    setStats(result);
  }, []);

  // Load user trips status
  const loadUserTrips = useCallback(async () => {
    if (!isAuthenticated) {
      setUserTripIds(new Set());
      setFavoriteTripIds(new Set());
      setDoneTripIds(new Set());
      setBookmarkedTripIds(new Set());
      return;
    }

    const userTrips = await getUserTrips();
    const savedIds = new Set(userTrips.filter((t: any) => !t.is_favorite).map((t: any) => t.id));
    const favoriteIds = new Set(userTrips.filter((t: any) => t.is_favorite).map((t: any) => t.id));
    const doneIds = new Set(userTrips.filter((t: any) => t.is_done).map((t: any) => t.id));
    const bookmarkedIds = new Set(userTrips.filter((t: any) => t.is_bookmarked).map((t: any) => t.id));
    setUserTripIds(savedIds);
    setFavoriteTripIds(favoriteIds);
    setDoneTripIds(doneIds);
    setBookmarkedTripIds(bookmarkedIds);
  }, [isAuthenticated]);

  // Initial load
  useEffect(() => {
    fetchTrips();
    fetchStats();
    loadUserTrips();
  }, []);

  // Refetch when DEBOUNCED filters change
  useEffect(() => {
    fetchTrips(debouncedKeyword, debouncedCost);
  }, [debouncedKeyword, debouncedCost, fetchTrips]);

  // Reload user trips when focused to keep sync with detail page changes
  useFocusEffect(
    useCallback(() => {
      loadUserTrips();
    }, [loadUserTrips])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTrips(keyword, selectedCost); // Use current state for manual refresh
    await fetchStats();
    await loadUserTrips();
    setRefreshing(false);
  }, [fetchTrips, fetchStats, loadUserTrips, keyword, selectedCost]);

  const handleTripPress = (tripId: number) => {
    router.push(`/trip/${tripId}` as any);
  };

  const handleFavoriteToggle = async (tripId: number) => {
    await addUserTrip(tripId, true);
    // Reload user trips to update UI
    await loadUserTrips();
  };

  const handleAddToTrips = async (tripId: number) => {
    await addUserTrip(tripId);
    // Reload user trips to update UI
    await loadUserTrips();
  };

  const costFilters = [
    { key: "", label: t.all },
    { key: "free", label: t.free },
    { key: "low", label: t.cheap },
    { key: "medium", label: t.medium },
    { key: "high", label: t.expensive },
  ];

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <ThemedText style={styles.headerTitle}>{t.explore}</ThemedText>
          <ThemedText style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {stats?.totalActivities || 0} {t.activitiesWaiting}
          </ThemedText>
        </View>
        <View style={styles.headerButtons}>
          {/* Filter Button */}
          <Pressable
            onPress={() => setShowFilterMenu(!showFilterMenu)}
            style={[
              styles.viewModeButton,
              {
                backgroundColor: (activeFilters.favorites || activeFilters.notDone || activeFilters.bookmarked) ? colors.primary + "20" : colors.surface,
                borderColor: (activeFilters.favorites || activeFilters.notDone || activeFilters.bookmarked) ? colors.primary : colors.border
              }
            ]}
          >
            <IconSymbol
              name="slider.horizontal.3"
              size={20}
              color={colors.primary}
            />
          </Pressable>
          {/* Sort Button */}
          <Pressable
            onPress={() => setShowSortMenu(!showSortMenu)}
            style={[styles.viewModeButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <IconSymbol
              name="arrow.up.arrow.down"
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

      {/* Backdrop for closing menus */}
      {(showFilterMenu || showSortMenu) && (
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={() => {
            setShowFilterMenu(false);
            setShowSortMenu(false);
          }}
        />
      )}

      {/* Filter Menu Dropdown */}
      {showFilterMenu && (
        <View style={[styles.sortMenu, { backgroundColor: colors.card, borderColor: colors.border, right: Spacing.lg + 50 }]}>
          <Pressable
            onPress={() => setActiveFilters(prev => ({ ...prev, favorites: !prev.favorites }))}
            style={[
              styles.sortMenuItem,
              activeFilters.favorites && { backgroundColor: colors.primary + "15" },
            ]}
          >
            <ThemedText
              style={[
                styles.sortMenuItemText,
                activeFilters.favorites && { color: colors.primary, fontWeight: "600" },
              ]}
            >
              Favoriten
            </ThemedText>
            {activeFilters.favorites && (
              <IconSymbol name="checkmark" size={16} color={colors.primary} />
            )}
          </Pressable>

          <Pressable
            onPress={() => setActiveFilters(prev => ({ ...prev, notDone: !prev.notDone }))}
            style={[
              styles.sortMenuItem,
              activeFilters.notDone && { backgroundColor: colors.primary + "15" },
            ]}
          >
            <ThemedText
              style={[
                styles.sortMenuItemText,
                activeFilters.notDone && { color: colors.primary, fontWeight: "600" },
              ]}
            >
              Noch nicht gemacht
            </ThemedText>
            {activeFilters.notDone && (
              <IconSymbol name="checkmark" size={16} color={colors.primary} />
            )}
          </Pressable>

          <Pressable
            onPress={() => setActiveFilters(prev => ({ ...prev, bookmarked: !prev.bookmarked }))}
            style={[
              styles.sortMenuItem,
              activeFilters.bookmarked && { backgroundColor: colors.primary + "15" },
            ]}
          >
            <ThemedText
              style={[
                styles.sortMenuItemText,
                activeFilters.bookmarked && { color: colors.primary, fontWeight: "600" },
              ]}
            >
              Gemerkt
            </ThemedText>
            {activeFilters.bookmarked && (
              <IconSymbol name="checkmark" size={16} color={colors.primary} />
            )}
          </Pressable>
        </View>
      )}

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
            placeholder={t.searchTrips}
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
      {/* <View style={styles.filterContainer}>
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
      </View> */}

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
            {t.noResultsFound}
          </ThemedText>
          <ThemedText style={[styles.emptySubtext, { color: colors.textDisabled }]}>
            {t.tryDifferentTerms}
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
              isSaved={doneTripIds.has(item.id)}
              isFavorite={favoriteTripIds.has(item.id)}
              isBookmarked={bookmarkedTripIds.has(item.id)}
              onBookmarkToggle={async () => {
                // Optimistic update
                const isBookmarked = bookmarkedTripIds.has(item.id);
                const newBookmarkedIds = new Set(bookmarkedTripIds);
                if (isBookmarked) {
                  newBookmarkedIds.delete(item.id);
                } else {
                  newBookmarkedIds.add(item.id);
                }
                setBookmarkedTripIds(newBookmarkedIds);

                const result = await toggleTripBookmarked(item.id);
                if (!result.success) {
                  // Revert on failure
                  setBookmarkedTripIds(bookmarkedTripIds);
                } else {
                  // Reload user trips to sync all states
                  loadUserTrips();
                }
              }}
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
  tripCategories: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  tripCategoryBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  tripCategoryText: {
    fontSize: 10,
    fontWeight: "500",
  },
});
