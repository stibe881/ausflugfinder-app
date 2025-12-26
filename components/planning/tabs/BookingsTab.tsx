import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Alert, Linking } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AddBookingDialog } from '@/components/planning/AddBookingDialog';
import { getBookings, deleteBooking, type Booking } from '@/lib/planning-api';
import { downloadFile } from '@/lib/storage';

interface BookingsTabProps {
    planId: string;
}

export function BookingsTab({ planId }: BookingsTabProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [editingBooking, setEditingBooking] = useState<Booking | undefined>();

    useEffect(() => {
        loadBookings();
    }, [planId]);

    const loadBookings = async () => {
        const result = await getBookings(planId);
        if (result.success && result.bookings) {
            setBookings(result.bookings);
        }
        setLoading(false);
    };

    const handleEdit = (booking: Booking) => {
        setEditingBooking(booking);
        setShowAddDialog(true);
    };

    const handleDelete = (booking: Booking) => {
        Alert.alert(
            'Buchung löschen',
            'Möchtest du diese Buchung wirklich löschen?',
            [
                { text: 'Abbrechen', style: 'cancel' },
                {
                    text: 'Löschen',
                    style: 'destructive',
                    onPress: async () => {
                        await deleteBooking(booking.id);
                        loadBookings();
                    },
                },
            ]
        );
    };

    const handleDownloadFile = async (booking: Booking) => {
        if (!booking.confirmation_file_path) return;

        try {
            const result = await downloadFile(booking.confirmation_file_path);
            if (result.success && result.blob) {
                const fileName = booking.confirmation_file_path.split('/').pop() || 'booking.pdf';
                const fileUri = `${FileSystem.documentDirectory}${fileName}`;

                const reader = new FileReader();
                reader.readAsDataURL(result.blob);
                reader.onloadend = async () => {
                    const base64data = reader.result as string;
                    await FileSystem.writeAsStringAsync(fileUri, base64data.split(',')[1], {
                        encoding: FileSystem.EncodingType.Base64,
                    });

                    if (await Sharing.isAvailableAsync()) {
                        await Sharing.shareAsync(fileUri);
                    } else {
                        Alert.alert('Erfolg', 'Datei wurde heruntergeladen');
                    }
                };
            }
        } catch (error) {
            Alert.alert('Fehler', 'Datei konnte nicht heruntergeladen werden');
            console.error('Download error:', error);
        }
    };

    const handleOpenUrl = (url: string) => {
        Linking.openURL(url).catch(() => {
            Alert.alert('Fehler', 'Link konnte nicht geöffnet werden');
        });
    };

    const handleDialogClose = () => {
        setShowAddDialog(false);
        setEditingBooking(undefined);
    };

    const handleDialogSaved = () => {
        loadBookings();
        handleDialogClose();
    };

    const getIconForType = (type: string) => {
        switch (type) {
            case 'accommodation': return 'house';
            case 'activity': return 'sportscourt';
            case 'restaurant': return 'fork.knife';
            case 'event': return 'calendar.badge.clock';
            default: return 'bookmark';
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'accommodation': return 'Unterkünfte';
            case 'activity': return 'Aktivitäten';
            case 'restaurant': return 'Restaurants';
            case 'event': return 'Events';
            default: return 'Weitere';
        }
    };

    const groupedBookings = bookings.reduce((acc, booking) => {
        if (!acc[booking.type]) acc[booking.type] = [];
        acc[booking.type].push(booking);
        return acc;
    }, {} as Record<string, Booking[]>);

    return (
        <>
            <ScrollView style={styles.container}>
                {bookings.length === 0 ? (
                    <View style={[styles.empty, { backgroundColor: colors.surface }]}>
                        <IconSymbol name="bookmark" size={48} color={colors.textSecondary} />
                        <ThemedText style={styles.emptyText}>Noch keine Buchungen</ThemedText>
                        <Pressable
                            style={[styles.addButton, { backgroundColor: colors.primary }]}
                            onPress={() => setShowAddDialog(true)}
                        >
                            <IconSymbol name="plus" size={20} color="#FFF" />
                            <ThemedText style={styles.addButtonText}>Buchung hinzufügen</ThemedText>
                        </Pressable>
                    </View>
                ) : (
                    <>
                        {Object.entries(groupedBookings).map(([type, typeBookings]) => (
                            <View key={type} style={styles.section}>
                                <ThemedText style={styles.sectionTitle}>
                                    {getTypeLabel(type)}
                                </ThemedText>
                                {typeBookings.map(booking => (
                                    <View key={booking.id} style={[styles.bookingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                        <View style={styles.bookingHeader}>
                                            <IconSymbol name={getIconForType(booking.type) as any} size={20} color={colors.primary} />
                                            <ThemedText style={styles.bookingName}>{booking.name}</ThemedText>
                                            <View style={styles.actions}>
                                                <Pressable onPress={() => handleEdit(booking)} style={styles.actionButton}>
                                                    <IconSymbol name="pencil" size={18} color={colors.primary} />
                                                </Pressable>
                                                <Pressable onPress={() => handleDelete(booking)} style={styles.actionButton}>
                                                    <IconSymbol name="trash" size={18} color="#FF3B30" />
                                                </Pressable>
                                            </View>
                                        </View>

                                        {booking.location && (
                                            <View style={styles.row}>
                                                <IconSymbol name="mappin" size={14} color={colors.textSecondary} />
                                                <ThemedText style={[styles.detail, { color: colors.textSecondary }]}>
                                                    {booking.location}
                                                </ThemedText>
                                            </View>
                                        )}

                                        {booking.date && (
                                            <View style={styles.row}>
                                                <IconSymbol name="calendar" size={14} color={colors.textSecondary} />
                                                <ThemedText style={[styles.detail, { color: colors.textSecondary }]}>
                                                    {new Date(booking.date).toLocaleDateString('de-CH')}
                                                    {booking.time && ` · ${booking.time}`}
                                                </ThemedText>
                                            </View>
                                        )}

                                        {booking.cost !== null && booking.cost !== undefined && (
                                            <View style={styles.row}>
                                                <IconSymbol name="dollarsign" size={14} color={colors.textSecondary} />
                                                <ThemedText style={styles.cost}>
                                                    CHF {booking.cost.toFixed(2)}
                                                </ThemedText>
                                            </View>
                                        )}

                                        {booking.booking_reference && (
                                            <ThemedText style={[styles.bookingRef, { color: colors.textSecondary }]}>
                                                Buchung: {booking.booking_reference}
                                            </ThemedText>
                                        )}

                                        {booking.confirmation_file_path && (
                                            <Pressable
                                                style={[styles.fileButton, { backgroundColor: colors.background }]}
                                                onPress={() => handleDownloadFile(booking)}
                                            >
                                                <IconSymbol name="doc.fill" size={16} color={colors.primary} />
                                                <ThemedText style={[styles.fileButtonText, { color: colors.primary }]}>
                                                    Bestätigung anzeigen
                                                </ThemedText>
                                            </Pressable>
                                        )}

                                        {booking.confirmation_url && (
                                            <Pressable
                                                style={[styles.linkButton, { backgroundColor: colors.background }]}
                                                onPress={() => handleOpenUrl(booking.confirmation_url!)}
                                            >
                                                <IconSymbol name="link" size={16} color={colors.primary} />
                                                <ThemedText style={[styles.linkButtonText, { color: colors.primary }]}>
                                                    Link öffnen
                                                </ThemedText>
                                            </Pressable>
                                        )}
                                    </View>
                                ))}
                            </View>
                        ))}

                        <Pressable
                            style={[styles.fab, { backgroundColor: colors.primary }]}
                            onPress={() => setShowAddDialog(true)}
                        >
                            <IconSymbol name="plus" size={24} color="#FFF" />
                        </Pressable>
                    </>
                )}
            </ScrollView>

            <AddBookingDialog
                visible={showAddDialog}
                planId={planId}
                booking={editingBooking}
                onClose={handleDialogClose}
                onSaved={handleDialogSaved}
            />
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: Spacing.md,
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
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderRadius: 8,
        marginTop: Spacing.sm,
    },
    addButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    section: {
        marginBottom: Spacing.lg,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: Spacing.sm,
    },
    bookingCard: {
        padding: Spacing.md,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: Spacing.sm,
    },
    bookingHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.sm,
    },
    bookingName: {
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
    },
    actions: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    actionButton: {
        padding: Spacing.xs,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        marginBottom: Spacing.xs,
    },
    detail: {
        fontSize: 13,
    },
    cost: {
        fontSize: 15,
        fontWeight: '600',
    },
    bookingRef: {
        fontSize: 12,
        marginTop: Spacing.xs,
    },
    fileButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        padding: Spacing.sm,
        borderRadius: 6,
        marginTop: Spacing.sm,
        alignSelf: 'flex-start',
    },
    fileButtonText: {
        fontSize: 13,
        fontWeight: '600',
    },
    linkButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        padding: Spacing.sm,
        borderRadius: 6,
        marginTop: Spacing.xs,
        alignSelf: 'flex-start',
    },
    linkButtonText: {
        fontSize: 13,
        fontWeight: '600',
    },
    fab: {
        position: 'absolute',
        bottom: Spacing.lg,
        right: Spacing.lg,
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
});
