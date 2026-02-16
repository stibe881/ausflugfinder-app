import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

interface RouteTabProps {
    planId: string;
}

export function RouteTab({ planId }: RouteTabProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    return (
        <View style={[styles.center, { backgroundColor: colors.background }]}>
            <IconSymbol name="map" size={64} color={colors.textSecondary} />
            <ThemedText style={styles.emptyText}>Routenplanung</ThemedText>
            <ThemedText style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                Die Kartenansicht ist nur in der App verfügbar.
            </ThemedText>
        </View>
    );
}

const styles = StyleSheet.create({
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.xl,
        gap: Spacing.md,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
    },
    emptySubtext: {
        fontSize: 14,
        textAlign: 'center',
    },
});
