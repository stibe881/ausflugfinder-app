import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';

interface TimelineTabProps {
    planId: string;
}

interface PlanTrip {
    id: string;
    trip_id?: number;
    custom_location?: string;
    custom_address?: string;
    planned_date: string;
    departure_time?: string;
    arrival_time?: string;
    sequence: number;
    trip?: {
        id: number;
        name: string;
        adresse: string;
        region?: string;
        primaryPhotoUrl?: string;
    };
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
        // Fetch plan trips with joined trip data
        const { data } = await supabase
            .from('plan_trips')
            .select(`
                *,
                trip:ausfluege(id, name, adresse, region)
            `)
            .eq('plan_id', planId)
            .order('sequence');

        if (data) {
            // Get primary photos for trips that have trip_id
            const tripIds = data
                .filter(t => t.trip_id)
                .map(t => t.trip_id);

            let photosMap: Record<number, string> = {};
            if (tripIds.length > 0) {
                const { data: photos } = await supabase
                    .from('ausfluege_fotos')
                    .select('ausflug_id, full_url')
                    .in('ausflug_id', tripIds)
                    .eq('is_primary', true);

                photos?.forEach(photo => {
                    photosMap[photo.ausflug_id] = photo.full_url;
                });
            }

            // Map photos to trips
            const tripsWithPhotos = data.map(trip => ({
                ...trip,
                trip: trip.trip ? {
                    ...trip.trip,
                    primaryPhotoUrl: trip.trip_id ? photosMap[trip.trip_id] : undefined
                } : undefined
            }));

            setTrips(tripsWithPhotos as any);
        }
        setLoading(false);
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            {trips.length === 0 ? (
                <View style={[styles.empty, { backgroundColor: colors.surface }]}>
                    <IconSymbol name="calendar" size={48} color={colors.textSecondary} />
                    <ThemedText style={styles.emptyText}>Noch keine Ausflüge geplant</ThemedText>
                    <ThemedText style={[styles.emptyHint, { color: colors.textSecondary }]}>
                        Füge Ausflüge über das + hinzu
                    </ThemedText>
                </View>
            ) : (
                trips.map((trip, index) => {
                    const name = trip.trip?.name || trip.custom_location || 'Unbenannt';
                    const address = trip.trip?.adresse || trip.custom_address;
                    const imageUrl = trip.trip?.primaryPhotoUrl;

                    return (
                        <View
                            key={trip.id}
                            style={[
                                styles.tripCard,
                                {
                                    backgroundColor: colors.card,
                                    borderColor: colors.border
                                }
                            ]}
                        >
                            {/* Image */}
                            <View style={styles.tripImageContainer}>
                                {imageUrl ? (
                                    <Image
                                        source={{ uri: imageUrl }}
                                        style={styles.tripImage}
                                        contentFit="cover"
                                    />
                                ) : (
                                    <View style={[styles.tripImagePlaceholder, { backgroundColor: colors.surface }]}>
                                        <IconSymbol name="mountain.2.fill" size={32} color={colors.textSecondary} />
                                    </View>
                                )}
                                {/* Sequence Badge */}
                                <View style={[styles.sequenceBadge, { backgroundColor: colors.primary }]}>
                                    <ThemedText style={styles.sequenceText}>{index + 1}</ThemedText>
                                </View>
                            </View>

                            {/* Content */}
                            <View style={styles.tripContent}>
                                <ThemedText style={styles.tripName} numberOfLines={1}>
                                    {name}
                                </ThemedText>

                                {address && (
                                    <View style={styles.addressRow}>
                                        <IconSymbol name="mappin.and.ellipse" size={12} color={colors.textSecondary} />
                                        <ThemedText
                                            style={[styles.address, { color: colors.textSecondary }]}
                                            numberOfLines={1}
                                        >
                                            {address}
                                        </ThemedText>
                                    </View>
                                )}

                                <View style={styles.metaRow}>
                                    <View style={styles.dateRow}>
                                        <IconSymbol name="calendar" size={12} color={colors.textSecondary} />
                                        <ThemedText style={[styles.metaText, { color: colors.textSecondary }]}>
                                            {new Date(trip.planned_date).toLocaleDateString('de-CH', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric'
                                            })}
                                        </ThemedText>
                                    </View>

                                    {trip.departure_time && (
                                        <View style={styles.timeRow}>
                                            <IconSymbol name="clock.fill" size={12} color={colors.textSecondary} />
                                            <ThemedText style={[styles.metaText, { color: colors.textSecondary }]}>
                                                {trip.departure_time}
                                            </ThemedText>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </View>
                    );
                })
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
        paddingBottom: Spacing.xl,
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    empty: {
        padding: Spacing.xl,
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
        gap: Spacing.sm,
        marginTop: Spacing.xl,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: Spacing.sm,
    },
    emptyHint: {
        fontSize: 14,
        textAlign: 'center',
    },
    tripCard: {
        flexDirection: 'row',
        height: 120,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        marginBottom: Spacing.md,
        overflow: 'hidden',
    },
    tripImageContainer: {
        width: 120,
        height: '100%',
        position: 'relative',
    },
    tripImage: {
        width: '100%',
        height: '100%',
    },
    tripImagePlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sequenceBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
    sequenceText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '700',
    },
    tripContent: {
        flex: 1,
        padding: Spacing.sm,
        justifyContent: 'center',
        gap: Spacing.xs,
    },
    tripName: {
        fontSize: 16,
        fontWeight: '600',
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    address: {
        fontSize: 13,
        flex: 1,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 12,
    },
});
