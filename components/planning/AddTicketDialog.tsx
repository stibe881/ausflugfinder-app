import React, { useState } from 'react';
import { Modal, View, ScrollView, StyleSheet, Pressable, TextInput, Alert, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { FilePickerButton } from './FilePickerButton';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { addTicket, updateTicket, type Ticket, type TicketType } from '@/lib/planning-api';
import { uploadFile } from '@/lib/storage';

interface AddTicketDialogProps {
    visible: boolean;
    planId: string;
    ticket?: Ticket; // For edit mode
    onClose: () => void;
    onSaved: () => void;
}

const TICKET_TYPES: { value: TicketType; label: string; icon: string }[] = [
    { value: 'flight', label: 'Flug', icon: 'airplane' },
    { value: 'train', label: 'Zug', icon: 'tram' },
    { value: 'bus', label: 'Bus', icon: 'bus' },
    { value: 'ferry', label: 'Fähre', icon: 'ferry' },
    { value: 'other', label: 'Sonstiges', icon: 'ticket' },
];

export function AddTicketDialog({ visible, planId, ticket, onClose, onSaved }: AddTicketDialogProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const isEdit = !!ticket;

    const [type, setType] = useState<TicketType>(ticket?.type || 'flight');
    const [provider, setProvider] = useState(ticket?.provider || '');
    const [bookingRef, setBookingRef] = useState(ticket?.booking_reference || '');
    const [departure, setDeparture] = useState(ticket?.departure_location || '');
    const [arrival, setArrival] = useState(ticket?.arrival_location || '');
    const [departureTime, setDepartureTime] = useState(ticket?.departure_time ? new Date(ticket.departure_time) : new Date());
    const [arrivalTime, setArrivalTime] = useState(ticket?.arrival_time ? new Date(ticket.arrival_time) : new Date());
    const [showDepartureTime, setShowDepartureTime] = useState(false);
    const [showArrivalTime, setShowArrivalTime] = useState(false);
    const [seatNumber, setSeatNumber] = useState(ticket?.seat_number || '');
    const [notes, setNotes] = useState(ticket?.notes || '');
    const [file, setFile] = useState<{ uri: string; name: string; type?: string } | null>(null);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!departure.trim() || !arrival.trim()) {
            Alert.alert('Fehler', 'Bitte Abfahrts- und Ankunftsort eingeben');
            return;
        }

        setSaving(true);

        try {
            let filePath = ticket?.ticket_file_path;

            // Upload file if selected
            if (file) {
                const uploadResult = await uploadFile(planId, file, 'ticket', ticket?.id || 'temp');
                if (uploadResult.success && uploadResult.filePath) {
                    filePath = uploadResult.filePath;
                }
            }

            const ticketData = {
                plan_id: planId,
                type,
                provider: provider.trim() || undefined,
                booking_reference: bookingRef.trim() || undefined,
                departure_location: departure.trim(),
                arrival_location: arrival.trim(),
                departure_time: departureTime.toISOString(),
                arrival_time: arrivalTime.toISOString(),
                seat_number: seatNumber.trim() || undefined,
                ticket_file_path: filePath,
                notes: notes.trim() || undefined,
            };

            if (isEdit && ticket) {
                await updateTicket(ticket.id, ticketData);
            } else {
                await addTicket(ticketData);
            }

            onSaved();
            onClose();
        } catch (error) {
            Alert.alert('Fehler', 'Ticket konnte nicht gespeichert werden');
            console.error('Save ticket error:', error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <ThemedView style={styles.container}>
                {/* Header */}
                <View style={[styles.header, { borderBottomColor: colors.border }]}>
                    <Pressable onPress={onClose} style={styles.headerButton}>
                        <ThemedText style={styles.cancelText}>Abbrechen</ThemedText>
                    </Pressable>
                    <ThemedText style={styles.title}>
                        {isEdit ? 'Ticket bearbeiten' : 'Ticket hinzufügen'}
                    </ThemedText>
                    <Pressable onPress={handleSave} disabled={saving} style={styles.headerButton}>
                        <ThemedText style={[styles.saveText, { color: colors.primary }]}>
                            {saving ? 'Wird gespeichert...' : 'Speichern'}
                        </ThemedText>
                    </Pressable>
                </View>

                <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                    {/* Type Selection */}
                    <View style={styles.section}>
                        <ThemedText style={styles.label}>Transportmittel</ThemedText>
                        <View style={styles.typeRow}>
                            {TICKET_TYPES.map(t => (
                                <Pressable
                                    key={t.value}
                                    style={[
                                        styles.typeButton,
                                        { backgroundColor: colors.surface, borderColor: colors.border },
                                        type === t.value && { backgroundColor: colors.primary, borderColor: colors.primary }
                                    ]}
                                    onPress={() => setType(t.value)}
                                >
                                    <IconSymbol
                                        name={t.icon as any}
                                        size={20}
                                        color={type === t.value ? '#FFF' : colors.text}
                                    />
                                    <ThemedText style={[styles.typeLabel, type === t.value && { color: '#FFF' }]}>
                                        {t.label}
                                    </ThemedText>
                                </Pressable>
                            ))}
                        </View>
                    </View>

                    {/* Provider */}
                    <View style={styles.section}>
                        <ThemedText style={styles.label}>Anbieter (optional)</ThemedText>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                            value={provider}
                            onChangeText={setProvider}
                            placeholder="z.B. Swiss, SBB, FlixBus"
                            placeholderTextColor={colors.textSecondary}
                        />
                    </View>

                    {/* Booking Reference */}
                    <View style={styles.section}>
                        <ThemedText style={styles.label}>Buchungsnummer (optional)</ThemedText>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                            value={bookingRef}
                            onChangeText={setBookingRef}
                            placeholder="ABC123"
                            placeholderTextColor={colors.textSecondary}
                        />
                    </View>

                    {/* Locations */}
                    <View style={styles.section}>
                        <ThemedText style={styles.label}>Abfahrtsort *</ThemedText>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                            value={departure}
                            onChangeText={setDeparture}
                            placeholder="Zürich HB"
                            placeholderTextColor={colors.textSecondary}
                        />
                    </View>

                    <View style={styles.section}>
                        <ThemedText style={styles.label}>Ankunftsort *</ThemedText>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                            value={arrival}
                            onChangeText={setArrival}
                            placeholder="Bern"
                            placeholderTextColor={colors.textSecondary}
                        />
                    </View>

                    {/* Times */}
                    <View style={styles.section}>
                        <ThemedText style={styles.label}>Abfahrtszeit</ThemedText>
                        <Pressable
                            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border }]}
                            onPress={() => setShowDepartureTime(true)}
                        >
                            <ThemedText>{departureTime.toLocaleString('de-CH')}</ThemedText>
                        </Pressable>
                        {showDepartureTime && (
                            <DateTimePicker
                                value={departureTime}
                                mode="datetime"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={(event, date) => {
                                    setShowDepartureTime(Platform.OS === 'ios');
                                    if (date) setDepartureTime(date);
                                }}
                            />
                        )}
                    </View>

                    <View style={styles.section}>
                        <ThemedText style={styles.label}>Ankunftszeit</ThemedText>
                        <Pressable
                            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border }]}
                            onPress={() => setShowArrivalTime(true)}
                        >
                            <ThemedText>{arrivalTime.toLocaleString('de-CH')}</ThemedText>
                        </Pressable>
                        {showArrivalTime && (
                            <DateTimePicker
                                value={arrivalTime}
                                mode="datetime"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={(event, date) => {
                                    setShowArrivalTime(Platform.OS === 'ios');
                                    if (date) setArrivalTime(date);
                                }}
                            />
                        )}
                    </View>

                    {/* Seat */}
                    <View style={styles.section}>
                        <ThemedText style={styles.label}>Sitzplatznummer (optional)</ThemedText>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                            value={seatNumber}
                            onChangeText={setSeatNumber}
                            placeholder="12A"
                            placeholderTextColor={colors.textSecondary}
                        />
                    </View>

                    {/* File Upload */}
                    <View style={styles.section}>
                        <ThemedText style={styles.label}>Ticket (PDF/Bild)</ThemedText>
                        <FilePickerButton
                            onFilePicked={setFile}
                            currentFile={file?.name || ticket?.ticket_file_path}
                        />
                    </View>

                    {/* Notes */}
                    <View style={styles.section}>
                        <ThemedText style={styles.label}>Notizen (optional)</ThemedText>
                        <TextInput
                            style={[styles.textArea, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                            value={notes}
                            onChangeText={setNotes}
                            placeholder="Zusätzliche Informationen..."
                            placeholderTextColor={colors.textSecondary}
                            multiline
                            numberOfLines={4}
                        />
                    </View>
                </ScrollView>
            </ThemedView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
    },
    headerButton: {
        minWidth: 80,
    },
    cancelText: {
        fontSize: 16,
    },
    title: {
        fontSize: 17,
        fontWeight: '600',
    },
    saveText: {
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'right',
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: Spacing.md,
    },
    section: {
        marginBottom: Spacing.lg,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: Spacing.xs,
    },
    typeRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
    },
    typeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.sm,
        borderWidth: 1,
    },
    typeLabel: {
        fontSize: 14,
        fontWeight: '500',
    },
    input: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.sm,
        borderWidth: 1,
        fontSize: 15,
    },
    textArea: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.sm,
        borderWidth: 1,
        fontSize: 15,
        minHeight: 100,
        textAlignVertical: 'top',
    },
});
