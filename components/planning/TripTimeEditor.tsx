import React, { useState } from 'react';
import {
    View,
    Modal,
    StyleSheet,
    Pressable,
    Platform,
    TextInput,
    ScrollView,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface TripTimeEditorProps {
    visible: boolean;
    tripId: string;
    currentTimes?: {
        departure_time?: string;
        arrival_time?: string;
        notes?: string;
        buffer_time_minutes?: number;
    };
    onSave: (times: {
        departure_time?: string;
        arrival_time?: string;
        notes?: string;
        buffer_time_minutes?: number;
    }) => void;
    onClose: () => void;
}

export function TripTimeEditor({
    visible,
    tripId,
    currentTimes,
    onSave,
    onClose,
}: TripTimeEditorProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const [departureTime, setDepartureTime] = useState<Date>(
        currentTimes?.departure_time ? new Date(currentTimes.departure_time) : new Date()
    );
    const [arrivalTime, setArrivalTime] = useState<Date>(
        currentTimes?.arrival_time ? new Date(currentTimes.arrival_time) : new Date()
    );
    const [notes, setNotes] = useState(currentTimes?.notes || '');
    const [bufferMinutes, setBufferMinutes] = useState(
        currentTimes?.buffer_time_minutes?.toString() || '0'
    );

    const [showDeparturePicker, setShowDeparturePicker] = useState(false);
    const [showArrivalPicker, setShowArrivalPicker] = useState(false);

    const handleDepartureChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        setShowDeparturePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setDepartureTime(selectedDate);
        }
    };

    const handleArrivalChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        setShowArrivalPicker(Platform.OS === 'ios');
        if (selectedDate) {
            setArrivalTime(selectedDate);
        }
    };

    const handleSave = () => {
        onSave({
            departure_time: departureTime.toISOString(),
            arrival_time: arrivalTime.toISOString(),
            notes: notes.trim() || undefined,
            buffer_time_minutes: parseInt(bufferMinutes) || 0,
        });
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('de-CH', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.content, { backgroundColor: colors.background }]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <ThemedText style={styles.title}>Zeiten bearbeiten</ThemedText>
                        <Pressable onPress={onClose} style={styles.closeButton}>
                            <IconSymbol name="xmark" size={24} color={colors.text} />
                        </Pressable>
                    </View>

                    <ScrollView style={styles.scrollView}>
                        {/* Departure Time */}
                        <View style={styles.section}>
                            <ThemedText style={styles.label}>Abfahrtszeit</ThemedText>
                            <Pressable
                                style={[styles.timeButton, { backgroundColor: colors.card }]}
                                onPress={() => setShowDeparturePicker(true)}
                            >
                                <IconSymbol name="clock" size={20} color={colors.text} />
                                <ThemedText style={styles.timeText}>{formatTime(departureTime)}</ThemedText>
                            </Pressable>
                            {showDeparturePicker && (
                                <DateTimePicker
                                    value={departureTime}
                                    mode="time"
                                    is24Hour={true}
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={handleDepartureChange}
                                />
                            )}
                        </View>

                        {/* Arrival Time */}
                        <View style={styles.section}>
                            <ThemedText style={styles.label}>Ankunftszeit</ThemedText>
                            <Pressable
                                style={[styles.timeButton, { backgroundColor: colors.card }]}
                                onPress={() => setShowArrivalPicker(true)}
                            >
                                <IconSymbol name="clock" size={20} color={colors.text} />
                                <ThemedText style={styles.timeText}>{formatTime(arrivalTime)}</ThemedText>
                            </Pressable>
                            {showArrivalPicker && (
                                <DateTimePicker
                                    value={arrivalTime}
                                    mode="time"
                                    is24Hour={true}
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={handleArrivalChange}
                                />
                            )}
                        </View>

                        {/* Buffer Time */}
                        <View style={styles.section}>
                            <ThemedText style={styles.label}>Pufferzeit (Minuten)</ThemedText>
                            <TextInput
                                style={[
                                    styles.input,
                                    { backgroundColor: colors.card, color: colors.text },
                                ]}
                                value={bufferMinutes}
                                onChangeText={setBufferMinutes}
                                keyboardType="number-pad"
                                placeholder="0"
                                placeholderTextColor={colors.textSecondary}
                            />
                        </View>

                        {/* Notes */}
                        <View style={styles.section}>
                            <ThemedText style={styles.label}>Notizen (optional)</ThemedText>
                            <TextInput
                                style={[
                                    styles.textArea,
                                    { backgroundColor: colors.card, color: colors.text },
                                ]}
                                value={notes}
                                onChangeText={setNotes}
                                multiline
                                numberOfLines={4}
                                placeholder="z.B. Treffpunkt, Parkplatz..."
                                placeholderTextColor={colors.textSecondary}
                            />
                        </View>
                    </ScrollView>

                    {/* Buttons */}
                    <View style={styles.buttons}>
                        <Pressable
                            style={[styles.button, styles.cancelButton, { backgroundColor: colors.card }]}
                            onPress={onClose}
                        >
                            <ThemedText style={styles.buttonText}>Abbrechen</ThemedText>
                        </Pressable>
                        <Pressable
                            style={[styles.button, styles.saveButton, { backgroundColor: colors.tint }]}
                            onPress={handleSave}
                        >
                            <ThemedText style={[styles.buttonText, { color: '#FFFFFF' }]}>
                                Speichern
                            </ThemedText>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    content: {
        borderTopLeftRadius: BorderRadius.xl,
        borderTopRightRadius: BorderRadius.xl,
        padding: Spacing.lg,
        maxHeight: '80%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Spacing.lg,
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
    },
    closeButton: {
        padding: Spacing.xs,
    },
    scrollView: {
        marginBottom: Spacing.lg,
    },
    section: {
        marginBottom: Spacing.lg,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: Spacing.sm,
    },
    timeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
    },
    timeText: {
        fontSize: 16,
    },
    input: {
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        fontSize: 16,
    },
    textArea: {
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        fontSize: 16,
        minHeight: 100,
        textAlignVertical: 'top',
    },
    buttons: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    button: {
        flex: 1,
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
    },
    cancelButton: {},
    saveButton: {},
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});

