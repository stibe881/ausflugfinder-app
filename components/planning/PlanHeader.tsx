import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Plan } from '@/lib/planning-api';
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

    const startDate = formatDate(plan.start_date || '');
    const endDate = plan.end_date ? formatDate(plan.end_date) : '';

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Large Title */}
            <ThemedText style={styles.title}>{plan.title}</ThemedText>

            {/* Date Row with Edit Icon */}
            <Pressable
                onPress={onEditDate}
                style={({ pressed }) => [
                    styles.dateRow,
                    { opacity: pressed ? 0.7 : 1 }
                ]}
            >
                <ThemedText style={[styles.dateText, { color: colors.text }]}>
                    {startDate} {endDate && `- ${endDate}`}
                </ThemedText>
                {onEditDate && (
                    <IconSymbol
                        name="pencil"
                        size={16}
                        color={colors.text}
                        style={styles.editIcon}
                    />
                )}
            </Pressable>

            {/* Stats Card */}
            <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
                <Pressable
                    onPress={onManageParticipants}
                    style={styles.statItem}
                >
                    <ThemedText style={styles.statValue}>{participantCount}</ThemedText>
                    <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
                        Personen
                    </ThemedText>
                </Pressable>

                <View style={styles.statItem}>
                    <ThemedText style={styles.statValue}>
                        {totalBudget.toFixed(2)} CHF
                    </ThemedText>
                    <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
                        Budget
                    </ThemedText>
                </View>

                <View style={styles.statItem}>
                    <ThemedText style={styles.statValue}>
                        {taskProgress.completed}/{taskProgress.total}
                    </ThemedText>
                    <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
                        Aufgaben
                    </ThemedText>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.xl,
        paddingBottom: Spacing.md,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        lineHeight: 40,
        marginBottom: Spacing.xs,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    dateText: {
        fontSize: 16,
        fontWeight: '400',
    },
    editIcon: {
        marginLeft: Spacing.sm,
    },
    statsCard: {
        flexDirection: 'row',
        borderRadius: 16,
        paddingVertical: Spacing.lg,
        paddingHorizontal: Spacing.md,
        justifyContent: 'space-around',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 13,
        fontWeight: '400',
    },
});
