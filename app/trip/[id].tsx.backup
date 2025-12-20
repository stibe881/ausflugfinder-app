import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useState, useCallback } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  Dimensions,
  Share,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, BrandColors, Spacing, BorderRadius, CostColors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const COST_LABELS: Record<string, string> = {
  free: "Kostenlos",
  low: "Günstig (CHF 10-30)",
  medium: "Mittel (CHF 30-60)",
  high: "Teuer (CHF 60-100)",
  very_high: "Sehr teuer (CHF 100+)",
};

const ROUTE_TYPE_LABELS: Record<string, string> = {
  round_trip: "Rundweg",
  one_way: "Einweg",
  location: "Standort",
};

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <View style={styles.infoRow}>
      <View style={[styles.infoIcon, { backgroundColor: colors.primary + "15" }]}>
        <IconSymbol name={icon as any} size={18} color={colors.primary} />
      </View>
      <View style={styles.infoContent}>
        <ThemedText style={[styles.infoLabel, { color: colors.textSecondary }]}>
          {label}
        </ThemedText>
        <ThemedText style={styles.infoValue}>{value}</ThemedText>
      </View>
    </View>
  );
}

function ActionButton({
  icon,
  label,
  onPress,
  color,
  active,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  color?: string;
  active?: boolean;
}) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const buttonColor = color || colors.primary;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        {
          backgroundColor: active ? buttonColor + "20" : colors.surface,
          borderColor: active ? buttonColor : colors.border,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <IconSymbol
        name={icon as any}
        size={20}
        color={active ? buttonColor : colors.textSecondary}
      />
      <ThemedText
        style={[
          styles.actionButtonText,
          { color: active ? buttonColor : colors.textSecondary },
        ]}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { isAuthenticated } = useAuth();

  // Fetch trip data
  const { data: trip, isLoading, refetch } = trpc.trips.getById.useQuery(
    { id: Number(id) },
    { enabled: !!id }
  );

  // Fetch photos
  const { data: photos } = trpc.tripPhotos.list.useQuery(
    { tripId: Number(id) },
    { enabled: !!id }
  );

  // Fetch videos
  const { data: videos } = trpc.tripVideos.list.useQuery(
    { tripId: Number(id) },
    { enabled: !!id }
  );

  // Mutations
  const toggleFavoriteMutation = trpc.trips.toggleFavorite.useMutation({
    onSuccess: () => refetch(),
  });
  const toggleDoneMutation = trpc.trips.toggleDone.useMutation({
    onSuccess: () => refetch(),
  });

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Schau dir diesen Ausflug an: ${trip?.title}\n${trip?.destination}`,
        title: trip?.title,
      });
    } catch (error) {
      console.error("Share error:", error);
    }
  };

  const handleOpenMap = () => {
    if (trip?.latitude && trip?.longitude) {
      const url = `https://www.google.com/maps/search/?api=1&query=${trip.latitude},${trip.longitude}`;
      Linking.openURL(url);
    } else if (trip?.address) {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trip.address)}`;
      Linking.openURL(url);
    }
  };

  const handleOpenWebsite = () => {
    if (trip?.websiteUrl) {
      Linking.openURL(trip.websiteUrl);
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </ThemedView>
    );
  }

  if (!trip) {
    return (
      <ThemedView style={styles.errorContainer}>
        <IconSymbol name="exclamationmark.triangle.fill" size={48} color={colors.textSecondary} />
        <ThemedText style={[styles.errorText, { color: colors.textSecondary }]}>
          Ausflug nicht gefunden
        </ThemedText>
        <Pressable
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: colors.primary }]}
        >
          <ThemedText style={styles.backButtonText}>Zurück</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  const costColor = CostColors[trip.cost as keyof typeof CostColors] || CostColors.free;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "",
          headerTransparent: true,
          headerLeft: () => (
            <Pressable
              onPress={() => router.back()}
              style={[styles.headerButton, { backgroundColor: "rgba(0,0,0,0.3)" }]}
            >
              <IconSymbol name="chevron.left" size={20} color="#FFFFFF" />
            </Pressable>
          ),
          headerRight: () => (
            <Pressable
              onPress={handleShare}
              style={[styles.headerButton, { backgroundColor: "rgba(0,0,0,0.3)" }]}
            >
              <IconSymbol name="square.and.arrow.up" size={20} color="#FFFFFF" />
            </Pressable>
          ),
        }}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          {trip.image ? (
            <Image
              source={{ uri: trip.image }}
              style={styles.heroImage}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.heroPlaceholder, { backgroundColor: colors.surface }]}>
              <IconSymbol name="mountain.2.fill" size={64} color={colors.textSecondary} />
            </View>
          )}
          <View style={styles.heroOverlay} />
          
          {/* Cost Badge */}
          <View style={[styles.costBadge, { backgroundColor: costColor }]}>
            <ThemedText style={styles.costBadgeText}>
              {COST_LABELS[trip.cost] || trip.cost}
            </ThemedText>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Title & Location */}
          <ThemedText style={styles.title}>{trip.title}</ThemedText>
          <View style={styles.locationRow}>
            <IconSymbol name="mappin.and.ellipse" size={16} color={colors.textSecondary} />
            <ThemedText style={[styles.location, { color: colors.textSecondary }]}>
              {trip.destination}
            </ThemedText>
          </View>

          {/* Action Buttons */}
          {isAuthenticated && (
            <View style={styles.actionButtons}>
              <ActionButton
                icon="heart.fill"
                label="Favorit"
                onPress={() => toggleFavoriteMutation.mutate({ id: trip.id })}
                color="#EF4444"
                active={trip.isFavorite}
              />
              <ActionButton
                icon="checkmark.circle.fill"
                label="Erledigt"
                onPress={() => toggleDoneMutation.mutate({ id: trip.id })}
                color={BrandColors.primary}
                active={trip.isDone}
              />
              <ActionButton
                icon="map.fill"
                label="Karte"
                onPress={handleOpenMap}
              />
            </View>
          )}

          {/* Description */}
          {trip.description && (
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Beschreibung</ThemedText>
              <ThemedText style={[styles.description, { color: colors.textSecondary }]}>
                {trip.description}
              </ThemedText>
            </View>
          )}

          {/* Info Section */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Details</ThemedText>
            <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {trip.region && (
                <InfoRow icon="mappin.and.ellipse" label="Region" value={trip.region} />
              )}
              {trip.routeType && (
                <InfoRow icon="figure.walk" label="Art" value={ROUTE_TYPE_LABELS[trip.routeType] || trip.routeType} />
              )}
              {trip.ageRecommendation && (
                <InfoRow icon="person.2.fill" label="Alter" value={trip.ageRecommendation} />
              )}
              {(trip.durationMin || trip.durationMax) && (
                <InfoRow
                  icon="clock.fill"
                  label="Dauer"
                  value={
                    trip.durationMin && trip.durationMax
                      ? `${trip.durationMin} - ${trip.durationMax} Std.`
                      : `${trip.durationMin || trip.durationMax} Std.`
                  }
                />
              )}
              {(trip.distanceMin || trip.distanceMax) && (
                <InfoRow
                  icon="figure.walk"
                  label="Distanz"
                  value={
                    trip.distanceMin && trip.distanceMax
                      ? `${trip.distanceMin} - ${trip.distanceMax} km`
                      : `${trip.distanceMin || trip.distanceMax} km`
                  }
                />
              )}
            </View>
          </View>

          {/* Nice to Know */}
          {trip.niceToKnow && (
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Gut zu wissen</ThemedText>
              <View style={[styles.niceToKnowCard, { backgroundColor: BrandColors.secondary + "10", borderColor: BrandColors.secondary + "30" }]}>
                <IconSymbol name="info.circle.fill" size={20} color={BrandColors.secondary} />
                <ThemedText style={[styles.niceToKnowText, { color: colors.text }]}>
                  {trip.niceToKnow}
                </ThemedText>
              </View>
            </View>
          )}

          {/* Contact Section */}
          {(trip.websiteUrl || trip.contactEmail || trip.contactPhone || trip.address) && (
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Kontakt</ThemedText>
              <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {trip.address && (
                  <Pressable onPress={handleOpenMap}>
                    <InfoRow icon="mappin.and.ellipse" label="Adresse" value={trip.address} />
                  </Pressable>
                )}
                {trip.websiteUrl && (
                  <Pressable onPress={handleOpenWebsite}>
                    <InfoRow icon="globe" label="Website" value="Webseite öffnen" />
                  </Pressable>
                )}
                {trip.contactEmail && (
                  <Pressable onPress={() => Linking.openURL(`mailto:${trip.contactEmail}`)}>
                    <InfoRow icon="paperplane.fill" label="E-Mail" value={trip.contactEmail} />
                  </Pressable>
                )}
                {trip.contactPhone && (
                  <Pressable onPress={() => Linking.openURL(`tel:${trip.contactPhone}`)}>
                    <InfoRow icon="bubble.left.fill" label="Telefon" value={trip.contactPhone} />
                  </Pressable>
                )}
              </View>
            </View>
          )}

          {/* Photos */}
          {photos && photos.length > 0 && (
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Fotos ({photos.length})</ThemedText>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.photoList}
              >
                {photos.map((photo) => (
                  <Image
                    key={photo.id}
                    source={{ uri: photo.photoUrl }}
                    style={styles.photoThumbnail}
                    contentFit="cover"
                  />
                ))}
              </ScrollView>
            </View>
          )}

          {/* Videos */}
          {videos && videos.length > 0 && (
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Videos ({videos.length})</ThemedText>
              {videos.map((video) => (
                <Pressable
                  key={video.id}
                  onPress={() => {
                    const url = video.platform === "youtube"
                      ? `https://www.youtube.com/watch?v=${video.videoId}`
                      : `https://www.tiktok.com/@user/video/${video.videoId}`;
                    Linking.openURL(url);
                  }}
                  style={[styles.videoItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <IconSymbol name="video.fill" size={24} color={colors.primary} />
                  <View style={styles.videoContent}>
                    <ThemedText style={styles.videoTitle}>
                      {video.title || `${video.platform} Video`}
                    </ThemedText>
                    <ThemedText style={[styles.videoPlatform, { color: colors.textSecondary }]}>
                      {video.platform === "youtube" ? "YouTube" : "TikTok"}
                    </ThemedText>
                  </View>
                  <IconSymbol name="chevron.right" size={16} color={colors.textSecondary} />
                </Pressable>
              ))}
            </View>
          )}

          {/* Bottom Spacing */}
          <View style={{ height: insets.bottom + Spacing.xl }} />
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  errorText: {
    fontSize: 18,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  backButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  heroContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.75,
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  heroOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  costBadge: {
    position: "absolute",
    bottom: Spacing.lg,
    left: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  costBadgeText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  content: {
    padding: Spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    lineHeight: 34,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  location: {
    fontSize: 16,
  },
  actionButtons: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: "500",
  },
  section: {
    marginTop: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
  },
  infoCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    gap: Spacing.md,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "500",
    marginTop: 2,
  },
  niceToKnowCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  niceToKnowText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  photoList: {
    gap: Spacing.sm,
  },
  photoThumbnail: {
    width: 120,
    height: 90,
    borderRadius: BorderRadius.md,
  },
  videoItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  videoContent: {
    flex: 1,
  },
  videoTitle: {
    fontSize: 15,
    fontWeight: "500",
  },
  videoPlatform: {
    fontSize: 13,
    marginTop: 2,
  },
});
