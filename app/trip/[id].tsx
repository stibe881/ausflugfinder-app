import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { Colors, Spacing, BorderRadius, CostColors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getAusflugById, getPrimaryPhoto, deleteAusflug, type Ausflug, addUserTrip, removeUserTrip, toggleTripFavorite, toggleTripDone, getUserTrips, getCurrentWeather, getWeatherForecast, getWeatherIconUrl, type CurrentWeather, type DailyForecast } from "@/lib/supabase-api";
import { useAdmin } from "@/contexts/admin-context";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/contexts/language-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const COST_LABELS: Record<number, string> = {
  0: "Kostenlos",
  1: "Günstig (CHF 10-30)",
  2: "Mittel (CHF 30-60)",
  3: "Teuer (CHF 60-100)",
  4: "Sehr teuer (CHF 100+)",
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

// Helper function to translate seasons
function translateSeasons(seasons: string, t: any): string {
  if (!seasons) return '';

  const seasonMap: Record<string, string> = {
    'Frühling': t.spring,
    'Sommer': t.summer,
    'Herbst': t.autumn,
    'Winter': t.winter,
    'Spring': t.spring,
    'Summer': t.summer,
    'Autumn': t.autumn,
    'Fall': t.autumn,
  };

  // Split by comma and translate each season
  return seasons
    .split(',')
    .map(s => s.trim())
    .map(s => seasonMap[s] || s)
    .join(', ');
}

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { canEdit } = useAdmin();

  // State for trip data
  const [trip, setTrip] = useState<Ausflug | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();

  // Weather state
  const [currentWeather, setCurrentWeather] = useState<CurrentWeather | null>(null);
  const [forecast, setForecast] = useState<DailyForecast[]>([]);
  const [showForecast, setShowForecast] = useState(false);
  const [weatherLoading, setWeatherLoading] = useState(false);

  // Fetch trip data and photo from Supabase
  useEffect(() => {
    async function loadTrip() {
      if (!id) return;
      setIsLoading(true);
      const result = await getAusflugById(Number(id));
      setTrip(result);

      // Fetch primary photo
      if (result) {
        const photo = await getPrimaryPhoto(result.id);
        setPhotoUrl(photo);
      }

      // Check if trip is saved and get its status
      if (isAuthenticated) {
        const userTrips = await getUserTrips();
        const savedTrip = userTrips.find(t => t.id === Number(id));
        if (savedTrip) {
          setIsSaved(true);
          setIsFavorite(savedTrip.is_favorite);
          setIsDone(savedTrip.is_done);
        } else {
          setIsSaved(false);
          setIsFavorite(false);
          setIsDone(false);
        }
      }

      setIsLoading(false);
    }
    loadTrip();
  }, [id, isAuthenticated]);

  // Fetch weather data
  useEffect(() => {
    async function loadWeather() {
      if (!trip?.lat || !trip?.lng) {
        console.log('[Weather] No coordinates available:', { lat: trip?.lat, lng: trip?.lng });
        return;
      }

      console.log('[Weather] Loading weather for:', { lat: trip.lat, lng: trip.lng });
      setWeatherLoading(true);
      const lat = parseFloat(trip.lat);
      const lng = parseFloat(trip.lng);

      // Get current weather
      const weatherResult = await getCurrentWeather(lat, lng);
      console.log('[Weather] API Result:', weatherResult);

      if (weatherResult.success && weatherResult.weather) {
        console.log('[Weather] Setting current weather:', weatherResult.weather);
        setCurrentWeather(weatherResult.weather);
      } else {
        console.error('[Weather] Failed to load weather:', weatherResult.error);
      }

      setWeatherLoading(false);
    }

    loadWeather();
  }, [trip]);

  // Load forecast when user expands the forecast section
  const handleShowForecast = async () => {
    if (!showForecast && forecast.length === 0 && trip?.lat && trip?.lng) {
      setWeatherLoading(true);
      const lat = parseFloat(trip.lat);
      const lng = parseFloat(trip.lng);

      const forecastResult = await getWeatherForecast(lat, lng);
      if (forecastResult.success && forecastResult.forecast) {
        setForecast(forecastResult.forecast);
      }

      setWeatherLoading(false);
    }
    setShowForecast(!showForecast);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Schau dir diesen Ausflug an: ${trip?.name}\n${trip?.adresse}`,
        title: trip?.name,
      });
    } catch (error) {
      console.error("Share error:", error);
    }
  };

  const handleOpenMap = () => {
    if (trip?.lat && trip?.lng) {
      const url = `https://www.google.com/maps/search/?api=1&query=${trip.lat},${trip.lng}`;
      Linking.openURL(url);
    } else if (trip?.adresse) {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trip.adresse)}`;
      Linking.openURL(url);
    }
  };

  const handleOpenWebsite = () => {
    if (trip?.website_url) {
      Linking.openURL(trip.website_url);
    }
  };

  const handleDelete = () => {
    if (!trip) return;

    Alert.alert(
      "Ausflug löschen",
      `Möchtest du "${trip.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`,
      [
        { text: "Abbrechen", style: "cancel" },
        {
          text: "Löschen",
          style: "destructive",
          onPress: async () => {
            const result = await deleteAusflug(trip.id);
            if (result.success) {
              Alert.alert("Gelöscht", "Der Ausflug wurde erfolgreich gelöscht.");
              router.back();
            } else {
              Alert.alert("Fehler", result.error || "Fehler beim Löschen.");
            }
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    router.push(`/trip/edit/${id}` as any);
  };

  const handleAddToTrips = async () => {
    if (!trip || !isAuthenticated) {
      Alert.alert("Anmeldung erforderlich", "Bitte melde dich an, um Trips zu speichern.");
      return;
    }

    const result = await addUserTrip(trip.id);
    if (result.success) {
      setIsSaved(true);
    } else {
      Alert.alert("Fehler", result.error || "Konnte nicht gespeichert werden");
    }
  };

  const handleRemoveFromTrips = async () => {
    if (!trip) return;

    Alert.alert(
      "Aus Trips entfernen",
      `Möchtest du "${trip.name}" wirklich aus deinen Trips entfernen?`,
      [
        { text: "Abbrechen", style: "cancel" },
        {
          text: "Entfernen",
          style: "destructive",
          onPress: async () => {
            const result = await removeUserTrip(trip.id);
            if (result.success) {
              setIsSaved(false);
              setIsFavorite(false);
              setIsDone(false);
            } else {
              Alert.alert("Fehler", result.error || "Konnte nicht entfernt werden");
            }
          },
        },
      ]
    );
  };

  const handleToggleFavorite = async () => {
    if (!trip || !isSaved) return;
    const result = await toggleTripFavorite(trip.id);
    if (result.success) {
      setIsFavorite(!isFavorite);
    } else {
      Alert.alert("Fehler", result.error || "Fehler beim Favorisieren");
    }
  };

  const handleToggleDone = async () => {
    if (!trip || !isSaved) return;
    const result = await toggleTripDone(trip.id);
    if (result.success) {
      setIsDone(!isDone);
    } else {
      Alert.alert("Fehler", result.error || "Fehler beim Markieren");
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

  const kostenStufe = trip.kosten_stufe ?? 0;
  const costLabel = COST_LABELS[kostenStufe] || "Kostenlos";
  const costColors = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#DC2626"];
  const costColor = costColors[kostenStufe] || costColors[0];

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
              style={({ pressed }) => ({
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                justifyContent: "center",
                alignItems: "center",
                marginLeft: 16,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
            </Pressable>
          ),
          headerRight: () => (
            <Pressable
              onPress={handleShare}
              style={({ pressed }) => ({
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                justifyContent: "center",
                alignItems: "center",
                marginRight: 16,
                opacity: pressed ? 0.7 : 1,
              })}
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
          {photoUrl ? (
            <Image
              source={{ uri: photoUrl }}
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
            <ThemedText style={styles.costBadgeText}>{costLabel}</ThemedText>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Title & Location */}
          <ThemedText style={styles.title}>{trip.name}</ThemedText>
          <View style={styles.locationRow}>
            <IconSymbol name="mappin.and.ellipse" size={16} color={colors.textSecondary} />
            <ThemedText style={[styles.locationText, { color: colors.textSecondary }]}>
              {trip.adresse}
            </ThemedText>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <View style={styles.actionButtonRow}>
              {(trip.lat && trip.lng) || trip.adresse ? (
                <Pressable
                  onPress={handleOpenMap}
                  style={[styles.actionButtonHalf, { backgroundColor: colors.primary }]}
                >
                  <IconSymbol name="map.fill" size={20} color="#FFFFFF" />
                  <ThemedText style={styles.actionButtonLargeText}>Karte öffnen</ThemedText>
                </Pressable>
              ) : null}

              {trip.website_url ? (
                <Pressable
                  onPress={handleOpenWebsite}
                  style={[styles.actionButtonHalf, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}
                >
                  <IconSymbol name="globe" size={20} color={colors.primary} />
                  <ThemedText style={[styles.actionButtonLargeText, { color: colors.text }]}>Website</ThemedText>
                </Pressable>
              ) : null}
            </View>
          </View>

          {/* User Trip Actions */}
          {isAuthenticated && (
            <View style={styles.userTripActions}>
              <Pressable
                onPress={handleToggleFavorite}
                style={[styles.userTripButton, { backgroundColor: isFavorite ? "#EF4444" : colors.surface, borderWidth: 1, borderColor: isFavorite ? "#EF4444" : colors.border }]}
              >
                <IconSymbol name={isFavorite ? "heart.fill" : "heart"} size={20} color={isFavorite ? "#FFFFFF" : colors.text} />
                <ThemedText style={[styles.userTripButtonText, { color: isFavorite ? "#FFFFFF" : colors.text }]}>
                  {isFavorite ? "Favorit" : "Als Favorit"}
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={handleToggleDone}
                style={[styles.userTripButton, { backgroundColor: isDone ? "#10B981" : colors.surface, borderWidth: 1, borderColor: isDone ? "#10B981" : colors.border }]}
              >
                <IconSymbol name="checkmark.circle.fill" size={20} color={isDone ? "#FFFFFF" : colors.text} />
                <ThemedText style={[styles.userTripButtonText, { color: isDone ? "#FFFFFF" : colors.text }]}>
                  {isDone ? "Gemacht" : "Als gemacht"}
                </ThemedText>
              </Pressable>
            </View>
          )}

          {/* Weather */}
          {currentWeather && (
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Wetter</ThemedText>

              {/* Current Weather */}
              <View style={[styles.weatherCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.weatherCurrent}>
                  {currentWeather.icon && (
                    <Image
                      source={{ uri: getWeatherIconUrl(currentWeather.icon) }}
                      style={styles.weatherIcon}
                      contentFit="contain"
                    />
                  )}
                  <View style={styles.weatherCurrentInfo}>
                    <ThemedText style={styles.weatherTemp}>{currentWeather.temp}°C</ThemedText>
                    <ThemedText style={[styles.weatherDescription, { color: colors.textSecondary }]}>
                      {currentWeather.description}
                    </ThemedText>
                  </View>
                </View>

                {/* Forecast Toggle Button */}
                <Pressable
                  onPress={handleShowForecast}
                  style={({ pressed }) => [
                    styles.forecastButton,
                    { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }
                  ]}
                  disabled={weatherLoading}
                >
                  {weatherLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <ThemedText style={styles.forecastButtonText}>
                        {showForecast ? "7-Tage Vorhersage ausblenden" : "7-Tage Vorhersage anzeigen"}
                      </ThemedText>
                      <IconSymbol
                        name={showForecast ? "chevron.up" : "chevron.down"}
                        size={16}
                        color="#FFFFFF"
                      />
                    </>
                  )}
                </Pressable>
              </View>

              {/* 7-Day Forecast */}
              {showForecast && forecast.length > 0 && (
                <View style={[styles.forecastContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  {forecast.map((day, index) => (
                    <View key={day.date} style={[styles.forecastDay, index > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
                      <ThemedText style={[styles.forecastDate, { color: colors.textSecondary }]}>
                        {new Date(day.date).toLocaleDateString('de-CH', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </ThemedText>
                      <Image
                        source={{ uri: getWeatherIconUrl(day.icon) }}
                        style={styles.forecastIcon}
                        contentFit="contain"
                      />
                      <ThemedText style={styles.forecastTemp}>
                        {day.temp_max}° / {day.temp_min}°
                      </ThemedText>
                      <ThemedText style={[styles.forecastDescription, { color: colors.textSecondary }]}>
                        {day.description}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Description */}
          {trip.beschreibung ? (
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Beschreibung</ThemedText>
              <ThemedText style={[styles.description, { color: colors.textSecondary }]}>
                {trip.beschreibung}
              </ThemedText>
            </View>
          ) : null}

          {/* Details */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Details</ThemedText>

            {trip.region ? (
              <InfoRow icon="location.fill" label="Region" value={trip.region} />
            ) : null}

            {trip.land ? (
              <InfoRow icon="flag.fill" label="Land" value={trip.land} />
            ) : null}

            {trip.parkplatz ? (
              <InfoRow icon="parkingsign" label="Parkplatz" value={trip.parkplatz} />
            ) : null}

            {trip.altersempfehlung ? (
              <InfoRow icon="person.2.fill" label="Altersempfehlung" value={trip.altersempfehlung} />
            ) : null}

            {trip.jahreszeiten ? (
              <InfoRow
                icon="calendar"
                label="Jahreszeiten"
                value={translateSeasons(trip.jahreszeiten, t)}
              />
            ) : null}
          </View>

          {/* Nice to Know */}
          {trip.nice_to_know ? (
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Gut zu wissen</ThemedText>
              <View style={[styles.infoBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <IconSymbol name="lightbulb.fill" size={20} color={colors.primary} />
                <ThemedText style={[styles.infoBoxText, { color: colors.textSecondary }]}>
                  {trip.nice_to_know}
                </ThemedText>
              </View>
            </View>
          ) : null}

          {/* Admin Actions */}
          {canEdit && (
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Admin-Aktionen</ThemedText>
              <View style={styles.adminActions}>
                <Pressable
                  onPress={handleEdit}
                  style={[styles.adminButton, { backgroundColor: colors.primary }]}
                >
                  <IconSymbol name="pencil" size={20} color="#FFFFFF" />
                  <ThemedText style={styles.adminButtonText}>Bearbeiten</ThemedText>
                </Pressable>
                <Pressable
                  onPress={handleDelete}
                  style={[styles.adminButton, { backgroundColor: "#EF4444" }]}
                >
                  <IconSymbol name="trash.fill" size={20} color="#FFFFFF" />
                  <ThemedText style={styles.adminButtonText}>Löschen</ThemedText>
                </Pressable>
              </View>
            </View>
          )}
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: insets.bottom + 32 }} />
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
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  backButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 8,
  },
  heroContainer: {
    height: 300,
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  costBadge: {
    position: "absolute",
    bottom: Spacing.lg,
    right: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
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
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
    lineHeight: 36,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  locationText: {
    fontSize: 16,
  },
  actionButtons: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  actionButtonLarge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: Spacing.sm,
  },
  actionButtonLargeText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  actionButtonRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  actionButtonHalf: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: Spacing.md,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "500",
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  infoBoxText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  adminActions: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  adminButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  adminButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  userTripActions: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  userTripButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  userTripButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  // Weather styles
  weatherCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  weatherCurrent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  weatherIcon: {
    width: 70,
    height: 70,
    flexShrink: 0,
  },
  weatherCurrentInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  weatherTemp: {
    fontSize: 28,
    fontWeight: "bold",
    lineHeight: 34,
  },
  weatherDescription: {
    fontSize: 14,
    marginTop: 4,
    textTransform: "capitalize",
  },
  forecastButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  forecastButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  forecastContainer: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: Spacing.md,
    overflow: "hidden",
  },
  forecastDay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
  },
  forecastDate: {
    fontSize: 14,
    width: 80,
  },
  forecastIcon: {
    width: 40,
    height: 40,
  },
  forecastTemp: {
    fontSize: 14,
    fontWeight: "600",
    width: 70,
    textAlign: "center",
  },
  forecastDescription: {
    fontSize: 12,
    flex: 1,
    textAlign: "right",
    textTransform: "capitalize",
  },
});
