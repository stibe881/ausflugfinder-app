import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, BrandColors, Spacing, BorderRadius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuth } from "@/hooks/use-auth";
import { getLoginUrl } from "@/constants/oauth";
import { trpc } from "@/lib/trpc";

type SettingItemProps = {
  icon: string;
  iconColor?: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  danger?: boolean;
};

function SettingItem({
  icon,
  iconColor,
  title,
  subtitle,
  onPress,
  rightElement,
  danger,
}: SettingItemProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.settingItem,
        {
          backgroundColor: colors.card,
          opacity: pressed && onPress ? 0.9 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.settingIcon,
          { backgroundColor: (iconColor || colors.primary) + "15" },
        ]}
      >
        <IconSymbol
          name={icon as any}
          size={20}
          color={iconColor || colors.primary}
        />
      </View>
      <View style={styles.settingContent}>
        <ThemedText
          style={[
            styles.settingTitle,
            danger && { color: "#EF4444" },
          ]}
        >
          {title}
        </ThemedText>
        {subtitle && (
          <ThemedText style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
            {subtitle}
          </ThemedText>
        )}
      </View>
      {rightElement || (onPress && (
        <IconSymbol name="chevron.right" size={16} color={colors.textSecondary} />
      ))}
    </Pressable>
  );
}

function SettingSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <View style={styles.settingSection}>
      <ThemedText style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        {title}
      </ThemedText>
      <View style={[styles.sectionContent, { borderColor: colors.border }]}>
        {children}
      </View>
    </View>
  );
}

function LoginScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    try {
      setIsLoggingIn(true);
      const loginUrl = getLoginUrl();

      if (Platform.OS === "web") {
        window.location.href = loginUrl;
        return;
      }

      const result = await WebBrowser.openAuthSessionAsync(
        loginUrl,
        undefined,
        {
          preferEphemeralSession: false,
          showInRecents: true,
        }
      );

      if (result.type === "success" && result.url) {
        let url: URL;
        if (result.url.startsWith("exp://") || result.url.startsWith("exps://")) {
          const urlStr = result.url.replace(/^exp(s)?:\/\//, "http://");
          url = new URL(urlStr);
        } else {
          url = new URL(result.url);
        }

        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");

        if (code && state) {
          router.push({
            pathname: "/oauth/callback" as any,
            params: { code, state },
          });
        }
      }
    } catch (error) {
      console.error("[Auth] Login error:", error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <View style={styles.loginContainer}>
      <View style={[styles.loginIcon, { backgroundColor: colors.primary + "15" }]}>
        <IconSymbol name="person.fill" size={48} color={colors.primary} />
      </View>
      <ThemedText style={styles.loginTitle}>Willkommen bei AusflugFinder</ThemedText>
      <ThemedText style={[styles.loginSubtitle, { color: colors.textSecondary }]}>
        Melde dich an, um deine Ausflüge zu speichern, Pläne zu erstellen und mit Freunden zu teilen
      </ThemedText>
      <Pressable
        onPress={handleLogin}
        disabled={isLoggingIn}
        style={[
          styles.loginButton,
          { backgroundColor: colors.primary, opacity: isLoggingIn ? 0.7 : 1 },
        ]}
      >
        {isLoggingIn ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <IconSymbol name="person.fill" size={20} color="#FFFFFF" />
            <ThemedText style={styles.loginButtonText}>Anmelden</ThemedText>
          </>
        )}
      </Pressable>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { user, isAuthenticated, loading, logout } = useAuth();

  // Delete account mutation
  const deleteAccountMutation = trpc.auth.deleteAccount.useMutation({
    onSuccess: () => {
      Alert.alert("Konto gelöscht", "Dein Konto wurde erfolgreich gelöscht.");
    },
    onError: (error) => {
      Alert.alert("Fehler", error.message);
    },
  });

  const handleLogout = () => {
    Alert.alert(
      "Abmelden",
      "Möchtest du dich wirklich abmelden?",
      [
        { text: "Abbrechen", style: "cancel" },
        {
          text: "Abmelden",
          onPress: () => logout(),
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Konto löschen",
      "Bist du sicher, dass du dein Konto löschen möchtest? Diese Aktion kann nicht rückgängig gemacht werden.",
      [
        { text: "Abbrechen", style: "cancel" },
        {
          text: "Löschen",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Letzte Warnung",
              "Alle deine Daten werden unwiderruflich gelöscht. Fortfahren?",
              [
                { text: "Abbrechen", style: "cancel" },
                {
                  text: "Endgültig löschen",
                  style: "destructive",
                  onPress: () => deleteAccountMutation.mutate(),
                },
              ]
            );
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <ThemedText style={styles.headerTitle}>Profil</ThemedText>
        </View>

        {!isAuthenticated ? (
          <LoginScreen />
        ) : (
          <>
            {/* User Info */}
            <View style={[styles.userCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.userAvatar, { backgroundColor: colors.primary + "20" }]}>
                <ThemedText style={[styles.userAvatarText, { color: colors.primary }]}>
                  {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U"}
                </ThemedText>
              </View>
              <View style={styles.userInfo}>
                <ThemedText style={styles.userName}>
                  {user?.name || "Benutzer"}
                </ThemedText>
                <ThemedText style={[styles.userEmail, { color: colors.textSecondary }]}>
                  {user?.email || ""}
                </ThemedText>
              </View>
            </View>

            {/* Settings Sections */}
            <SettingSection title="ALLGEMEIN">
              <SettingItem
                icon="bell.fill"
                title="Benachrichtigungen"
                subtitle="Push-Benachrichtigungen verwalten"
                onPress={() => router.push("/settings/notifications" as any)}
              />
              <SettingItem
                icon="globe"
                title="Sprache"
                subtitle="Deutsch"
                onPress={() => router.push("/settings/language" as any)}
              />
              <SettingItem
                icon="moon.fill"
                title="Erscheinungsbild"
                subtitle="Systemeinstellung"
                onPress={() => router.push("/settings/appearance" as any)}
              />
            </SettingSection>

            <SettingSection title="SOZIAL">
              <SettingItem
                icon="person.2.fill"
                iconColor={BrandColors.accent}
                title="Freunde"
                subtitle="Freunde verwalten"
                onPress={() => router.push("/friends" as any)}
              />
              <SettingItem
                icon="square.and.arrow.up"
                iconColor={BrandColors.secondary}
                title="Teilen"
                subtitle="App mit Freunden teilen"
                onPress={() => {}}
              />
            </SettingSection>

            <SettingSection title="SUPPORT">
              <SettingItem
                icon="info.circle.fill"
                title="Über AusflugFinder"
                onPress={() => router.push("/about" as any)}
              />
              <SettingItem
                icon="doc.text.fill"
                title="Datenschutz"
                onPress={() => {}}
              />
              <SettingItem
                icon="bubble.left.fill"
                title="Feedback senden"
                onPress={() => {}}
              />
            </SettingSection>

            <SettingSection title="KONTO">
              <SettingItem
                icon="arrow.left"
                iconColor="#EF4444"
                title="Abmelden"
                onPress={handleLogout}
                danger
              />
              <SettingItem
                icon="trash.fill"
                iconColor="#EF4444"
                title="Konto löschen"
                onPress={handleDeleteAccount}
                danger
              />
            </SettingSection>

            {/* App Version */}
            <View style={styles.versionContainer}>
              <ThemedText style={[styles.versionText, { color: colors.textDisabled }]}>
                AusflugFinder v1.0.0
              </ThemedText>
            </View>
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  // Login Screen
  loginContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
  },
  loginIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  loginSubtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  loginButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    borderRadius: BorderRadius.md,
    minWidth: 200,
    justifyContent: "center",
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  // User Card
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  userAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  userAvatarText: {
    fontSize: 28,
    fontWeight: "bold",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: "600",
  },
  userEmail: {
    fontSize: 14,
    marginTop: Spacing.xs,
  },
  // Settings
  settingSection: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: Spacing.sm,
    marginLeft: Spacing.sm,
  },
  sectionContent: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    gap: Spacing.md,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
  },
  settingSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  // Version
  versionContainer: {
    alignItems: "center",
    marginTop: Spacing.xxl,
  },
  versionText: {
    fontSize: 13,
  },
});
