import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Notifications from "expo-notifications";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, BrandColors, Spacing, BorderRadius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useNotifications } from "@/hooks/use-notifications";

export default function TestNotificationsScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const {
    permissionGranted,
    requestPermissions,
    scheduleNotification,
    scheduleTripReminder,
    cancelAllNotifications,
  } = useNotifications();

  const [status, setStatus] = useState("");

  const handleTestNotification = async () => {
    setStatus("Sende Test-Benachrichtigung...");
    const id = await scheduleNotification(
      "Test Benachrichtigung",
      "Dies ist eine Test-Benachrichtigung von AusflugFinder",
      {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 5,
        repeats: false,
      }
    );
    if (id) {
      setStatus(`Benachrichtigung geplant (ID: ${id}) - erscheint in 5 Sekunden`);
    } else {
      setStatus("Fehler beim Planen der Benachrichtigung");
    }
  };

  const handleTripReminder = async () => {
    setStatus("Sende Trip-Erinnerung...");
    const id = await scheduleTripReminder("Rheinfall Abenteuer", 0.001); // ~86 seconds
    if (id) {
      setStatus(`Trip-Erinnerung geplant (ID: ${id}) - erscheint in ~1.5 Minuten`);
    } else {
      setStatus("Fehler beim Planen der Trip-Erinnerung");
    }
  };

  const handleCancelAll = async () => {
    await cancelAllNotifications();
    setStatus("Alle Benachrichtigungen abgebrochen");
  };

  const handleRequestPermissions = async () => {
    const granted = await requestPermissions();
    setStatus(granted ? "Berechtigung erteilt" : "Berechtigung verweigert");
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Benachrichtigungen Testen</ThemedText>
        <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
          Status: {permissionGranted ? "✅ Berechtigung erteilt" : "❌ Keine Berechtigung"}
        </ThemedText>
      </View>

      <View style={styles.content}>
        {!permissionGranted && (
          <Pressable
            onPress={handleRequestPermissions}
            style={[styles.button, { backgroundColor: BrandColors.primary }]}
          >
            <IconSymbol name="bell.fill" size={20} color="#FFFFFF" />
            <ThemedText style={styles.buttonText}>Berechtigung anfordern</ThemedText>
          </Pressable>
        )}

        <Pressable
          onPress={handleTestNotification}
          style={[styles.button, { backgroundColor: BrandColors.secondary }]}
        >
          <IconSymbol name="bell.fill" size={20} color="#FFFFFF" />
          <ThemedText style={styles.buttonText}>Test-Benachrichtigung (5s)</ThemedText>
        </Pressable>

        <Pressable
          onPress={handleTripReminder}
          style={[styles.button, { backgroundColor: BrandColors.accent }]}
        >
          <IconSymbol name="calendar" size={20} color="#FFFFFF" />
          <ThemedText style={styles.buttonText}>Trip-Erinnerung (~1.5min)</ThemedText>
        </Pressable>

        <Pressable
          onPress={handleCancelAll}
          style={[styles.button, { backgroundColor: "#FF5722" }]}
        >
          <IconSymbol name="xmark" size={20} color="#FFFFFF" />
          <ThemedText style={styles.buttonText}>Alle abbrechen</ThemedText>
        </Pressable>

        {status && (
          <View style={[styles.statusBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <ThemedText style={styles.statusText}>{status}</ThemedText>
          </View>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 14,
    marginTop: Spacing.xs,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  statusBox: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: Spacing.md,
  },
  statusText: {
    fontSize: 14,
    textAlign: "center",
  },
});
