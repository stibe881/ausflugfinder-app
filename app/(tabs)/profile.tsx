import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import Constants from "expo-constants";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
  Share,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";
import { Image } from "expo-image";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { EditProfileModal } from "@/components/edit-profile-modal";
import { FeedbackModal } from "@/components/feedback-modal";
import { Colors, BrandColors, Spacing, BorderRadius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuth } from "@/hooks/use-auth";
import { useSupabaseAuth } from "@/contexts/supabase-auth-context";
import { supabase } from "@/lib/supabase";
import { useAdmin } from "@/contexts/admin-context";
import { getLoginUrl } from "@/constants/oauth";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/language-context";

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
  const { t } = useLanguage();

  const handleLogin = () => {
    router.push("/auth/login");
  };

  const handleRegister = () => {
    router.push("/auth/register");
  };

  return (
    <View style={styles.loginContainer}>
      <View style={[styles.loginIcon, { backgroundColor: colors.primary + "15" }]}>
        <IconSymbol name="person.fill" size={48} color={colors.primary} />
      </View>
      <ThemedText style={styles.loginTitle}>{t.welcomeToApp}</ThemedText>
      <ThemedText style={[styles.loginSubtitle, { color: colors.textSecondary }]}>
        {t.loginPromptText}
      </ThemedText>
      <Pressable
        onPress={handleLogin}
        style={[
          styles.loginButton,
          { backgroundColor: colors.primary },
        ]}
      >
        <IconSymbol name="person.fill" size={20} color="#FFFFFF" />
        <ThemedText style={styles.loginButtonText}>{t.login}</ThemedText>
      </Pressable>
      <Pressable
        onPress={handleRegister}
        style={[
          styles.registerButton,
          { borderColor: colors.primary },
        ]}
      >
        <ThemedText style={[styles.registerButtonText, { color: colors.primary }]}>{t.register}</ThemedText>
      </Pressable>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { user: manusUser, isAuthenticated: manusAuth, loading: manusLoading } = useAuth();
  const { user: supabaseUser, loading: supabaseLoading, signOut } = useSupabaseAuth();
  const { t, language } = useLanguage();

  // Get language name for display
  const languageNames = { de: "Deutsch", en: "English", fr: "Français", it: "Italiano" };
  const currentLanguageName = languageNames[language];

  const [showEditModal, setShowEditModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Load avatar from users table
  useEffect(() => {
    async function loadAvatar() {
      if (!supabaseUser) {
        console.log('[Profile] No supabase user, cannot load avatar');
        return;
      }
      console.log('[Profile] Loading avatar for user:', supabaseUser.id);
      const { data, error } = await supabase
        .from('users')
        .select('avatar_url')
        .eq('open_id', supabaseUser.id)
        .single();

      console.log('[Profile] Avatar query result:', { data, error });

      if (data?.avatar_url) {
        console.log('[Profile] Setting avatar URL:', data.avatar_url);
        setAvatarUrl(data.avatar_url);
      } else {
        console.log('[Profile] No avatar URL found in users table');
        setAvatarUrl(null);
      }
    }
    loadAvatar();
  }, [supabaseUser, showEditModal]); // Reload when modal closes

  const user = supabaseUser || manusUser;
  const isAuthenticated = !!supabaseUser || manusAuth;
  const loading = supabaseLoading || manusLoading;
  const logout = supabaseUser ? signOut : () => { };

  // Admin context
  const { isAdmin, isAdminModeEnabled, toggleAdminMode } = useAdmin();

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
      t.deleteAccountConfirm,
      t.deleteAllData,
      [
        { text: t.cancel, style: "cancel" },
        {
          text: t.delete,
          style: "destructive",
          onPress: () => {
            Alert.alert(
              t.deleteAccountConfirm,
              t.deleteAllData,
              [
                { text: t.cancel, style: "cancel" },
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
            <Pressable
              onPress={() => setShowEditModal(true)}
              style={({ pressed }) => [
                styles.userCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <View style={[styles.userAvatar, { backgroundColor: colors.primary + "20" }]}>
                {(() => {
                  console.log('[Profile] Rendering avatar. avatarUrl:', avatarUrl);
                  if (avatarUrl) {
                    console.log('[Profile] Rendering Image with URL:', avatarUrl);
                    return (
                      <Image
                        key={avatarUrl}
                        source={{ uri: avatarUrl }}
                        style={styles.userAvatarImage}
                        contentFit="cover"
                        onError={(error) => console.error('[Profile] Image load error:', error)}
                        onLoad={() => console.log('[Profile] Image loaded successfully')}
                      />
                    );
                  } else {
                    console.log('[Profile] No avatarUrl, showing initials');
                    return (
                      <ThemedText style={[styles.userAvatarText, { color: colors.primary }]}>
                        {(supabaseUser?.user_metadata?.name || supabaseUser?.email || (manusUser as any)?.name || (manusUser as any)?.email || "U").charAt(0).toUpperCase()}
                      </ThemedText>
                    );
                  }
                })()}
              </View>
              <View style={styles.userInfo}>
                <ThemedText style={styles.userName}>
                  {supabaseUser?.user_metadata?.name || (manusUser as any)?.name || supabaseUser?.email?.split('@')[0] || "Benutzer"}
                </ThemedText>
                <ThemedText style={[styles.userEmail, { color: colors.textSecondary }]}>
                  {supabaseUser?.email || manusUser?.email || ""}
                </ThemedText>
              </View>
              <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
            </Pressable>

            {/* Edit Profile Modal */}
            {/* Feedback Modal */}
            <FeedbackModal
              visible={showFeedbackModal}
              onClose={() => setShowFeedbackModal(false)}
            />

            <EditProfileModal
              visible={showEditModal}
              onClose={() => setShowEditModal(false)}
              currentEmail={supabaseUser?.email || ""}
              currentPhotoUrl={supabaseUser?.user_metadata?.avatar_url}
              onSuccess={() => {
                // Refresh user data if needed
                setShowEditModal(false);
              }}
            />

            {/* Settings Sections */}
            <SettingSection title={t.generalSection}>
              <SettingItem
                icon="location.fill"
                iconColor={BrandColors.accent}
                title={t.profileLocation}
                subtitle={t.locationSubtitle}
                onPress={() => router.push("/settings/location" as any)}
              />
              <SettingItem
                icon="bell.fill"
                title={t.profileNotifications}
                subtitle={t.notificationsSubtitle}
                onPress={() => router.push("/settings/notifications" as any)}
              />
              <SettingItem
                icon="globe"
                title={t.profileLanguage}
                subtitle={currentLanguageName}
                onPress={() => router.push("/settings/language" as any)}
              />
              <SettingItem
                icon="moon.fill"
                title={t.profileAppearance}
                subtitle={t.appearanceSubtitle}
                onPress={() => router.push("/settings/appearance" as any)}
              />
            </SettingSection>

            <SettingSection title={t.socialSection}>
              <SettingItem
                icon="person.2.fill"
                iconColor={BrandColors.accent}
                title={t.profileFriends}
                subtitle={t.friendsSubtitle}
                onPress={() => router.push("/friends" as any)}
              />
              <SettingItem
                icon="square.and.arrow.up"
                iconColor={BrandColors.secondary}
                title={t.profileShare}
                subtitle={t.shareSubtitle}
                onPress={async () => {
                  try {
                    await Share.share({
                      message: t.shareMessage,
                      title: "AusflugFinder App",
                    });
                  } catch (error) {
                    console.error("Share error:", error);
                  }
                }}
              />
            </SettingSection>

            {/* Admin Mode Toggle - Always visible for admins */}
            {isAdmin && (
              <SettingSection title="ADMINISTRATION">
                <SettingItem
                  icon="wrench.fill"
                  iconColor={BrandColors.primary}
                  title="Admin-Modus"
                  subtitle={isAdminModeEnabled ? "Aktiviert - Bearbeiten möglich" : "Deaktiviert"}
                  rightElement={
                    <Switch
                      value={isAdminModeEnabled}
                      onValueChange={toggleAdminMode}
                      trackColor={{ false: colors.border, true: colors.primary }}
                    />
                  }
                />
              </SettingSection>
            )}

            {/* Admin Functions - Only visible when admin mode is enabled */}
            {isAdminModeEnabled && (
              <SettingSection title="ADMIN-FUNKTIONEN">
                <SettingItem
                  icon="plus.circle.fill"
                  iconColor="#10B981"
                  title="Neuer Ausflug"
                  subtitle="Ausflug hinzufügen"
                  onPress={() => router.push("/admin/create-trip" as any)}
                />
                <SettingItem
                  icon="paperplane.fill"
                  iconColor="#FF6B35"
                  title="Push-Benachrichtigungen"
                  subtitle="Broadcast an alle User senden"
                  onPress={() => router.push("/broadcast" as any)}
                />
              </SettingSection>
            )}

            <SettingSection title={t.supportSection}>
              <SettingItem
                icon="info.circle"
                iconColor={BrandColors.primary}
                title={t.profileAbout}
                onPress={() => router.push("/about" as any)}
              />
              <SettingItem
                icon="hand.raised.fill"
                title={t.profilePrivacy}
                onPress={() => router.push("/settings/privacy" as any)}
              />
              <SettingItem
                icon="envelope.fill"
                iconColor={BrandColors.accent}
                title={t.sendFeedback}
                onPress={() => setShowFeedbackModal(true)}
              />
            </SettingSection>

            <SettingSection title={t.accountSection}>
              <SettingItem
                icon="rectangle.portrait.and.arrow.right"
                title={t.logout}
                onPress={handleLogout}
                isDestructive
              />
              <SettingItem
                icon="trash.fill"
                title={t.deleteAccount}
                onPress={handleDeleteAccount}
                isDestructive
              />
            </SettingSection>

            {/* App Version */}
            <View style={styles.versionContainer}>
              <ThemedText style={[styles.versionText, { color: colors.textDisabled }]}>
                AusflugFinder v{Constants.expoConfig?.version || "1.0.0"} (Build {Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode || "1"})
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
    paddingTop: 16,
    paddingBottom: Spacing.sm,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginTop: Spacing.sm,
    lineHeight: 36,
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
  registerButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    borderRadius: BorderRadius.md,
    minWidth: 200,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    marginTop: Spacing.md,
  },
  registerButtonText: {
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
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  userAvatarImage: {
    width: "100%",
    height: "100%",
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
