import React from 'react';
import { View, StyleSheet, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Plan } from '@/lib/planning-api';

interface PlanHeaderProps {
    plan: Plan;
    participantCount: number;
    totalBudget: number;
    taskProgress: {
        completed: number;
        total: number;
    };
}

export function PlanHeader({ plan, participantCount, totalBudget, taskProgress }: PlanHeaderProps) {
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
                <View style={[styles.headerImage, { backgroundColor: colors.surfaceVariant }]} />
            )}

            <View style={styles.contentContainer}>
                <ThemedText type="title" style={styles.title}>{plan.title}</ThemedText>
                <ThemedText style={styles.dates}>{dateRange}</ThemedText>

                <View style={[styles.statsRow, { backgroundColor: colors.surface }]}>
                    <View style={styles.statItem}>
                        <ThemedText type="defaultSemiBold">{participantCount}</ThemedText>
                        <ThemedText style={styles.statLabel}>Personen</ThemedText>
                    </View>
                    <View style={styles.statItem}>
                        <ThemedText type="defaultSemiBold">{totalBudget.toFixed(2)} €</ThemedText>
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
        marginBottom: Spacing.sm,
    },
    headerImage: {
        height: 200,
        width: '100%',
        justifyContent: 'flex-end',
    },
    gradient: {
        ...StyleSheet.absoluteFillObject,
    },
    contentContainer: {
        paddingHorizontal: Spacing.md,
        marginTop: -60,
    },
    title: {
        color: '#FFFFFF',
        marginBottom: Spacing.xs,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    dates: {
        color: 'rgba(255, 255, 255, 0.9)',
        marginBottom: Spacing.lg,
        fontWeight: '600',
    },
    statsRow: {
        flexDirection: 'row',
        borderRadius: 12,
        padding: Spacing.md,
        justifyContent: 'space-around',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    statItem: {
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 12,
        opacity: 0.6,
        marginTop: 2,
    },
});
