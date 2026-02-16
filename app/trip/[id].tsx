import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
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
import { ImagePager } from "@/components/ui/image-pager";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Spacing, BorderRadius, CostColors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getAusflugById, getPrimaryPhoto, getAusflugPhotos, deleteAusflug, type Ausflug, type AusflugFoto, addUserTrip, removeUserTrip, toggleTripFavorite, toggleTripDone, toggleTripBookmarked, getUserTrips, getCurrentWeather, getWeatherForecast, getWeatherIconUrl, getRainForecastToday, type CurrentWeather, type DailyForecast, getTripVouchers, openVoucherDeepLink, type TripVoucher, findGooglePlaceId, fetchOpeningHours, cacheGooglePlaceId, type OpeningHoursResult } from "@/lib/supabase-api";

import { useAdmin } from "@/contexts/admin-context";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/contexts/language-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

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
    // German (already translated)
    'frühling': t.spring,
    'sommer': t.summer,
    'herbst': t.autumn,
    // English
    'spring': t.spring,
    'summer': t.summer,
    'autumn': t.autumn,
    'fall': t.autumn,
    'winter': t.winter,
    // Special
    'all_year': 'Ganzes Jahr',
    'ganzes jahr': 'Ganzes Jahr',
  };

  // Split by comma and translate each season (case-insensitive)
  return seasons
    .split(',')
    .map(s => s.trim())
    .map(s => seasonMap[s.toLowerCase()] || s)
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
  const [allPhotos, setAllPhotos] = useState<string[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();

  // Weather state
  const [currentWeather, setCurrentWeather] = useState<CurrentWeather | null>(null);
  const [forecast, setForecast] = useState<DailyForecast[]>([]);
  const [showForecast, setShowForecast] = useState(false);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [rainInfo, setRainInfo] = useState<{ hasRain: boolean; rainText: string | null; maxPop: number }>({ hasRain: false, rainText: null, maxPop: 0 });
  const [showFullscreenImage, setShowFullscreenImage] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  // Vouchers state
  const [vouchers, setVouchers] = useState<TripVoucher[]>([]);
  const [vouchersLoading, setVouchersLoading] = useState(false);

  // Opening hours state
  const [openingHours, setOpeningHours] = useState<OpeningHoursResult | null>(null);
  const [openingHoursLoading, setOpeningHoursLoading] = useState(false);
  const [showAllHours, setShowAllHours] = useState(false);

  // Fetch trip data and photo from Supabase
  useEffect(() => {
    async function loadTrip() {
      if (!id) return;
      setIsLoading(true);
      const result = await getAusflugById(Number(id));
      setTrip(result);

      // Fetch all photos
      if (result) {
        const photos = await getAusflugPhotos(result.id);
        const photoUrls = photos.map((p: AusflugFoto) => p.full_url);
        setAllPhotos(photoUrls);

        // Also get primary photo as fallback
        const primaryPhoto = await getPrimaryPhoto(result.id);
        if (primaryPhoto) {
          setPhotoUrl(primaryPhoto);
          // If primary photo exists in list, move it to first position
          const primaryIndex = photoUrls.indexOf(primaryPhoto);
          if (primaryIndex > 0) {
            photoUrls.unshift(photoUrls.splice(primaryIndex, 1)[0]);
            setAllPhotos([...photoUrls]);
          }
        }
      }

      // Check if trip is saved and get its status
      if (isAuthenticated) {
        const userTrips = await getUserTrips();
        const savedTrip = userTrips.find(t => t.id === Number(id));
        if (savedTrip) {
          setIsSaved(true);
          setIsFavorite(savedTrip.is_favorite);
          setIsDone(savedTrip.is_done);
          setIsBookmarked(savedTrip.is_bookmarked);
        } else {
          setIsSaved(false);
          setIsFavorite(false);
          setIsDone(false);
          setIsBookmarked(false);
        }
      }

      setIsLoading(false);
    }
    loadTrip();
  }, [id, isAuthenticated]);

  // Show popup notification if configured and not dismissed
  useEffect(() => {
    async function checkPopup() {
      if (!trip) return;
      if (!trip.popup_level || trip.popup_level === 'deaktiviert') return;
      if (!trip.popup_title && !trip.popup_message) return;

      const dismissedKey = `popup_dismissed_${trip.id}`;
      const dismissedAt = await AsyncStorage.getItem(dismissedKey);
      if (dismissedAt) {
        const daysSinceDismissed = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
        if (daysSinceDismissed < 30) return; // Still within 30-day suppression
      }
      setShowPopup(true);
    }
    checkPopup();
  }, [trip]);

  // Fetch trip vouchers
  useEffect(() => {
    async function loadVouchers() {
      console.log('[loadVouchers] useEffect triggered', {
        hasTrip: !!trip,
        tripId: trip?.id,
        isAuthenticated
      });

      if (!trip || !isAuthenticated) {
        console.log('[loadVouchers] Skipping: trip or auth missing');
        return;
      }

      console.log('[loadVouchers] Loading vouchers for trip:', trip.id);
      setVouchersLoading(true);
      const voucherData = await getTripVouchers(trip.id);
      console.log('[loadVouchers] Loaded vouchers:', voucherData);
      setVouchers(voucherData);
      setVouchersLoading(false);
    }
    loadVouchers();
  }, [trip, isAuthenticated]);

  // Load opening hours from Google Places API
  useEffect(() => {
    if (!trip) return;

    async function loadOpeningHours() {
      console.log('[OpeningHours] Starting for trip:', trip!.name, 'google_place_id:', trip!.google_place_id, 'lat:', trip!.lat, 'lng:', trip!.lng);
      setOpeningHoursLoading(true);
      try {
        let placeId = trip!.google_place_id;

        // If no cached place ID, look it up
        if (!placeId) {
          console.log('[OpeningHours] No cached place ID, searching...');
          placeId = await findGooglePlaceId(trip!.name, trip!.lat, trip!.lng);
          console.log('[OpeningHours] findGooglePlaceId returned:', placeId);
          if (placeId) {
            // Cache for future use
            await cacheGooglePlaceId(trip!.id, placeId);
            console.log('[OpeningHours] Cached place ID:', placeId);
          }
        } else {
          console.log('[OpeningHours] Using cached place ID:', placeId);
        }

        if (placeId) {
          console.log('[OpeningHours] Fetching hours for placeId:', placeId);
          const hours = await fetchOpeningHours(placeId);
          console.log('[OpeningHours] fetchOpeningHours returned:', JSON.stringify(hours));
          setOpeningHours(hours);
        } else {
          console.warn('[OpeningHours] No placeId found, cannot fetch hours');
        }
      } catch (error) {
        console.error("[OpeningHours] Error:", error);
      } finally {
        setOpeningHoursLoading(false);
      }
    }

    loadOpeningHours();
  }, [trip?.id]);

  // Fetch weather data + rain info
  useEffect(() => {
    async function loadWeather() {
      if (!trip?.lat || !trip?.lng) return;

      setWeatherLoading(true);
      const lat = parseFloat(trip.lat);
      const lng = parseFloat(trip.lng);

      // Get current weather and rain forecast in parallel
      const [weatherResult, rainResult] = await Promise.all([
        getCurrentWeather(lat, lng),
        getRainForecastToday(lat, lng),
      ]);

      if (weatherResult.success && weatherResult.weather) {
        setCurrentWeather(weatherResult.weather);
      }
      setRainInfo(rainResult);

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
    const lat = trip?.lat;
    const lng = trip?.lng;
    const label = trip?.name || "Ziel";
    const address = trip?.adresse || "";

    if (!lat && !address) return;

    Alert.alert(
      "Karte öffnen",
      "Wähle eine App zur Navigation",
      [
        {
          text: "Apple Maps",
          onPress: () => {
            const url = lat && lng
              ? `http://maps.apple.com/?ll=${lat},${lng}&q=${encodeURIComponent(label)}`
              : `http://maps.apple.com/?q=${encodeURIComponent(address)}`;
            Linking.openURL(url);
          },
        },
        {
          text: "Google Maps",
          onPress: () => {
            const url = lat && lng
              ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
              : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
            Linking.openURL(url);
          },
        },
        {
          text: "Abbrechen",
          style: "cancel",
        },
      ]
    );
  };

  const handleOpenWebsite = () => {
    if (trip?.website_url) {
      Linking.openURL(trip.website_url);
    }
  };

  const handleDelete = () => {
    if (!trip) return;

    Alert.alert(
      t.deleteTrip,
      `${t.deleteTripConfirm.replace('diesen Ausflug', `"${trip.name}"`)}`,
      [
        { text: t.cancel, style: "cancel" },
        {
          text: t.delete,
          style: "destructive",
          onPress: async () => {
            const result = await deleteAusflug(trip.id);
            if (result.success) {
              Alert.alert(t.deleted, t.deletedSuccess);
              router.back();
            } else {
              Alert.alert(t.error, result.error || t.deleteError);
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
              setIsBookmarked(false);
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
    if (!trip) return;

    // Optimistic update
    const newIsDone = !isDone;
    setIsDone(newIsDone);

    // If marking as done, also mark as saved
    if (newIsDone && !isSaved) {
      setIsSaved(true);
    }

    const result = await toggleTripDone(trip.id);
    if (!result.success) {
      // Revert on error
      setIsDone(!newIsDone);
      if (newIsDone && !isSaved) setIsSaved(false); // Revert saved state only if we toggled it
      Alert.alert("Fehler", result.error || "Fehler beim Markieren");
    }
  };

  const handleToggleBookmark = async () => {
    if (!trip) return;

    // Optimistic update
    const newIsBookmarked = !isBookmarked;
    setIsBookmarked(newIsBookmarked);
    if (newIsBookmarked) setIsSaved(true);

    const result = await toggleTripBookmarked(trip.id);
    if (!result.success) {
      // Revert on failure
      setIsBookmarked(!newIsBookmarked);
      Alert.alert("Fehler", result.error || "Fehler beim Merken");
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
  const getCostLabel = (level: number) => {
    switch (level) {
      case 0: return t.costFree;
      case 1: return t.costCheap;
      case 2: return t.costMedium;
      case 3: return t.costExpensive;
      case 4: return t.costVeryExpensive;
      default: return t.costFree;
    }
  };
  const costLabel = getCostLabel(kostenStufe);
  const costColors = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#DC2626"];
  const costColor = costColors[kostenStufe] || costColors[0];

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <View style={[styles.pageContainer, { backgroundColor: colors.background }]}>
        <View style={styles.heroContainer}>
          {/* Custom header buttons - no iOS glass effect */}
          <View style={{ position: 'absolute', top: insets.top + 4, left: 12, right: 12, zIndex: 10, flexDirection: 'row', justifyContent: 'space-between' }} pointerEvents="box-none">
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => ({
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                justifyContent: "center",
                alignItems: "center",
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
            </Pressable>
            <Pressable
              onPress={handleShare}
              style={({ pressed }) => ({
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                justifyContent: "center",
                alignItems: "center",
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <IconSymbol name="square.and.arrow.up" size={20} color="#FFFFFF" />
            </Pressable>
          </View>
          {allPhotos.length > 0 ? (
            <>
              <ImagePager
                style={styles.pagerView}
                initialPage={0}
                onPageSelected={(e) => setCurrentPhotoIndex(e.nativeEvent.position)}
              >
                {allPhotos.map((photoUrl, index) => (
                  <Pressable key={`page-${index}`} style={styles.page} onPress={() => setShowFullscreenImage(true)}>
                    <Image
                      source={{ uri: photoUrl }}
                      style={styles.heroImage}
                      contentFit="cover"
                    />
                  </Pressable>
                ))}
              </ImagePager>

              {/* Pagination Dots */}
              {allPhotos.length > 1 && (
                <View style={styles.paginationContainer}>
                  {allPhotos.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.paginationDot,
                        index === currentPhotoIndex && styles.paginationDotActive
                      ]}
                    />
                  ))}
                </View>
              )}
            </>
          ) : photoUrl ? (
            <Pressable onPress={() => setShowFullscreenImage(true)}>
              <Image
                source={{ uri: photoUrl }}
                style={styles.heroImage}
                contentFit="cover"
              />
            </Pressable>
          ) : (
            <View style={[styles.heroPlaceholder, { backgroundColor: colors.surface }]}>
              <IconSymbol name="mountain.2.fill" size={64} color={colors.textSecondary} />
            </View>
          )}
          <View style={styles.heroOverlay} pointerEvents="none" />

          {trip?.kategorie_alt && (
            <View style={styles.categoryBadge} pointerEvents="none">
              {trip.kategorie_alt.split(',').map((cat, index) => (
                <View key={index} style={styles.categoryBadgeItem}>
                  <ThemedText style={styles.categoryBadgeText}>{cat.trim()}</ThemedText>
                </View>
              ))}
            </View>
          )}

          {/* Cost Badge */}
          <View style={[styles.costBadge, { backgroundColor: costColor }]} pointerEvents="none">
            <ThemedText style={styles.costBadgeText}>{costLabel}</ThemedText>
          </View>
        </View>

        <ScrollView
          style={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        >

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
                    <ThemedText style={styles.actionButtonLargeText}>{t.openMap}</ThemedText>
                  </Pressable>
                ) : null}

                {trip.website_url ? (
                  <Pressable
                    onPress={handleOpenWebsite}
                    style={[
                      styles.actionButtonHalf,
                      { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }
                    ]}
                  >
                    <IconSymbol name="globe" size={20} color={colors.primary} />
                    <ThemedText style={[styles.actionButtonLargeText, { color: colors.text }]}>{t.website}</ThemedText>
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
                  <IconSymbol name={isDone ? "checkmark.circle.fill" : "checkmark.circle"} size={20} color={isDone ? "#FFFFFF" : colors.text} />
                  <ThemedText style={[styles.userTripButtonText, { color: isDone ? "#FFFFFF" : colors.text }]}>
                    {isDone ? "Gemacht" : "Als gemacht"}
                  </ThemedText>
                </Pressable>
                <Pressable
                  onPress={handleToggleBookmark}
                  style={[styles.userTripButton, { backgroundColor: isBookmarked ? colors.primary : colors.surface, borderWidth: 1, borderColor: isBookmarked ? colors.primary : colors.border }]}
                >
                  <IconSymbol name={isBookmarked ? "bookmark.fill" : "bookmark"} size={20} color={isBookmarked ? "#FFFFFF" : colors.text} />
                  <ThemedText style={[styles.userTripButtonText, { color: isBookmarked ? "#FFFFFF" : colors.text }]}>
                    {isBookmarked ? "Gemerkt" : "Merken"}
                  </ThemedText>
                </Pressable>
              </View>
            )}

            {/* Opening Hours */}
            {(openingHours || openingHoursLoading) && (
              <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>🕐 Öffnungszeiten</ThemedText>

                {openingHoursLoading ? (
                  <View style={[styles.weatherCard, { backgroundColor: colors.surface, borderColor: colors.border, alignItems: 'center', paddingVertical: 20 }]}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <ThemedText style={[styles.infoLabel, { color: colors.textSecondary, marginTop: 8 }]}>
                      Öffnungszeiten werden geladen...
                    </ThemedText>
                  </View>
                ) : openingHours ? (
                  <Pressable
                    onPress={() => setShowAllHours(!showAllHours)}
                    style={[styles.weatherCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  >
                    {/* Compact: Open/Closed + Today */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        {openingHours.isOpen !== null && (
                          <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingHorizontal: 10,
                            paddingVertical: 5,
                            borderRadius: 6,
                            backgroundColor: openingHours.isOpen ? '#10B98115' : '#EF444415',
                            marginRight: 10,
                          }}>
                            <View style={{
                              width: 8,
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: openingHours.isOpen ? '#10B981' : '#EF4444',
                              marginRight: 6,
                            }} />
                            <ThemedText style={{
                              fontSize: 14,
                              fontWeight: '600',
                              color: openingHours.isOpen ? '#10B981' : '#EF4444',
                            }}>
                              {openingHours.isOpen ? 'Geöffnet' : 'Geschlossen'}
                            </ThemedText>
                          </View>
                        )}
                        {/* Today's hours */}
                        {openingHours.weekdayText.length > 0 && (() => {
                          const today = new Date().getDay();
                          // weekdayText: index 0 = Monday, JS getDay: 0=Sun
                          const todayIndex = today === 0 ? 6 : today - 1;
                          const todayText = openingHours.weekdayText[todayIndex];
                          // Extract just the hours part (after the colon)
                          const hoursOnly = todayText?.includes(':') ? todayText.substring(todayText.indexOf(':') + 1).trim() : todayText;
                          return (
                            <ThemedText style={{ fontSize: 13, color: colors.textSecondary, flex: 1 }} numberOfLines={1}>
                              {hoursOnly}
                            </ThemedText>
                          );
                        })()}
                      </View>
                      <IconSymbol
                        name={showAllHours ? "chevron.up" : "chevron.down"}
                        size={16}
                        color={colors.textSecondary}
                      />
                    </View>

                    {/* Expanded: All Days */}
                    {showAllHours && openingHours.weekdayText.length > 0 && (
                      <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 }}>
                        {openingHours.weekdayText.map((dayText: string, index: number) => {
                          const today = new Date().getDay();
                          const dayIndex = (index + 1) % 7;
                          const isToday = dayIndex === today;

                          return (
                            <View
                              key={index}
                              style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                paddingVertical: 5,
                                paddingHorizontal: 8,
                                borderRadius: 6,
                                backgroundColor: isToday ? colors.primary + '10' : 'transparent',
                              }}
                            >
                              <ThemedText style={{
                                fontSize: 14,
                                fontWeight: isToday ? '600' : '400',
                                color: isToday ? colors.primary : colors.text,
                                flex: 1,
                              }}>
                                {dayText}
                              </ThemedText>
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </Pressable>
                ) : null}
              </View>
            )}

            {/* Weather – compact like opening hours */}
            {(currentWeather || weatherLoading) && (
              <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>🌤️ Wetter</ThemedText>

                {weatherLoading && !currentWeather ? (
                  <View style={[styles.weatherCard, { backgroundColor: colors.surface, borderColor: colors.border, alignItems: 'center', paddingVertical: 20 }]}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <ThemedText style={[styles.infoLabel, { color: colors.textSecondary, marginTop: 8 }]}>
                      Wetter wird geladen...
                    </ThemedText>
                  </View>
                ) : currentWeather ? (
                  <Pressable
                    onPress={handleShowForecast}
                    style={[styles.weatherCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  >
                    {/* Compact: Icon + Temp + Description + Rain */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        {currentWeather.icon && (
                          <Image
                            source={{ uri: getWeatherIconUrl(currentWeather.icon) }}
                            style={{ width: 36, height: 36, marginRight: 8 }}
                            contentFit="contain"
                          />
                        )}
                        <ThemedText style={{ fontSize: 18, fontWeight: '700', marginRight: 8 }}>
                          {currentWeather.temp}°C
                        </ThemedText>
                        <ThemedText style={{ fontSize: 14, color: colors.textSecondary, flex: 1 }} numberOfLines={1}>
                          {currentWeather.description}
                        </ThemedText>
                      </View>
                      {rainInfo.rainText && (
                        <View style={{ backgroundColor: '#EF444415', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginLeft: 6 }}>
                          <ThemedText style={{ fontSize: 11, color: '#EF4444', fontWeight: '600' }}>
                            🌧️ {rainInfo.rainText}
                          </ThemedText>
                        </View>
                      )}
                      <IconSymbol
                        name={showForecast ? "chevron.up" : "chevron.down"}
                        size={16}
                        color={colors.textSecondary}
                        style={{ marginLeft: 8 }}
                      />
                    </View>

                    {/* Expanded: 7-Day Forecast */}
                    {showForecast && forecast.length > 0 && (
                      <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 }}>
                        {forecast.map((day, index) => {
                          const isToday = index === 0;
                          return (
                            <View
                              key={day.date}
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingVertical: 6,
                                paddingHorizontal: 4,
                                borderRadius: 6,
                                backgroundColor: isToday ? colors.primary + '10' : 'transparent',
                              }}
                            >
                              <ThemedText style={{ fontSize: 13, width: 80, fontWeight: isToday ? '600' : '400', color: isToday ? colors.primary : colors.textSecondary }}>
                                {new Date(day.date).toLocaleDateString('de-CH', { weekday: 'short', day: 'numeric', month: 'short' })}
                              </ThemedText>
                              <Image
                                source={{ uri: getWeatherIconUrl(day.icon) }}
                                style={{ width: 28, height: 28, marginHorizontal: 4 }}
                                contentFit="contain"
                              />
                              <ThemedText style={{ fontSize: 14, fontWeight: '600', width: 65 }}>
                                {day.temp_max}° / {day.temp_min}°
                              </ThemedText>
                              <ThemedText style={{ fontSize: 13, color: colors.textSecondary, flex: 1 }} numberOfLines={1}>
                                {day.description}
                              </ThemedText>
                              {day.pop > 30 && (
                                <ThemedText style={{ fontSize: 11, color: '#3B82F6' }}>
                                  💧{day.pop}%
                                </ThemedText>
                              )}
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </Pressable>
                ) : null}

                {/* Rain Warning + Indoor Alternatives */}
                {rainInfo.hasRain && !trip.is_indoor && (
                  <Pressable
                    onPress={() => {
                      router.push({ pathname: '/(tabs)/explore', params: { indoor: 'true' } } as any);
                    }}
                    style={({ pressed }) => [{
                      marginTop: 8,
                      backgroundColor: '#FEF3C7',
                      borderRadius: 10,
                      padding: 12,
                      opacity: pressed ? 0.85 : 1,
                    }]}
                  >
                    <ThemedText style={{ fontSize: 14, color: '#92400E', marginBottom: 6 }}>
                      ⚠️ Heute Regen erwartet – dieser Ausflug ist hauptsächlich draussen
                    </ThemedText>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12 }}>
                      <ThemedText style={{ fontSize: 14, color: '#FFFFFF', fontWeight: '600' }}>
                        🏠 Indoor-Alternativen anzeigen
                      </ThemedText>
                    </View>
                  </Pressable>
                )}
              </View>
            )}

            {/* Description */}
            {trip.beschreibung ? (
              <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>{t.descriptionTitle}</ThemedText>
                <ThemedText style={[styles.description, { color: colors.textSecondary }]}>
                  {trip.beschreibung}
                </ThemedText>
              </View>
            ) : null}

            {/* Details */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>{t.detailsTitle}</ThemedText>

              {trip.altersempfehlung ? (
                <InfoRow icon="person.2.fill" label={t.ageRecommendation} value={trip.altersempfehlung} />
              ) : null}

              {trip.kategorie_alt && (trip.kategorie_alt.includes('Abenteuerweg') || trip.kategorie_alt.includes('Schnitzeljagd') || trip.kategorie_alt.includes('Wandern')) ? (
                <InfoRow icon="point.topleft.down.to.point.bottomright.curvepath.fill" label="Streckentyp" value={trip.is_rundtour ? "Rundtour" : trip.is_von_a_nach_b ? "Von A nach B" : "Nicht angegeben"} />
              ) : null}

              {trip.parkplatz_kostenlos !== null && trip.parkplatz_kostenlos !== undefined ? (
                <InfoRow icon="p.square.fill" label="Parkplatz Kosten" value={trip.parkplatz_kostenlos ? "Gratis" : "Kostenpflichtig"} />
              ) : null}

              {trip.jahreszeiten ? (
                <InfoRow
                  icon="calendar"
                  label={t.seasons}
                  value={translateSeasons(trip.jahreszeiten, t)}
                />
              ) : null}

              {trip.land ? (
                <InfoRow icon="globe.europe.africa.fill" label={t.country} value={trip.land} />
              ) : null}
            </View>

            {/* Nice to Know */}
            {trip.nice_to_know ? (
              <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>{t.goodToKnow}</ThemedText>
                <View style={[styles.infoBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <IconSymbol name="lightbulb.fill" size={20} color={colors.primary} />
                  <ThemedText style={[styles.infoBoxText, { color: colors.textSecondary }]}>
                    {trip.nice_to_know}
                  </ThemedText>
                </View>
              </View>
            ) : null}

            {/* Linked Vouchers */}
            {isAuthenticated && (
              <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>Verknüpfte Gutscheine</ThemedText>
                {vouchersLoading ? (
                  <View style={{ paddingVertical: Spacing.lg }}>
                    <ActivityIndicator size="small" color={colors.primary} />
                  </View>
                ) : vouchers.length > 0 ? (
                  <View style={{ gap: Spacing.sm }}>
                    {vouchers.map((voucher) => (
                      <Pressable
                        key={voucher.id}
                        onPress={async () => {
                          const result = await openVoucherDeepLink(voucher.deep_link);
                          if (!result.success) {
                            Alert.alert("Fehler", result.error || "Gutschein-App konnte nicht geöffnet werden");
                          }
                        }}
                        style={({ pressed }) => ([
                          styles.voucherCard,
                          { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.8 : 1 }
                        ])}
                      >
                        <View style={[styles.voucherIcon, { backgroundColor: colors.primary + "15" }]}>
                          <IconSymbol name="giftcard.fill" size={24} color={colors.primary} />
                        </View>
                        <View style={styles.voucherContent}>
                          <ThemedText style={styles.voucherTitle}>{voucher.titel}</ThemedText>
                          <ThemedText style={[styles.voucherCode, { color: colors.textSecondary }]}>
                            {voucher.code ? `Code: ${voucher.code}` : "Kein Code"}
                          </ThemedText>
                        </View>
                        <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
                      </Pressable>
                    ))}
                  </View>
                ) : (
                  <View style={[styles.emptyVouchers, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <IconSymbol name="giftcard" size={32} color={colors.textSecondary} />
                    <ThemedText style={[styles.emptyVouchersText, { color: colors.textSecondary }]}>
                      Noch keine Gutscheine verknüpft
                    </ThemedText>
                  </View>
                )}
              </View>
            )}

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
                    <ThemedText style={styles.adminButtonText}>{t.edit}</ThemedText>
                  </Pressable>
                  <Pressable
                    onPress={handleDelete}
                    style={[styles.adminButton, { backgroundColor: "#EF4444" }]}
                  >
                    <IconSymbol name="trash.fill" size={20} color="#FFFFFF" />
                    <ThemedText style={styles.adminButtonText}>{t.delete}</ThemedText>
                  </Pressable>
                </View>
              </View>
            )}
          </View>

          {/* Bottom Spacing - Handled by contentContainerStyle */}
        </ScrollView>


      </View >

      {/* Popup Notification Modal */}
      {trip && (
        <Modal
          visible={showPopup}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowPopup(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
            <View style={{ backgroundColor: colors.background, borderRadius: 16, width: '100%', maxWidth: 400, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 }}>
              {/* Header with colored background */}
              <View style={{
                backgroundColor: trip.popup_level === 'info' ? '#3B82F6' : trip.popup_level === 'warnung' ? '#F59E0B' : '#EF4444',
                paddingVertical: 16,
                paddingHorizontal: 20,
                alignItems: 'center',
              }}>
                <ThemedText style={{
                  fontSize: 18,
                  fontWeight: '700',
                  color: trip.popup_level === 'wichtig' ? '#000000' : '#FFFFFF',
                  textAlign: 'center',
                }}>
                  {trip.popup_level === 'info' ? 'ℹ️ ' : trip.popup_level === 'warnung' ? '⚠️ ' : '🚨 '}
                  {trip.popup_title || 'Hinweis'}
                </ThemedText>
              </View>

              {/* Message Body */}
              {trip.popup_message ? (
                <View style={{ padding: 20 }}>
                  <ThemedText style={{ fontSize: 15, lineHeight: 22, color: colors.text, textAlign: 'center' }}>
                    {trip.popup_message}
                  </ThemedText>
                </View>
              ) : null}

              {/* Buttons */}
              <View style={{ flexDirection: 'row', padding: 16, gap: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
                <Pressable
                  onPress={async () => {
                    await AsyncStorage.setItem(`popup_dismissed_${trip.id}`, Date.now().toString());
                    setShowPopup(false);
                  }}
                  style={({ pressed }) => ({
                    flex: 1,
                    backgroundColor: pressed ? '#DC2626' : '#EF4444',
                    borderRadius: 10,
                    paddingVertical: 12,
                    alignItems: 'center',
                  })}
                >
                  <ThemedText style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 14 }}>
                    Nicht wieder anzeigen
                  </ThemedText>
                </Pressable>
                <Pressable
                  onPress={() => setShowPopup(false)}
                  style={({ pressed }) => ({
                    flex: 1,
                    backgroundColor: pressed ? '#16A34A' : '#22C55E',
                    borderRadius: 10,
                    paddingVertical: 12,
                    alignItems: 'center',
                  })}
                >
                  <ThemedText style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 14 }}>
                    Verstanden
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Fullscreen Image Modal */}
      <Modal
        visible={showFullscreenImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFullscreenImage(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' }}>
          {/* Close Button */}
          <Pressable
            onPress={() => setShowFullscreenImage(false)}
            style={{
              position: 'absolute',
              top: insets.top + 10,
              right: 16,
              zIndex: 10,
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(255,255,255,0.2)',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <IconSymbol name="xmark" size={22} color="#FFFFFF" />
          </Pressable>

          {/* Image */}
          {allPhotos.length > 0 ? (
            <>
              <ImagePager
                style={{ width: Dimensions.get('window').width, height: Dimensions.get('window').height * 0.75 }}
                initialPage={currentPhotoIndex}
                onPageSelected={(e) => setCurrentPhotoIndex(e.nativeEvent.position)}
              >
                {allPhotos.map((url, index) => (
                  <View key={`fullscreen-${index}`} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Image
                      source={{ uri: url }}
                      style={{ width: '100%', height: '100%' }}
                      contentFit="contain"
                    />
                  </View>
                ))}
              </ImagePager>
              {allPhotos.length > 1 && (
                <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 16, gap: 6 }}>
                  {allPhotos.map((_, index) => (
                    <View
                      key={index}
                      style={{
                        width: index === currentPhotoIndex ? 10 : 7,
                        height: index === currentPhotoIndex ? 10 : 7,
                        borderRadius: 5,
                        backgroundColor: index === currentPhotoIndex ? '#FFFFFF' : 'rgba(255,255,255,0.4)',
                      }}
                    />
                  ))}
                </View>
              )}
            </>
          ) : photoUrl ? (
            <Image
              source={{ uri: photoUrl }}
              style={{ width: '100%', height: '80%' }}
              contentFit="contain"
            />
          ) : null}
        </View>
      </Modal>
    </View >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pageContainer: {
    flex: 1,
    position: "relative", // Ensure absolute children position relative to this
  },
  scrollContent: {
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
  pagerView: {
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
  page: {
    width: "100%",
    height: "100%",
  },
  paginationContainer: {
    position: "absolute",
    bottom: Spacing.md,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.xs,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  paginationDotActive: {
    backgroundColor: "#FFFFFF",
    width: 10,
    height: 10,
    borderRadius: 5,
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
  categoryBadge: {
    position: "absolute",
    bottom: Spacing.lg,
    left: Spacing.lg,
    flexDirection: "row",
    gap: Spacing.xs,
    flexWrap: "wrap",
    maxWidth: "60%",
  },
  fixedHeaderButtons: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    zIndex: 100, // Increased zIndex
    elevation: 10, // Added elevation for Android
  },

  categoryBadgeItem: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  categoryBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "500",
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
  },
  // Voucher styles
  voucherCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  voucherIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  voucherContent: {
    flex: 1,
  },
  voucherTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  voucherCode: {
    fontSize: 13,
    marginTop: 2,
  },
  emptyVouchers: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: "center",
    gap: Spacing.sm,
  },
  emptyVouchersText: {
    fontSize: 14,
    textAlign: "center",
  },
});
