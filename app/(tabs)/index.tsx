import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  Dimensions,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, BrandColors, Spacing, BorderRadius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuth } from "@/hooks/use-auth";
import { getAusflugeStatistics } from "@/lib/supabase-api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

function AnimatedIcon({
  name,
  color,
  delay = 0
}: {
  name: "mountain.2.fill" | "sun.max.fill" | "mappin.and.ellipse";
  color: string;
  delay?: number;
}) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.7);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(withTiming(1.1, { duration: 2000 }), -1, true)
    );
    opacity.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: 2000 }), -1, true)
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={animatedStyle}>
      <IconSymbol name={name} size={40} color={color} />
    </Animated.View>
  );
}

function StatCard({
  value,
  label,
  color,
  onPress,
}: {
  value: number | string;
  label: string;
  color: string;
  onPress?: () => void;
}) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.statCard,
        {
          backgroundColor: color + "15",
          borderColor: color + "30",
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <ThemedText style={[styles.statValue, { color }]}>{value}</ThemedText>
      <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: "magnifyingglass" | "calendar" | "person.2.fill" | "map.fill";
  title: string;
  description: string;
}) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <View style={styles.featureItem}>
      <View
        style={[
          styles.featureIconContainer,
          { backgroundColor: colors.primary + "15" },
        ]}
      >
        <IconSymbol name={icon} size={24} color={colors.primary} />
      </View>
      <View style={styles.featureContent}>
        <ThemedText style={styles.featureTitle}>{title}</ThemedText>
        <ThemedText style={[styles.featureDescription, { color: colors.textSecondary }]}>
          {description}
        </ThemedText>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { user, loading: authLoading, isAuthenticated } = useAuth();

  // Fetch statistics from Supabase
  const [stats, setStats] = useState<{ totalActivities: number; freeActivities: number; totalRegions: number } | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      setStatsLoading(true);
      const result = await getAusflugeStatistics();
      setStats(result);
      setStatsLoading(false);
    }
    loadStats();
  }, []);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Section */}
      <View
        style={[
          styles.heroSection,
          {
            paddingTop: insets.top + 48,
            backgroundColor: colors.surface,
          },
        ]}
      >
        {/* Animated Icons */}
        <View style={styles.iconRow}>
          <AnimatedIcon name="mountain.2.fill" color={BrandColors.primary} delay={0} />
          <AnimatedIcon name="sun.max.fill" color={BrandColors.secondary} delay={500} />
          <AnimatedIcon name="mappin.and.ellipse" color={BrandColors.accent} delay={1000} />
        </View>

        {/* App Title */}
        <ThemedText style={styles.heroTitle}>AusflugFinder</ThemedText>
        <ThemedText style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
          Entdecke die schönsten Ausflugsziele in der Schweiz und Umgebung
        </ThemedText>

        {/* CTA Buttons */}
        <View style={styles.ctaContainer}>
          {authLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : isAuthenticated ? (
            <>
              <Pressable
                onPress={() => router.push("/(tabs)/explore")}
                style={({ pressed }) => [
                  styles.primaryButton,
                  { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 },
                ]}
              >
                <IconSymbol name="magnifyingglass" size={20} color="#FFFFFF" />
                <ThemedText style={styles.primaryButtonText}>Entdecken</ThemedText>
              </Pressable>
              <Pressable
                onPress={() => router.push("/(tabs)/profile")}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  {
                    borderColor: colors.secondary,
                    opacity: pressed ? 0.9 : 1,
                  },
                ]}
              >
                <IconSymbol name="person.fill" size={20} color={colors.secondary} />
                <ThemedText style={[styles.secondaryButtonText, { color: colors.secondary }]}>
                  Profil
                </ThemedText>
              </Pressable>
            </>
          ) : (
            <Pressable
              onPress={() => router.push("/(tabs)/profile")}
              style={({ pressed }) => [
                styles.primaryButton,
                { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 },
              ]}
            >
              <IconSymbol name="person.fill" size={20} color="#FFFFFF" />
              <ThemedText style={styles.primaryButtonText}>Anmelden</ThemedText>
            </Pressable>
          )}
        </View>
      </View>

      {/* Statistics Section */}
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Statistiken</ThemedText>
        {statsLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
        ) : (
          <View style={styles.statsGrid}>
            <StatCard
              value={stats?.totalActivities ?? 0}
              label="Aktivitäten"
              color={BrandColors.primary}
              onPress={() => router.push("/(tabs)/explore")}
            />
            <StatCard
              value={stats?.freeActivities ?? 0}
              label="Kostenlos"
              color={BrandColors.secondary}
              onPress={() => router.push("/(tabs)/explore?cost=free")}
            />
            <StatCard
              value={stats?.totalRegions ?? 0}
              label="Regionen"
              color={BrandColors.accent}
              onPress={() => router.push("/(tabs)/explore")}
            />
          </View>
        )}
      </View>

      {/* Features Section */}
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Was dich erwartet</ThemedText>
        <ThemedText style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
          Alles was du für deinen perfekten Ausflug brauchst
        </ThemedText>

        <View style={styles.featuresContainer}>
          <FeatureItem
            icon="magnifyingglass"
            title="Ausflüge entdecken"
            description="Durchsuche hunderte von Ausflugszielen nach Kategorie, Region und Budget"
          />
          <FeatureItem
            icon="calendar"
            title="Tagesplanung"
            description="Plane deinen perfekten Tag mit Zeitplanung, Packliste und Budget"
          />
          <FeatureItem
            icon="person.2.fill"
            title="Mit Freunden teilen"
            description="Teile deine Lieblingsausflüge und plane gemeinsame Abenteuer"
          />
          <FeatureItem
            icon="map.fill"
            title="Kartenansicht"
            description="Finde Ausflugsziele in deiner Nähe mit der interaktiven Karte"
          />
        </View>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroSection: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
    borderBottomLeftRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.xl,
  },
  iconRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  heroTitle: {
    fontSize: 40,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  heroSubtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  ctaContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.md,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  section: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: Spacing.xs,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: Spacing.lg,
  },
  statsGrid: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    alignItems: "center",
  },
  statValue: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    textAlign: "center",
  },
  featuresContainer: {
    gap: Spacing.lg,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  userSection: {
    paddingBottom: Spacing.xl,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  userAvatarText: {
    fontSize: 24,
    fontWeight: "bold",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: "600",
  },
  userEmail: {
    fontSize: 14,
  },
});
