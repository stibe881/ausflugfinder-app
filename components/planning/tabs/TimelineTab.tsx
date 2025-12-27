import React, { useEffect, useState, useRef } from 'react';
import { View, ScrollView, StyleSheet, Pressable, ActivityIndicator, Alert, Animated } from 'react-native';
import { Image } from 'expo-image';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';
import { InputDialog } from '@/components/InputDialog';

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
    const [editingTrip, setEditingTrip] = useState<PlanTrip | null>(null);
    const swipeableRefs = useRef<{ [key: string]: Swipeable | null }>({});

    useEffect(() => {
        loadTrips();
    }, [planId]);

    const loadTrips = async () => {
        const { data } = await supabase
            .from('plan_trips')
            .select(`
                *,
                trip:ausfluege(id, name, adresse, region)
            `)
            .eq('plan_id', planId)
            .order('sequence');

        if (data) {
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

    const handleDelete = (trip: PlanTrip) => {
        const name = trip.trip?.name || trip.custom_location || 'Diesen Ausflug';

        Alert.alert(
            'Ausflug entfernen',
            `Möchtest du "${name}" aus dem Plan entfernen?`,
            [
                { text: 'Abbrechen', style: 'cancel' },
                {
                    text: 'Entfernen',
                    style: 'destructive',
                    onPress: async () => {
                        const { error } = await supabase
                            .from('plan_trips')
                            .delete()
                            .eq('id', trip.id);

                        if (!error) {
                            loadTrips();
                        } else {
                            Alert.alert('Fehler', 'Konnte nicht gelöscht werden');
                        }
                    }
                }
            ]
        );
    };

    const handleEdit = (trip: PlanTrip) => {
        // Only custom trips can be edited
        if (!trip.custom_location) {
            Alert.alert('Info', 'Nur eigene Ausflüge können bearbeitet werden');
            return;
        }

        // Close swipeable
        swipeableRefs.current[trip.id]?.close();
        setEditingTrip(trip);
    };

    const handleConfirmEdit = async (newName: string, newAddress?: string) => {
        if (!editingTrip || !newName.trim()) {
            setEditingTrip(null);
            return;
        }

        const { error } = await supabase
            .from('plan_trips')
            .update({
                custom_location: newName.trim(),
                custom_address: newAddress?.trim() || null
            })
            .eq('id', editingTrip.id);

        setEditingTrip(null);

        if (!error) {
            loadTrips();
        } else {
            Alert.alert('Fehler', 'Konnte nicht aktualisiert werden');
        }
    };

    const moveTrip = async (fromIndex: number, toIndex: number) => {
        if (fromIndex === toIndex) return;

        const newTrips = [...trips];
        const [movedTrip] = newTrips.splice(fromIndex, 1);
        newTrips.splice(toIndex, 0, movedTrip);

        // Update UI immediately
        setTrips(newTrips);

        // Update sequences in database
        const updates = newTrips.map((trip, index) => ({
            id: trip.id,
            sequence: index
        }));

        for (const update of updates) {
            await supabase
                .from('plan_trips')
                .update({ sequence: update.sequence })
                .eq('id', update.id);
        }
    };

    const renderRightActions = (trip: PlanTrip, progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
        const isCustom = !!trip.custom_location;

        return (
            <View style={styles.swipeActions}>
                {isCustom && (
                    <Pressable
                        onPress={() => handleEdit(trip)}
                        style={[styles.swipeButton, styles.editButton]}
                    >
                        <IconSymbol name="pencil" size={20} color="#FFF" />
                    </Pressable>
                )}
                <Pressable
                    onPress={() => {
                        swipeableRefs.current[trip.id]?.close();
                        handleDelete(trip);
                    }}
                    style={[styles.swipeButton, styles.deleteButton]}
                >
                    <IconSymbol name="trash.fill" size={20} color="#FFF" />
                </Pressable>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <>
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
                        const isCustom = !!trip.custom_location;

                        return (
                            <Swipeable
                                key={trip.id}
                                ref={ref => swipeableRefs.current[trip.id] = ref}
                                renderRightActions={(progress, dragX) => renderRightActions(trip, progress, dragX)}
                                overshootRight={false}
                                containerStyle={{ marginBottom: Spacing.md }}
                            >
                                <View
                                    style={[
                                        styles.tripCard,
                                        {
                                            backgroundColor: colors.card,
                                            borderColor: colors.border
                                        }
                                    ]}
                                >
                                    {/* Drag Handle - Left side */}
                                    <View style={styles.dragHandle}>
                                        <IconSymbol name="line.3.horizontal" size={20} color={colors.textSecondary} />
                                    </View>

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
                                        {/* Custom Badge */}
                                        {isCustom && (
                                            <View style={[styles.customBadge, { backgroundColor: '#10B981' }]}>
                                                <IconSymbol name="star.fill" size={12} color="#FFF" />
                                            </View>
                                        )}
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

                                    {/* Reorder Buttons */}
                                    <View style={styles.reorderButtons}>
                                        <Pressable
                                            disabled={index === 0}
                                            onPress={() => moveTrip(index, index - 1)}
                                            style={[
                                                styles.reorderButton,
                                                index === 0 && styles.reorderButtonDisabled
                                            ]}
                                        >
                                            <IconSymbol
                                                name="chevron.up"
                                                size={16}
                                                color={index === 0 ? colors.border : colors.textSecondary}
                                            />
                                        </Pressable>
                                        <Pressable
                                            disabled={index === trips.length - 1}
                                            onPress={() => moveTrip(index, index + 1)}
                                            style={[
                                                styles.reorderButton,
                                                index === trips.length - 1 && styles.reorderButtonDisabled
                                            ]}
                                        >
                                            <IconSymbol
                                                name="chevron.down"
                                                size={16}
                                                color={index === trips.length - 1 ? colors.border : colors.textSecondary}
                                            />
                                        </Pressable>
                                    </View>
                                </View>
                            </Swipeable>
                        );
                    })
                )}
            </ScrollView>

            {/* Edit Dialog */}
            {editingTrip && (
                <InputDialog
                    visible={true}
                    title="Ausflug bearbeiten"
                    message="Ändere Name und/oder Adresse:"
                    placeholder={editingTrip.custom_location || ''}
                    secondPlaceholder={editingTrip.custom_address || 'Adresse (optional)'}
                    onConfirm={handleConfirmEdit}
                    onCancel={() => setEditingTrip(null)}
                />
            )}
        </>
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
        overflow: 'hidden',
    },
    dragHandle: {
        width: 32,
        justifyContent: 'center',
        alignItems: 'center',
        paddingLeft: 8,
    },
    tripImageContainer: {
        width: 100,
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
    customBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
    tripContent: {
        flex: 1,
        padding: Spacing.sm,
        justifyContent: 'center',
        gap: Spacing.xs,
    },
    tripName: {
        fontSize: 15,
        fontWeight: '600',
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    address: {
        fontSize: 12,
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
        fontSize: 11,
    },
    reorderButtons: {
        width: 36,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 4,
        paddingRight: 4,
    },
    reorderButton: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    reorderButtonDisabled: {
        opacity: 0.3,
    },
    swipeActions: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 8,
    },
    swipeButton: {
        width: 70,
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: BorderRadius.md,
        marginLeft: 4,
    },
    editButton: {
        backgroundColor: '#3B82F6',
    },
    deleteButton: {
        backgroundColor: '#EF4444',
    },
});
