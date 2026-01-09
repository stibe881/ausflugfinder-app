import { Stack, router } from 'expo-router';
import { View, StyleSheet, Pressable } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { FriendsScreen } from '@/components/friends/FriendsScreen';
import { useAuth } from '@/hooks/use-auth';

export default function FriendsPage() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: true, headerTitle: 'Freunde' }} />
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <ThemedText>Laden...</ThemedText>
        </View>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Stack.Screen options={{ headerShown: true, headerTitle: 'Freunde' }} />
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.emptyState}>
            <IconSymbol name="person.2" size={64} color={colors.textSecondary} />
            <ThemedText style={styles.emptyTitle}>Nicht angemeldet</ThemedText>
            <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
              Melde dich an, um Freunde zu verwalten
            </ThemedText>
            <Pressable
              style={[styles.loginButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/auth/login' as any)}
            >
              <ThemedText style={styles.loginButtonText}>Anmelden</ThemedText>
            </Pressable>
          </View>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Freunde',
          headerBackTitle: 'Zurück'
        }}
      />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <FriendsScreen />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  loginButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: 12,
  },
  loginButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
