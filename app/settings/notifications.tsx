import { Stack } from "expo-router";
import { StyleSheet, Switch, View } from "react-native";
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

type NotificationSettings = {
  pushEnabled: boolean;
  tripReminders: boolean;
  friendRequests: boolean;
  planUpdates: boolean;
  weeklyDigest: boolean;
};

const NOTIFICATIONS_KEY = "notification_settings";

const DEFAULT_SETTINGS: NotificationSettings = {
  pushEnabled: true,
  tripReminders: true,
  friendRequests: true,
  planUpdates: true,
  weeklyDigest: false,
};

function NotificationItem({
  icon,
  title,
  description,
  value,
  onValueChange,
}: {
  icon: string;
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <View style={[styles.notificationItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.notificationIcon, { backgroundColor: colors.primary + "15" }]}>
        <IconSymbol name={icon as any} size={20} color={colors.primary} />
      </View>
      <View style={styles.notificationContent}>
        <ThemedText style={styles.notificationTitle}>{title}</ThemedText>
        <ThemedText style={[styles.notificationDescription, { color: colors.textSecondary }]}>
          {description}
        </ThemedText>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

export default function NotificationSettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    AsyncStorage.getItem(NOTIFICATIONS_KEY).then((saved) => {
      if (saved) {
        try {
          setSettings(JSON.parse(saved));
        } catch (e) {
          // Use defaults
        }
      }
    });
  }, []);

  const updateSetting = async (key: keyof NotificationSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(newSettings));
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: true, headerTitle: "Benachrichtigungen", headerBackTitle: "Zurück" }} />
      <ThemedView style={styles.container}>
        <View style={styles.content}>
          {/* Master Switch */}
          <View style={[styles.masterSwitch, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.masterIcon, { backgroundColor: colors.primary }]}>
              <IconSymbol name="bell.fill" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.masterContent}>
              <ThemedText style={styles.masterTitle}>Push-Benachrichtigungen</ThemedText>
              <ThemedText style={[styles.masterDescription, { color: colors.textSecondary }]}>
                Alle Benachrichtigungen aktivieren/deaktivieren
              </ThemedText>
            </View>
            <Switch
              value={settings.pushEnabled}
              onValueChange={(value) => updateSetting("pushEnabled", value)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Individual Settings */}
          <View style={[styles.section, { opacity: settings.pushEnabled ? 1 : 0.5 }]}>
            <ThemedText style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              BENACHRICHTIGUNGSTYPEN
            </ThemedText>

            <NotificationItem
              icon="calendar"
              title="Trip-Erinnerungen"
              description="Erinnerungen vor geplanten Ausflügen"
              value={settings.tripReminders && settings.pushEnabled}
              onValueChange={(value) => updateSetting("tripReminders", value)}
            />

            <NotificationItem
              icon="person.2.fill"
              title="Freundschaftsanfragen"
              description="Neue Anfragen und Bestätigungen"
              value={settings.friendRequests && settings.pushEnabled}
              onValueChange={(value) => updateSetting("friendRequests", value)}
            />

            <NotificationItem
              icon="doc.text.fill"
              title="Plan-Updates"
              description="Änderungen an geteilten Plänen"
              value={settings.planUpdates && settings.pushEnabled}
              onValueChange={(value) => updateSetting("planUpdates", value)}
            />

            <NotificationItem
              icon="paperplane.fill"
              title="Wöchentliche Zusammenfassung"
              description="Neue Ausflugstipps und Highlights"
              value={settings.weeklyDigest && settings.pushEnabled}
              onValueChange={(value) => updateSetting("weeklyDigest", value)}
            />
          </View>

          {/* Info */}
          <View style={[styles.infoBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <IconSymbol name="info.circle.fill" size={20} color={colors.textSecondary} />
            <ThemedText style={[styles.infoText, { color: colors.textSecondary }]}>
              Du kannst Benachrichtigungen auch in den Systemeinstellungen deines Geräts verwalten.
            </ThemedText>
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
  masterSwitch: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  masterIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  masterContent: {
    flex: 1,
  },
  masterTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  masterDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: Spacing.md,
    marginLeft: Spacing.sm,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: "500",
  },
  notificationDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});
