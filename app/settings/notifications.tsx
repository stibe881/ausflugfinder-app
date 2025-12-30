import { Stack } from "expo-router";
import { StyleSheet, Switch, View, Alert, Platform, Pressable } from "react-native";
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Spacing, BorderRadius, BrandColors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useLocation, DISTANCE_OPTIONS } from "@/hooks/use-location";
import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/contexts/supabase-auth-context";

type NotificationSettings = {
  pushEnabled: boolean;
  tripReminders: boolean;
  friendRequests: boolean;
  planUpdates: boolean;
  weeklyDigest: boolean;
  notifyNewTrip: boolean; // New setting
};

const NOTIFICATIONS_KEY = "notification_settings";

const DEFAULT_SETTINGS: NotificationSettings = {
  pushEnabled: true,
  tripReminders: true,
  friendRequests: true,
  planUpdates: true,
  weeklyDigest: false,
  notifyNewTrip: true,
};

function NotificationItem({
  icon,
  iconColor,
  title,
  description,
  value,
  onValueChange,
  disabled,
}: {
  icon: string;
  iconColor?: string;
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <View style={[
      styles.notificationItem,
      {
        backgroundColor: colors.card,
        borderColor: colors.border,
        opacity: disabled ? 0.5 : 1
      }
    ]}>
      <View style={[styles.notificationIcon, { backgroundColor: (iconColor || colors.primary) + "15" }]}>
        <IconSymbol name={icon as any} size={20} color={iconColor || colors.primary} />
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
        disabled={disabled}
      />
    </View>
  );
}

function DistanceSelector({
  value,
  onValueChange,
  disabled,
}: {
  value: number;
  onValueChange: (value: number) => void;
  disabled?: boolean;
}) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <View
      style={[
        styles.distanceContainer,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: disabled ? 0.5 : 1,
          marginTop: Spacing.sm,
          marginBottom: Spacing.md,
        },
      ]}
    >
      <View style={styles.distanceHeader}>
        <View style={[styles.miniIcon, { backgroundColor: BrandColors.secondary + "15" }]}>
          <IconSymbol name="map.fill" size={16} color={BrandColors.secondary} />
        </View>
        <ThemedText style={styles.distanceTitle}>Entfernung für Benachrichtigung</ThemedText>
      </View>

      <View style={styles.distanceOptions}>
        {DISTANCE_OPTIONS.map((option) => (
          <Pressable
            key={option.value}
            onPress={() => !disabled && onValueChange(option.value)}
            style={[
              styles.distanceOption,
              {
                backgroundColor: value === option.value ? colors.primary : colors.surface,
                borderColor: value === option.value ? colors.primary : colors.border,
              },
            ]}
            disabled={disabled}
          >
            <ThemedText
              style={[
                styles.distanceOptionText,
                { color: value === option.value ? "#FFFFFF" : colors.text },
              ]}
            >
              {option.label}
            </ThemedText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function NotificationSettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const { user } = useSupabaseAuth();

  // Proximity settings from useLocation hook
  const {
    settings: locationSettings,
    toggleProximityNotifications,
    toggleLocationEnabled,
    updateProximityDistance
  } = useLocation();

  useEffect(() => {
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    // 1. Load local settings
    const saved = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
    let localSettings = DEFAULT_SETTINGS;
    if (saved) {
      try {
        localSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      } catch (e) {
        // Use defaults
      }
    }

    // 2. Load DB settings if logged in (for notifyNewTrip)
    if (user) {
      const { data, error } = await supabase
        .from('users')
        .select('notify_new_trip')
        .eq('open_id', user.id)
        .single();

      if (data) {
        localSettings.notifyNewTrip = data.notify_new_trip ?? true;
      }
    }

    setSettings(localSettings);
  };

  const updateSetting = async (key: keyof NotificationSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(newSettings));

    // Update DB if it's the new trip setting
    if (key === 'notifyNewTrip' && user) {
      await supabase
        .from('users')
        .update({ notify_new_trip: value })
        .eq('open_id', user.id);
    }
  };

  const handleProximityToggle = async (enabled: boolean) => {
    if (enabled && !locationSettings.locationEnabled) {
      // Try to enable location first
      const success = await toggleLocationEnabled(true);
      if (!success) {
        Alert.alert(
          "Standort erforderlich",
          "Bitte aktiviere die Standortfreigabe in den Einstellungen, um In der Nähe Benachrichtigungen zu erhalten."
        );
        return;
      }
    }
    await toggleProximityNotifications(enabled);
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
              INHALTE
            </ThemedText>

            <NotificationItem
              icon="star.fill"
              iconColor="#F59E0B"
              title="Neuer Ausflug"
              description="Benachrichtigung bei neuen Ausflugszielen"
              value={settings.notifyNewTrip && settings.pushEnabled}
              onValueChange={(value) => updateSetting("notifyNewTrip", value)}
              disabled={!settings.pushEnabled}
            />

            <NotificationItem
              icon="location.fill"
              iconColor="#3B82F6"
              title="In der Nähe"
              description="Benachrichtigung bei Ausflugszielen in der Nähe"
              value={locationSettings.proximityNotificationsEnabled && settings.pushEnabled}
              onValueChange={handleProximityToggle}
              disabled={!settings.pushEnabled}
            />

            {locationSettings.proximityNotificationsEnabled && settings.pushEnabled && (
              <DistanceSelector
                value={locationSettings.proximityDistance}
                onValueChange={updateProximityDistance}
                disabled={!settings.pushEnabled}
              />
            )}

            <NotificationItem
              icon="paperplane.fill"
              iconColor="#10B981"
              title="Wöchentliche Zusammenfassung"
              description="Neue Ausflugstipps und Highlights"
              value={settings.weeklyDigest && settings.pushEnabled}
              onValueChange={(value) => updateSetting("weeklyDigest", value)}
              disabled={!settings.pushEnabled}
            />
          </View>

          <View style={[styles.section, { opacity: settings.pushEnabled ? 1 : 0.5 }]}>
            <ThemedText style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              SOZIAL & PLANUNG
            </ThemedText>

            <NotificationItem
              icon="calendar"
              title="Trip-Erinnerungen"
              description="Erinnerungen vor geplanten Ausflügen"
              value={settings.tripReminders && settings.pushEnabled}
              onValueChange={(value) => updateSetting("tripReminders", value)}
              disabled={!settings.pushEnabled}
            />

            <NotificationItem
              icon="person.2.fill"
              title="Freundschaftsanfragen"
              description="Neue Anfragen und Bestätigungen"
              value={settings.friendRequests && settings.pushEnabled}
              onValueChange={(value) => updateSetting("friendRequests", value)}
              disabled={!settings.pushEnabled}
            />

            <NotificationItem
              icon="doc.text.fill"
              title="Plan-Updates"
              description="Änderungen an geteilten Plänen"
              value={settings.planUpdates && settings.pushEnabled}
              onValueChange={(value) => updateSetting("planUpdates", value)}
              disabled={!settings.pushEnabled}
            />
          </View>

          {/* Info */}
          <View style={[styles.infoBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <IconSymbol name="info.circle.fill" size={20} color={colors.textSecondary} />
            <ThemedText style={[styles.infoText, { color: colors.textSecondary }]}>
              Hinweis: "In der Nähe" Benachrichtigungen benötigen dauerhaften Zugriff auf deinen Standort, auch wenn die App im Hintergrund läuft.
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
    color: "#6B7280",
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
    color: "#6B7280",
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
    color: "#6B7280",
  },
  distanceContainer: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginLeft: Spacing.lg, // Indent to show hierarchy
  },
  distanceHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  miniIcon: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  distanceTitle: {
    fontSize: 13,
    fontWeight: "500",
  },
  distanceOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  distanceOption: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: "center",
  },
  distanceOptionText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
