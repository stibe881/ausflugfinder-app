import React from 'react';
import { View, StyleSheet, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Plan } from '@/lib/planning-api';

import { Pressable } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface PlanHeaderProps {
    plan: Plan;
    participantCount: number;
    totalBudget: number;
    taskProgress: {
        completed: number;
        total: number;
    };
    onEditDate?: () => void;
    onManageParticipants?: () => void;
}

export function PlanHeader({
    plan,
    participantCount,
    totalBudget,
    taskProgress,
    onEditDate,
    onManageParticipants
}: PlanHeaderProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    // Format date range
    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
    };
    const dateRange = `${formatDate(plan.start_date || '')} - ${formatDate(plan.end_date || '')}`;

    return (
        <View style={styles.container}>
            {plan.image_url ? (
                <ImageBackground
                    source={{ uri: plan.image_url }}
                    style={styles.headerImage}
                >
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.8)']}
                        style={styles.gradient}
                    />
                </ImageBackground>
            ) : (
                <View style={[styles.headerImage, { backgroundColor: colors.surface }]} />
            )}

            <View style={styles.contentContainer}>
                <ThemedText type="title" style={styles.title}>{plan.title}</ThemedText>

                <Pressable onPress={onEditDate} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, flexDirection: 'row', alignItems: 'center' })}>
                    <ThemedText style={styles.dates}>{dateRange}</ThemedText>
                    {onEditDate && <IconSymbol name="pencil" size={14} color="rgba(255,255,255,0.8)" style={{ marginLeft: 6, marginBottom: Spacing.lg }} />}
                </Pressable>

                <View style={[styles.statsRow, { backgroundColor: colors.surface }]}>
                    <Pressable onPress={onManageParticipants} style={({ pressed }) => [styles.statItem, { opacity: pressed ? 0.7 : 1 }]}>
                        <ThemedText type="defaultSemiBold">{participantCount}</ThemedText>
                        <ThemedText style={styles.statLabel}>Personen</ThemedText>
                    </Pressable>
                    <View style={styles.statItem}>
                        <ThemedText type="defaultSemiBold">{totalBudget.toFixed(2)} CHF</ThemedText>
                        <ThemedText style={styles.statLabel}>Budget</ThemedText>
                    </View>
                    <View style={styles.statItem}>
                        <ThemedText type="defaultSemiBold">{taskProgress.completed}/{taskProgress.total}</ThemedText>
                        <ThemedText style={styles.statLabel}>Aufgaben</ThemedText>
                    </View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: Spacing.md,
        backgroundColor: 'transparent',
    },
    headerImage: {
        height: 240, // Increased height
        width: '100%',
        justifyContent: 'flex-end',
    },
    gradient: {
        ...StyleSheet.absoluteFillObject,
    },
    contentContainer: {
        paddingHorizontal: Spacing.md,
        marginTop: -80, // Adjusted overlap
        paddingBottom: Spacing.xs,
    },
    title: {
        color: '#FFFFFF',
        marginBottom: Spacing.xs,
        fontSize: 28, // Ensure readability
        fontWeight: 'bold',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    dates: {
        color: 'rgba(255, 255, 255, 0.95)',
        marginBottom: Spacing.lg,
        fontWeight: '600',
        fontSize: 15,
    },
    statsRow: {
        flexDirection: 'row',
        borderRadius: 16,
        paddingVertical: Spacing.lg,
        paddingHorizontal: Spacing.md,
        justifyContent: 'space-between',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        marginTop: Spacing.sm,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statLabel: {
        fontSize: 12,
        opacity: 0.7,
        marginTop: 4,
        fontWeight: '500',
    },
});
