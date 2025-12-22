import { useRouter, useFocusEffect } from "expo-router";
import { useState, useCallback, useEffect, useRef } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
  Dimensions,
  Alert,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import Swipeable from "react-native-gesture-handler/Swipeable";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, BrandColors, Spacing, BorderRadius, CostColors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuth } from "@/hooks/use-auth";
import { getUserTrips, toggleTripFavorite, toggleTripDone, removeUserTrip, type UserTrip } from "@/lib/supabase-api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Map UserTrip from API to display type
type Trip = UserTrip & {
  title: string;
  destination: string;
  cost: string;
  image: string | null;
};

const COST_LABELS: Record<number, string> = {
  0: "Kostenlos",
  1: "Günstig",
  2: "Mittel",
  3: "Teuer",
  4: "Sehr teuer",
};

function TripListItem({
  trip,
  onPress,
  onToggleFavorite,
  onToggleDone,
  onDelete,
}: {
  trip: Trip;
  onPress: () => void;
  onToggleFavorite: () => void;
  onToggleDone: () => void;
  onDelete: () => void;
}) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const costColor = CostColors[trip.cost as keyof typeof CostColors] || CostColors.free;
  const swipeableRef = useRef<Swipeable>(null);

  const renderRightActions = (progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
    const opacity = dragX.interpolate({
      inputRange: [-80, -20, 0],
      outputRange: [1, 0.8, 0],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.deleteAction}>
        <Pressable
          onPress={() => {
            swipeableRef.current?.close();
            onDelete();
          }}
          style={styles.deleteButton}
        >
          <View style={styles.deleteIconContainer}>
            <IconSymbol name="trash.fill" size={22} color="#FFFFFF" />
          </View>
        </Pressable>
      </View>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      overshootRight={false}
      containerStyle={{ marginBottom: Spacing.md }}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.tripItem,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            opacity: pressed ? 0.9 : 1,
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
        </View>

        {/* Content */}
        <View style={styles.tripItemContent}>
          <ThemedText style={styles.tripItemTitle} numberOfLines={1}>
            {trip.title}
          </ThemedText>
          <View style={styles.tripItemLocation}>
            <IconSymbol name="mappin.and.ellipse" size={12} color={colors.textSecondary} />
            <ThemedText style={[styles.tripItemLocationText, { color: colors.textSecondary }]} numberOfLines={1}>
              {trip.destination}
            </ThemedText>
          </View>
          <View style={styles.tripItemFooter}>
            <View style={[styles.tripCostBadge, { backgroundColor: CostColors[trip.kosten_stufe ?? 0] + "20" }]}>
              <ThemedText style={[styles.tripItemCost, { color: CostColors[trip.kosten_stufe ?? 0] }]}>
                {COST_LABELS[trip.kosten_stufe ?? 0] || trip.cost}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.tripItemActions}>
          <Pressable hitSlop={8} onPress={onToggleFavorite}>
            <IconSymbol
              name={trip.is_favorite ? "heart.fill" : "heart"}
              size={20}
              color={trip.is_favorite ? "#EF4444" : colors.textSecondary}
            />
          </Pressable>
          <Pressable hitSlop={8} onPress={onToggleDone}>
            <IconSymbol
              name="checkmark.circle.fill"
              size={20}
              color={trip.is_done ? BrandColors.primary : colors.textSecondary}
            />
          </Pressable>
        </View>
      </Pressable>
    </Swipeable>
  );
}

function EmptyState({ onExplore }: { onExplore: () => void }) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <View style={styles.emptyContainer}>
      <IconSymbol name="heart.fill" size={64} color={colors.textSecondary} />
      <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>
        Noch keine Trips gespeichert
      </ThemedText>
      <ThemedText style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        Entdecke Ausflugsziele und speichere deine Favoriten
      </ThemedText>
      <Pressable
        onPress={onExplore}
        style={[styles.exploreButton, { backgroundColor: colors.primary }]}
      >
        <IconSymbol name="magnifyingglass" size={18} color="#FFFFFF" />
        <ThemedText style={styles.exploreButtonText}>Entdecken</ThemedText>
      </Pressable>
    </View>
  );
}

function LoginPrompt({ onLogin }: { onLogin: () => void }) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <View style={styles.emptyContainer}>
      <IconSymbol name="person.fill" size={64} color={colors.textSecondary} />
      <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>
        Anmeldung erforderlich
      </ThemedText>
      <ThemedText style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        Melde dich an, um deine Trips zu verwalten
      </ThemedText>
      <Pressable
        onPress={onLogin}
        style={[styles.exploreButton, { backgroundColor: colors.primary }]}
      >
        <IconSymbol name="person.fill" size={18} color="#FFFFFF" />
        <ThemedText style={styles.exploreButtonText}>Anmelden</ThemedText>
      </Pressable>
    </View>
  );
}

export default function TripsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [filter, setFilter] = useState<"all" | "favorites" | "done">("all");
  const [refreshing, setRefreshing] = useState(false);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user trips
  const fetchTrips = useCallback(async () => {
    if (!isAuthenticated) {
      setTrips([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const data = await getUserTrips();

    console.log('[Trips] getUserTrips returned:', data.length, 'trips');
    if (data.length > 0) {
      console.log('[Trips] First trip data:', data[0]);
      console.log('[Trips] First trip primaryPhotoUrl:', data[0].primaryPhotoUrl);
      console.log('[Trips] First trip image:', (data[0] as any).image);
    }

    // Map to Trip type
    const mappedTrips: Trip[] = data.map(ut => ({
      ...ut,
      title: ut.name,
      destination: ut.adresse,
      cost: COST_LABELS[ut.kosten_stufe ?? 0],
      image: ut.primaryPhotoUrl ?? null,
    }));

    console.log('[Trips] Mapped trips, first image:', mappedTrips[0]?.image);
    setTrips(mappedTrips);
    setIsLoading(false);
  }, [isAuthenticated]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  // Auto-refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchTrips();
    }, [fetchTrips])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTrips();
    setRefreshing(false);
  }, [fetchTrips]);

  const handleTripPress = (tripId: number) => {
    router.push(`/trip/${tripId}` as any);
  };

  const handleDelete = (tripId: number, title: string) => {
    Alert.alert(
      "Aus Trips entfernen",
      `Möchtest du "${title}" wirklich aus deinen Trips entfernen?`,
      [
        { text: "Abbrechen", style: "cancel" },
        {
          text: "Entfernen",
          style: "destructive",
          onPress: async () => {
            const result = await removeUserTrip(tripId);
            if (result.success) {
              fetchTrips();
            } else {
              Alert.alert("Fehler", result.error || "Entfernen fehlgeschlagen");
            }
          },
        },
      ]
    );
  };

  const handleToggleFavorite = async (tripId: number) => {
    const result = await toggleTripFavorite(tripId);
    if (result.success) {
      fetchTrips();
    } else {
      Alert.alert("Fehler", result.error || "Fehler beim Favorisieren");
    }
  };

  const handleToggleDone = async (tripId: number) => {
    const result = await toggleTripDone(tripId);
    if (result.success) {
      fetchTrips();
    } else {
      Alert.alert("Fehler", result.error || "Fehler beim Markieren");
    }
  };

  // Filter trips
  const filteredTrips = trips.filter((trip) => {
    if (filter === "favorites") return trip.is_favorite;
    if (filter === "done") return trip.is_done;
    return true;
  });

  const filterOptions = [
    { key: "all", label: "Alle", count: trips.length },
    { key: "favorites", label: "Favoriten", count: trips.filter(t => t.is_favorite).length },
    { key: "done", label: "Erledigt", count: trips.filter(t => t.is_done).length },
  ];

  if (authLoading) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ThemedView>
    );
  }

  if (!isAuthenticated) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <ThemedText style={styles.headerTitle}>Meine Trips</ThemedText>
        </View>
        <LoginPrompt onLogin={() => router.push("/login" as any)} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>Meine Trips</ThemedText>
        <ThemedText style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          {trips?.length || 0} gespeicherte Ausflüge
        </ThemedText>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        {filterOptions.map((option) => (
          <Pressable
            key={option.key}
            onPress={() => setFilter(option.key as any)}
            style={[
              styles.filterTab,
              {
                backgroundColor: filter === option.key ? colors.primary : colors.surface,
                borderColor: filter === option.key ? colors.primary : colors.border,
              },
            ]}
          >
            <ThemedText
              style={[
                styles.filterTabText,
                { color: filter === option.key ? "#FFFFFF" : colors.text },
              ]}
            >
              {option.label}
            </ThemedText>
            <View
              style={[
                styles.filterTabBadge,
                {
                  backgroundColor: filter === option.key ? "rgba(255,255,255,0.3)" : colors.border,
                },
              ]}
            >
              <ThemedText
                style={[
                  styles.filterTabBadgeText,
                  { color: filter === option.key ? "#FFFFFF" : colors.textSecondary },
                ]}
              >
                {option.count}
              </ThemedText>
            </View>
          </Pressable>
        ))}
      </View>

      {/* Trip List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filteredTrips.length === 0 ? (
        <EmptyState onExplore={() => router.push("/(tabs)/explore")} />
      ) : (
        <FlatList
          data={filteredTrips}
          keyExtractor={(item) => item.id.toString()}
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
            <TripListItem
              key={item.id}
              trip={item}
              onPress={() => handleTripPress(item.id)}
              onToggleFavorite={() => handleToggleFavorite(item.id)}
              onToggleDone={() => handleToggleDone(item.id)}
              onDelete={() => handleDelete(item.id, item.title)}
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
    paddingTop: 16,
    paddingBottom: Spacing.sm,
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
  filterTabs: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  filterTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: "500",
  },
  filterTabBadge: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    minWidth: 20,
    alignItems: "center",
  },
  filterTabBadgeText: {
    fontSize: 11,
    fontWeight: "600",
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
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: Spacing.lg,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    marginTop: Spacing.sm,
    lineHeight: 20,
  },
  exploreButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xl,
  },
  exploreButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  tripList: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  tripItem: {
    flexDirection: "row",
    height: 120,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
    overflow: "hidden",
  },
  tripImageContainer: {
    width: 120,
    height: "100%",
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
  doneOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(34, 197, 94, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  tripItemContent: {
    flex: 1,
    padding: Spacing.sm,
    justifyContent: "center",
  },
  tripItemTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  tripItemLocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  tripItemLocationText: {
    fontSize: 12,
    flex: 1,
  },
  tripItemMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  costTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  costTagText: {
    fontSize: 11,
    fontWeight: "600",
  },
  tripItemActions: {
    justifyContent: "center",
    paddingHorizontal: Spacing.sm,
    gap: Spacing.sm,
  },
  tripItemFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  tripCostBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  tripItemCost: {
    fontSize: 11,
    fontWeight: "600",
  },
  actionButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteAction: {
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    marginLeft: 8,
    borderRadius: BorderRadius.md,
  },
  deleteButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  deleteIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
});
