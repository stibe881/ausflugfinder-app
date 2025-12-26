import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Alert } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';

interface TimelineTabProps {
    planId: string;
}

interface PlanTrip {
    id: string;
    trip_id?: number;
    custom_location?: string;
    planned_date: string;
    departure_time?: string;
    arrival_time?: string;
    trip?: { id: number; name: string };
}

export function TimelineTab({ planId }: TimelineTabProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const [trips, setTrips] = useState<PlanTrip[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTrips();
    }, [planId]);

    const loadTrips = async () => {
        const { data } = await supabase
            .from('plan_trips')
            .select('*, trip:ausfluege(id, name)')
            .eq('plan_id', planId)
            .order('sequence');

        if (data) setTrips(data as any);
        setLoading(false);
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ThemedText>Lädt...</ThemedText>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            {trips.length === 0 ? (
                <View style={[styles.empty, { backgroundColor: colors.surface }]}>
                    <IconSymbol name="calendar" size={48} color={colors.textSecondary} />
                    <ThemedText style={styles.emptyText}>Noch keine Trips geplant</ThemedText>
                </View>
            ) : (
                trips.map((trip, index) => (
                    <View key={trip.id} style={[styles.tripCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <View style={styles.tripHeader}>
                            <ThemedText style={styles.tripName}>
                                {trip.trip?.name || trip.custom_location}
                            </ThemedText>
                            <ThemedText style={[styles.date, { color: colors.textSecondary }]}>
                                {new Date(trip.planned_date).toLocaleDateString('de-CH')}
                            </ThemedText>
                        </View>
                        {trip.departure_time && (
                            <View style={styles.timeRow}>
                                <IconSymbol name="clock" size={14} color={colors.textSecondary} />
                                <ThemedText style={[styles.time, { color: colors.textSecondary }]}>
                                    {trip.departure_time}
                                </ThemedText>
                            </View>
                        )}
                    </View>
                ))
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: Spacing.md,
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    empty: {
        padding: Spacing.xl,
        borderRadius: 12,
        alignItems: 'center',
        gap: Spacing.md,
        marginTop: Spacing.xl,
    },
    emptyText: {
        fontSize: 16,
        opacity: 0.6,
    },
    tripCard: {
        padding: Spacing.md,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: Spacing.md,
    },
    tripHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Spacing.xs,
    },
    tripName: {
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
    },
    date: {
        fontSize: 14,
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    time: {
        fontSize: 13,
    },
});
