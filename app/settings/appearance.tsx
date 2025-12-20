import { Stack } from "expo-router";
import { Pressable, StyleSheet, View, useColorScheme as useSystemColorScheme } from "react-native";
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

type ThemeOption = "system" | "light" | "dark";

const THEME_OPTIONS: { value: ThemeOption; label: string; icon: string; description: string }[] = [
  { value: "system", label: "System", icon: "gearshape.fill", description: "Folgt den Systemeinstellungen" },
  { value: "light", label: "Hell", icon: "sun.max.fill", description: "Immer heller Modus" },
  { value: "dark", label: "Dunkel", icon: "moon.fill", description: "Immer dunkler Modus" },
];

const THEME_KEY = "app_theme";

export default function AppearanceSettingsScreen() {
  const systemColorScheme = useSystemColorScheme();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [selectedTheme, setSelectedTheme] = useState<ThemeOption>("system");

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((saved) => {
      if (saved === "system" || saved === "light" || saved === "dark") {
        setSelectedTheme(saved);
      }
    });
  }, []);

  const handleThemeChange = async (theme: ThemeOption) => {
    setSelectedTheme(theme);
    await AsyncStorage.setItem(THEME_KEY, theme);
    // Note: In a real app, you would need to update the color scheme context
    // This is a simplified version
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: true, headerTitle: "Erscheinungsbild" }} />
      <ThemedView style={styles.container}>
        <View style={styles.content}>
          <ThemedText style={[styles.description, { color: colors.textSecondary }]}>
            Wähle das Erscheinungsbild der App
          </ThemedText>

          <View style={styles.themeList}>
            {THEME_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => handleThemeChange(option.value)}
                style={[
                  styles.themeItem,
                  {
                    backgroundColor: colors.card,
                    borderColor: selectedTheme === option.value ? colors.primary : colors.border,
                    borderWidth: selectedTheme === option.value ? 2 : 1,
                  },
                ]}
              >
                <View style={[styles.themeIcon, { backgroundColor: colors.primary + "15" }]}>
                  <IconSymbol name={option.icon as any} size={24} color={colors.primary} />
                </View>
                <View style={styles.themeInfo}>
                  <ThemedText style={styles.themeName}>{option.label}</ThemedText>
                  <ThemedText style={[styles.themeDescription, { color: colors.textSecondary }]}>
                    {option.description}
                  </ThemedText>
                </View>
                {selectedTheme === option.value && (
                  <IconSymbol name="checkmark.circle.fill" size={24} color={colors.primary} />
                )}
              </Pressable>
            ))}
          </View>

          {/* Preview */}
          <View style={styles.previewSection}>
            <ThemedText style={styles.previewTitle}>Vorschau</ThemedText>
            <View style={styles.previewContainer}>
              <View style={[styles.previewCard, { backgroundColor: "#FFFFFF", borderColor: "#E5E7EB" }]}>
                <View style={[styles.previewHeader, { backgroundColor: "#F3F4F6" }]} />
                <View style={styles.previewContent}>
                  <View style={[styles.previewLine, { backgroundColor: "#374151" }]} />
                  <View style={[styles.previewLine, styles.previewLineShort, { backgroundColor: "#9CA3AF" }]} />
                </View>
                <ThemedText style={[styles.previewLabel, { color: colors.textSecondary }]}>Hell</ThemedText>
              </View>
              <View style={[styles.previewCard, { backgroundColor: "#1F2937", borderColor: "#374151" }]}>
                <View style={[styles.previewHeader, { backgroundColor: "#374151" }]} />
                <View style={styles.previewContent}>
                  <View style={[styles.previewLine, { backgroundColor: "#F9FAFB" }]} />
                  <View style={[styles.previewLine, styles.previewLineShort, { backgroundColor: "#9CA3AF" }]} />
                </View>
                <ThemedText style={[styles.previewLabel, { color: colors.textSecondary }]}>Dunkel</ThemedText>
              </View>
            </View>
          </View>
        </View>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  description: {
    fontSize: 14,
    marginBottom: Spacing.lg,
  },
  themeList: {
    gap: Spacing.sm,
  },
  themeItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  themeIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  themeInfo: {
    flex: 1,
  },
  themeName: {
    fontSize: 16,
    fontWeight: "500",
  },
  themeDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  previewSection: {
    marginTop: Spacing.xl,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  previewContainer: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  previewCard: {
    flex: 1,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: "hidden",
  },
  previewHeader: {
    height: 24,
  },
  previewContent: {
    padding: Spacing.sm,
  },
  previewLine: {
    height: 8,
    borderRadius: 4,
    marginBottom: Spacing.xs,
  },
  previewLineShort: {
    width: "60%",
  },
  previewLabel: {
    fontSize: 12,
    textAlign: "center",
    paddingVertical: Spacing.xs,
  },
});
