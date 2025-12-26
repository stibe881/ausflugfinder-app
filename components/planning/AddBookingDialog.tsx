import React, { useState } from 'react';
import { Modal, View, ScrollView, StyleSheet, Pressable, TextInput, Alert, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { FilePickerButton } from './FilePickerButton';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { addBooking, updateBooking, type Booking, type BookingType } from '@/lib/planning-api';
import { uploadFile } from '@/lib/storage';

interface AddBookingDialogProps {
    visible: boolean;
    planId: string;
    booking?: Booking; // For edit mode
    onClose: () => void;
    onSaved: () => void;
}

const BOOKING_TYPES: { value: BookingType; label: string; icon: string }[] = [
    { value: 'accommodation', label: 'Unterkunft', icon: 'house' },
    { value: 'activity', label: 'Aktivität', icon: 'sportscourt' },
    { value: 'restaurant', label: 'Restaurant', icon: 'fork.knife' },
    { value: 'event', label: 'Event', icon: 'calendar.badge.clock' },
    { value: 'other', label: 'Sonstiges', icon: 'bookmark' },
];

export function AddBookingDialog({ visible, planId, booking, onClose, onSaved }: AddBookingDialogProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const isEdit = !!booking;

    const [type, setType] = useState<BookingType>(booking?.type || 'accommodation');
    const [name, setName] = useState(booking?.name || '');
    const [bookingRef, setBookingRef] = useState(booking?.booking_reference || '');
    const [date, setDate] = useState(booking?.date ? new Date(booking.date) : new Date());
    const [time, setTime] = useState(booking?.time || '');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [location, setLocation] = useState(booking?.location || '');
    const [address, setAddress] = useState(booking?.address || '');
    const [cost, setCost] = useState(booking?.cost?.toString() || '');
    const [confirmationUrl, setConfirmationUrl] = useState(booking?.confirmation_url || '');
    const [notes, setNotes] = useState(booking?.notes || '');
    const [file, setFile] = useState<{ uri: string; name: string; type?: string } | null>(null);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Fehler', 'Bitte Namen eingeben');
            return;
        }

        setSaving(true);

        try {
            let filePath = booking?.confirmation_file_path;

            // Upload file if selected
            if (file) {
                const uploadResult = await uploadFile(planId, file, 'booking', booking?.id || 'temp');
                if (uploadResult.success && uploadResult.filePath) {
                    filePath = uploadResult.filePath;
                }
            }

            const bookingData = {
                plan_id: planId,
                type,
                name: name.trim(),
                booking_reference: bookingRef.trim() || undefined,
                date: date.toISOString().split('T')[0], // YYYY-MM-DD
                time: time.trim() || undefined,
                location: location.trim() || undefined,
                address: address.trim() || undefined,
                cost: cost ? parseFloat(cost) : undefined,
                confirmation_file_path: filePath,
                confirmation_url: confirmationUrl.trim() || undefined,
                notes: notes.trim() || undefined,
            };

            if (isEdit && booking) {
                await updateBooking(booking.id, bookingData);
            } else {
                await addBooking(bookingData);
            }

            onSaved();
            onClose();
        } catch (error) {
            Alert.alert('Fehler', 'Buchung konnte nicht gespeichert werden');
            console.error('Save booking error:', error);
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
                        {isEdit ? 'Buchung bearbeiten' : 'Buchung hinzufügen'}
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
                        <ThemedText style={styles.label}>Typ</ThemedText>
                        <View style={styles.typeRow}>
                            {BOOKING_TYPES.map(t => (
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

                    {/* Name */}
                    <View style={styles.section}>
                        <ThemedText style={styles.label}>Name *</ThemedText>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                            value={name}
                            onChangeText={setName}
                            placeholder="z.B. Hotel Bellevue, Paragliding, Ristorante Italia"
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

                    {/* Date */}
                    <View style={styles.section}>
                        <ThemedText style={styles.label}>Datum</ThemedText>
                        <Pressable
                            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border }]}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <ThemedText>{date.toLocaleDateString('de-CH')}</ThemedText>
                        </Pressable>
                        {showDatePicker && (
                            <DateTimePicker
                                value={date}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={(event, selectedDate) => {
                                    setShowDatePicker(Platform.OS === 'ios');
                                    if (selectedDate) setDate(selectedDate);
                                }}
                            />
                        )}
                    </View>

                    {/* Time */}
                    <View style={styles.section}>
                        <ThemedText style={styles.label}>Uhrzeit (optional)</ThemedText>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                            value={time}
                            onChangeText={setTime}
                            placeholder="14:30"
                            placeholderTextColor={colors.textSecondary}
                        />
                    </View>

                    {/* Location */}
                    <View style={styles.section}>
                        <ThemedText style={styles.label}>Ort (optional)</ThemedText>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                            value={location}
                            onChangeText={setLocation}
                            placeholder="Interlaken"
                            placeholderTextColor={colors.textSecondary}
                        />
                    </View>

                    {/* Address */}
                    <View style={styles.section}>
                        <ThemedText style={styles.label}>Adresse (optional)</ThemedText>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                            value={address}
                            onChangeText={setAddress}
                            placeholder="Hauptstrasse 123, 3800 Interlaken"
                            placeholderTextColor={colors.textSecondary}
                        />
                    </View>

                    {/* Cost */}
                    <View style={styles.section}>
                        <ThemedText style={styles.label}>Kosten (CHF, optional)</ThemedText>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                            value={cost}
                            onChangeText={setCost}
                            placeholder="150.00"
                            keyboardType="decimal-pad"
                            placeholderTextColor={colors.textSecondary}
                        />
                    </View>

                    {/* File Upload */}
                    <View style={styles.section}>
                        <ThemedText style={styles.label}>Bestätigung (PDF/Bild)</ThemedText>
                        <FilePickerButton
                            onFilePicked={setFile}
                            currentFile={file?.name || booking?.confirmation_file_path}
                        />
                    </View>

                    {/* Confirmation URL */}
                    <View style={styles.section}>
                        <ThemedText style={styles.label}>Bestätigungs-Link (optional)</ThemedText>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                            value={confirmationUrl}
                            onChangeText={setConfirmationUrl}
                            placeholder="https://..."
                            placeholderTextColor={colors.textSecondary}
                            keyboardType="url"
                            autoCapitalize="none"
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
