import { Stack } from "expo-router";
import { Linking, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, BrandColors, Spacing, BorderRadius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

function InfoItem({ icon, title, value, onPress }: { icon: string; title: string; value: string; onPress?: () => void }) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={[styles.infoItem, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={[styles.infoIcon, { backgroundColor: colors.primary + "15" }]}>
        <IconSymbol name={icon as any} size={20} color={colors.primary} />
      </View>
      <View style={styles.infoContent}>
        <ThemedText style={[styles.infoTitle, { color: colors.textSecondary }]}>{title}</ThemedText>
        <ThemedText style={styles.infoValue}>{value}</ThemedText>
      </View>
      {onPress && <IconSymbol name="chevron.right" size={16} color={colors.textSecondary} />}
    </Pressable>
  );
}

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <>
      <Stack.Screen options={{ headerShown: true, headerTitle: "Über AusflugFinder" }} />
      <ThemedView style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + Spacing.xl }]}
        >
          {/* Logo & App Info */}
          <View style={styles.header}>
            <Image
              source={require("@/assets/images/icon.png")}
              style={styles.logo}
              contentFit="contain"
            />
            <ThemedText style={styles.appName}>AusflugFinder</ThemedText>
            <ThemedText style={[styles.tagline, { color: colors.textSecondary }]}>
              Entdecke die schönsten Ausflugsziele der Schweiz
            </ThemedText>
            <View style={[styles.versionBadge, { backgroundColor: colors.primary + "15" }]}>
              <ThemedText style={[styles.versionText, { color: colors.primary }]}>Version 1.0.0</ThemedText>
            </View>
          </View>

          {/* Description */}
          <View style={[styles.descriptionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <ThemedText style={[styles.description, { color: colors.text }]}>
              AusflugFinder hilft dir, die besten Ausflugsziele in der Schweiz und Umgebung zu entdecken. 
              Plane deine Ausflüge, erstelle Packlisten, verwalte dein Budget und teile Erlebnisse mit Freunden.
            </ThemedText>
          </View>

          {/* Features */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Funktionen</ThemedText>
            <View style={styles.features}>
              <FeatureItem icon="magnifyingglass" title="Entdecken" description="Hunderte Ausflugsziele durchsuchen" />
              <FeatureItem icon="heart.fill" title="Favoriten" description="Lieblingsorte speichern" />
              <FeatureItem icon="calendar" title="Planer" description="Ausflüge detailliert planen" />
              <FeatureItem icon="bag.fill" title="Packliste" description="Nichts vergessen" />
              <FeatureItem icon="dollarsign.circle.fill" title="Budget" description="Kosten im Blick behalten" />
              <FeatureItem icon="person.2.fill" title="Freunde" description="Gemeinsam planen" />
            </View>
          </View>

          {/* Info */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Information</ThemedText>
            <InfoItem icon="globe" title="Website" value="ausflugfinder.ch" onPress={() => Linking.openURL("https://ausflugfinder.ch")} />
            <InfoItem icon="paperplane.fill" title="E-Mail" value="info@ausflugfinder.ch" onPress={() => Linking.openURL("mailto:info@ausflugfinder.ch")} />
            <InfoItem icon="doc.text.fill" title="Datenschutz" value="Datenschutzerklärung" onPress={() => {}} />
            <InfoItem icon="doc.text.fill" title="Nutzungsbedingungen" value="AGB" onPress={() => {}} />
          </View>

          {/* Credits */}
          <View style={styles.credits}>
            <ThemedText style={[styles.creditsText, { color: colors.textDisabled }]}>
              Made with ❤️ in Switzerland
            </ThemedText>
            <ThemedText style={[styles.creditsText, { color: colors.textDisabled }]}>
              © 2024 AusflugFinder
            </ThemedText>
          </View>
        </ScrollView>
      </ThemedView>
    </>
  );
}

function FeatureItem({ icon, title, description }: { icon: string; title: string; description: string }) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <View style={styles.featureItem}>
      <View style={[styles.featureIcon, { backgroundColor: colors.primary + "15" }]}>
        <IconSymbol name={icon as any} size={20} color={colors.primary} />
      </View>
      <ThemedText style={styles.featureTitle}>{title}</ThemedText>
      <ThemedText style={[styles.featureDescription, { color: colors.textSecondary }]}>{description}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 20,
    marginBottom: Spacing.md,
  },
  appName: {
    fontSize: 28,
    fontWeight: "bold",
  },
  tagline: {
    fontSize: 15,
    marginTop: Spacing.xs,
    textAlign: "center",
  },
  versionBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.md,
  },
  versionText: {
    fontSize: 13,
    fontWeight: "500",
  },
  descriptionCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.xl,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    textAlign: "center",
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  features: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  featureItem: {
    width: "47%",
    alignItems: "center",
    padding: Spacing.md,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  featureDescription: {
    fontSize: 12,
    textAlign: "center",
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
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
  infoTitle: {
    fontSize: 12,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "500",
    marginTop: 2,
  },
  credits: {
    alignItems: "center",
    marginTop: Spacing.xl,
  },
  creditsText: {
    fontSize: 13,
    marginBottom: Spacing.xs,
  },
});
