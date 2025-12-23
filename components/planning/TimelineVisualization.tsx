import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { TripActivity } from '@/lib/planning-api';

interface TimelineVisualizationProps {
    departureTime?: string;
    arrivalTime?: string;
    bufferMinutes?: number;
    activities: TripActivity[];
}

export function TimelineVisualization({
    departureTime,
    arrivalTime,
    bufferMinutes = 0,
    activities,
}: TimelineVisualizationProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const formatTime = (timeStr: string) => {
        const date = new Date(timeStr);
        return date.toLocaleTimeString('de-CH', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const calculateDuration = (start: string, end: string) => {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const diffMs = endDate.getTime() - startDate.getTime();
        const diffMinutes = Math.floor(diffMs / 60000);
        const hours = Math.floor(diffMinutes / 60);
        const minutes = diffMinutes % 60;

        if (hours > 0 && minutes > 0) {
            return `${hours}h ${minutes}m`;
        } else if (hours > 0) {
            return `${hours}h`;
        } else {
            return `${minutes}m`;
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'meal':
                return '#FF9500';
            case 'transport':
                return '#007AFF';
            case 'break':
                return '#8E8E93';
            case 'activity':
            default:
                return colors.tint;
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'meal':
                return 'fork.knife';
            case 'transport':
                return 'car.fill';
            case 'break':
                return 'pause.fill';
            case 'activity':
            default:
                return 'star.fill';
        }
    };

    if (!departureTime && !arrivalTime && activities.length === 0) {
        return (
            <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
                <IconSymbol name="clock" size={40} color={colors.textSecondary} />
                <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
                    Keine Zeiten oder Aktivitäten geplant
                </ThemedText>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            {/* Departure */}
            {departureTime && (
                <View style={styles.timelineItem}>
                    <View style={styles.timelineLeft}>
                        <View style={[styles.timelineDot, { backgroundColor: '#34C759' }]} />
                        <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />
                    </View>
                    <View style={[styles.timelineCard, { backgroundColor: colors.card }]}>
                        <View style={styles.timelineHeader}>
                            <IconSymbol name="arrow.up.circle.fill" size={20} color="#34C759" />
                            <View style={{ flex: 1 }}>
                                <ThemedText style={styles.timelineTitle}>Abfahrt</ThemedText>
                                <ThemedText style={[styles.timelineTime, { color: colors.textSecondary }]}>
                                    {formatTime(departureTime)}
                                </ThemedText>
                            </View>
                        </View>
                    </View>
                </View>
            )}

            {/* Activities */}
            {activities.map((activity, index) => (
                <View key={activity.id} style={styles.timelineItem}>
                    <View style={styles.timelineLeft}>
                        <View
                            style={[
                                styles.timelineDot,
                                { backgroundColor: getCategoryColor(activity.category) }
                            ]}
                        />
                        {(index < activities.length - 1 || arrivalTime) && (
                            <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />
                        )}
                    </View>
                    <View style={[styles.timelineCard, { backgroundColor: colors.card }]}>
                        <View style={styles.timelineHeader}>
                            <IconSymbol
                                name={getCategoryIcon(activity.category)}
                                size={20}
                                color={getCategoryColor(activity.category)}
                            />
                            <View style={{ flex: 1 }}>
                                <ThemedText style={styles.timelineTitle}>{activity.name}</ThemedText>
                                <ThemedText style={[styles.timelineTime, { color: colors.textSecondary }]}>
                                    {formatTime(activity.start_time)} - {formatTime(activity.end_time)}
                                    {' · '}
                                    {calculateDuration(activity.start_time, activity.end_time)}
                                </ThemedText>
                            </View>
                        </View>
                        {activity.description && (
                            <ThemedText style={[styles.timelineDescription, { color: colors.textSecondary }]}>
                                {activity.description}
                            </ThemedText>
                        )}
                        {activity.location && (
                            <ThemedText style={[styles.timelineLocation, { color: colors.textSecondary }]}>
                                📍 {activity.location}
                            </ThemedText>
                        )}
                    </View>
                </View>
            ))}

            {/* Arrival */}
            {arrivalTime && (
                <View style={styles.timelineItem}>
                    <View style={styles.timelineLeft}>
                        <View style={[styles.timelineDot, { backgroundColor: '#FF3B30' }]} />
                    </View>
                    <View style={[styles.timelineCard, { backgroundColor: colors.card }]}>
                        <View style={styles.timelineHeader}>
                            <IconSymbol name="arrow.down.circle.fill" size={20} color="#FF3B30" />
                            <View style={{ flex: 1 }}>
                                <ThemedText style={styles.timelineTitle}>Ankunft</ThemedText>
                                <ThemedText style={[styles.timelineTime, { color: colors.textSecondary }]}>
                                    {formatTime(arrivalTime)}
                                    {departureTime && bufferMinutes > 0 && (
                                        <ThemedText style={[styles.bufferText, { color: colors.textSecondary }]}>
                                            {' '}(+{bufferMinutes}m Puffer)
                                        </ThemedText>
                                    )}
                                </ThemedText>
                            </View>
                        </View>
                        {departureTime && (
                            <ThemedText style={[styles.totalDuration, { color: colors.textSecondary }]}>
                                Gesamtdauer: {calculateDuration(departureTime, arrivalTime)}
                            </ThemedText>
                        )}
                    </View>
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: Spacing.md,
    },
    emptyState: {
        padding: Spacing.xl,
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
        gap: Spacing.md,
        margin: Spacing.md,
    },
    emptyText: {
        fontSize: 14,
        textAlign: 'center',
    },
    timelineItem: {
        flexDirection: 'row',
        marginBottom: Spacing.md,
    },
    timelineLeft: {
        width: 30,
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    timelineDot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        marginTop: 6,
    },
    timelineLine: {
        flex: 1,
        width: 2,
        marginTop: Spacing.xs,
    },
    timelineCard: {
        flex: 1,
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
    },
    timelineHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.sm,
    },
    timelineTitle: {
        fontSize: 15,
        fontWeight: '600',
    },
    timelineTime: {
        fontSize: 13,
        marginTop: 2,
    },
    timelineDescription: {
        fontSize: 13,
        marginTop: Spacing.sm,
        marginLeft: 28,
    },
    timelineLocation: {
        fontSize: 13,
        marginTop: Spacing.xs,
        marginLeft: 28,
    },
    bufferText: {
        fontSize: 12,
    },
    totalDuration: {
        fontSize: 13,
        marginTop: Spacing.sm,
        marginLeft: 28,
        fontWeight: '500',
    },
});
