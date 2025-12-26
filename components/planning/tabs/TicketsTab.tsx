import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AddTicketDialog } from '@/components/planning/AddTicketDialog';
import { getTickets, deleteTicket, type Ticket } from '@/lib/planning-api';
import { downloadFile } from '@/lib/storage';

interface TicketsTabProps {
    planId: string;
}

export function TicketsTab({ planId }: TicketsTabProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [editingTicket, setEditingTicket] = useState<Ticket | undefined>();

    useEffect(() => {
        loadTickets();
    }, [planId]);

    const loadTickets = async () => {
        const result = await getTickets(planId);
        if (result.success && result.tickets) {
            setTickets(result.tickets);
        }
        setLoading(false);
    };

    const handleEdit = (ticket: Ticket) => {
        setEditingTicket(ticket);
        setShowAddDialog(true);
    };

    const handleDelete = (ticket: Ticket) => {
        Alert.alert(
            'Ticket löschen',
            'Möchtest du dieses Ticket wirklich löschen?',
            [
                { text: 'Abbrechen', style: 'cancel' },
                {
                    text: 'Löschen',
                    style: 'destructive',
                    onPress: async () => {
                        await deleteTicket(ticket.id);
                        loadTickets();
                    },
                },
            ]
        );
    };

    const handleDownloadFile = async (ticket: Ticket) => {
        if (!ticket.ticket_file_path) return;

        try {
            const result = await downloadFile(ticket.ticket_file_path);
            if (result.success && result.blob) {
                // Convert blob to local file
                const fileName = ticket.ticket_file_path.split('/').pop() || 'ticket.pdf';
                const fileUri = `${FileSystem.documentDirectory}${fileName}`;

                // Save blob to filesystem
                const reader = new FileReader();
                reader.readAsDataURL(result.blob);
                reader.onloadend = async () => {
                    const base64data = reader.result as string;
                    await FileSystem.writeAsStringAsync(fileUri, base64data.split(',')[1], {
                        encoding: FileSystem.EncodingType.Base64,
                    });

                    // Share/open file
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

    const handleDialogClose = () => {
        setShowAddDialog(false);
        setEditingTicket(undefined);
    };

    const handleDialogSaved = () => {
        loadTickets();
        handleDialogClose();
    };

    const getIconForType = (type: string) => {
        switch (type) {
            case 'flight': return 'airplane';
            case 'train': return 'tram';
            case 'bus': return 'bus';
            case 'ferry': return 'ferry';
            default: return 'ticket';
        }
    };

    return (
        <>
            <ScrollView style={styles.container}>
                {tickets.length === 0 ? (
                    <View style={[styles.empty, { backgroundColor: colors.surface }]}>
                        <IconSymbol name="ticket" size={48} color={colors.textSecondary} />
                        <ThemedText style={styles.emptyText}>Noch keine Tickets</ThemedText>
                        <Pressable
                            style={[styles.addButton, { backgroundColor: colors.primary }]}
                            onPress={() => setShowAddDialog(true)}
                        >
                            <IconSymbol name="plus" size={20} color="#FFF" />
                            <ThemedText style={styles.addButtonText}>Ticket hinzufügen</ThemedText>
                        </Pressable>
                    </View>
                ) : (
                    <>
                        {tickets.map(ticket => (
                            <View key={ticket.id} style={[styles.ticketCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                <View style={styles.ticketHeader}>
                                    <IconSymbol name={getIconForType(ticket.type) as any} size={24} color={colors.primary} />
                                    <View style={styles.ticketInfo}>
                                        <ThemedText style={styles.ticketType}>{ticket.type.toUpperCase()}</ThemedText>
                                        {ticket.provider && (
                                            <ThemedText style={[styles.provider, { color: colors.textSecondary }]}>
                                                {ticket.provider}
                                            </ThemedText>
                                        )}
                                    </View>
                                    <View style={styles.actions}>
                                        <Pressable onPress={() => handleEdit(ticket)} style={styles.actionButton}>
                                            <IconSymbol name="pencil" size={18} color={colors.primary} />
                                        </Pressable>
                                        <Pressable onPress={() => handleDelete(ticket)} style={styles.actionButton}>
                                            <IconSymbol name="trash" size={18} color="#FF3B30" />
                                        </Pressable>
                                    </View>
                                </View>

                                <View style={styles.route}>
                                    <ThemedText style={styles.location}>{ticket.departure_location}</ThemedText>
                                    <IconSymbol name="arrow.right" size={16} color={colors.textSecondary} />
                                    <ThemedText style={styles.location}>{ticket.arrival_location}</ThemedText>
                                </View>

                                {ticket.departure_time && (
                                    <ThemedText style={[styles.time, { color: colors.textSecondary }]}>
                                        {new Date(ticket.departure_time).toLocaleString('de-CH', {
                                            day: '2-digit',
                                            month: 'short',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </ThemedText>
                                )}

                                {ticket.booking_reference && (
                                    <ThemedText style={[styles.bookingRef, { color: colors.textSecondary }]}>
                                        Buchung: {ticket.booking_reference}
                                    </ThemedText>
                                )}

                                {ticket.seat_number && (
                                    <ThemedText style={[styles.seat, { color: colors.textSecondary }]}>
                                        Platz: {ticket.seat_number}
                                    </ThemedText>
                                )}

                                {ticket.ticket_file_path && (
                                    <Pressable
                                        style={[styles.fileButton, { backgroundColor: colors.background }]}
                                        onPress={() => handleDownloadFile(ticket)}
                                    >
                                        <IconSymbol name="doc.fill" size={16} color={colors.primary} />
                                        <ThemedText style={[styles.fileButtonText, { color: colors.primary }]}>
                                            Ticket anzeigen
                                        </ThemedText>
                                    </Pressable>
                                )}
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

            <AddTicketDialog
                visible={showAddDialog}
                planId={planId}
                ticket={editingTicket}
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
    ticketCard: {
        padding: Spacing.md,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: Spacing.md,
    },
    ticketHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.sm,
    },
    ticketInfo: {
        flex: 1,
    },
    ticketType: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
    },
    provider: {
        fontSize: 14,
    },
    actions: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    actionButton: {
        padding: Spacing.xs,
    },
    route: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.xs,
    },
    location: {
        fontSize: 15,
        fontWeight: '500',
    },
    time: {
        fontSize: 13,
        marginBottom: Spacing.xs,
    },
    bookingRef: {
        fontSize: 12,
        marginBottom: Spacing.xs,
    },
    seat: {
        fontSize: 12,
        marginBottom: Spacing.xs,
    },
    fileButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        padding: Spacing.sm,
        borderRadius: 6,
        marginTop: Spacing.xs,
        alignSelf: 'flex-start',
    },
    fileButtonText: {
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
