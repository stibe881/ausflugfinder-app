import { useState } from "react";
import { View, Modal, StyleSheet, Pressable, TextInput, ScrollView, Alert } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { DateTimePicker } from "@/components/ui/datetime-picker";

interface AccommodationEditorProps {
    visible: boolean;
    accommodation?: {
        id: string;
        name: string;
        address?: string;
        link?: string;
        check_in_date: string;
        check_out_date: string;
    };
    onSave: (data: {
        name: string;
        address?: string;
        link?: string;
        check_in_date: string;
        check_out_date: string;
    }) => void;
    onClose: () => void;
}

export function AccommodationEditor({ visible, accommodation, onSave, onClose }: AccommodationEditorProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const [name, setName] = useState(accommodation?.name || '');
    const [address, setAddress] = useState(accommodation?.address || '');
    const [link, setLink] = useState(accommodation?.link || '');
    const [checkInDate, setCheckInDate] = useState(accommodation?.check_in_date || new Date().toISOString().split('T')[0]);
    const [checkOutDate, setCheckOutDate] = useState(accommodation?.check_out_date || new Date().toISOString().split('T')[0]);

    const handleSave = () => {
        if (!name.trim()) {
            Alert.alert("Fehler", "Bitte gib einen Namen ein");
            return;
        }

        if (new Date(checkOutDate) <= new Date(checkInDate)) {
            Alert.alert("Fehler", "Check-out muss nach Check-in sein");
            return;
        }

        onSave({
            name: name.trim(),
            address: address.trim() || undefined,
            link: link.trim() || undefined,
            check_in_date: checkInDate,
            check_out_date: checkOutDate
        });
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
                {/* Header */}
                <View style={[styles.header, { borderBottomColor: colors.border }]}>
                    <Pressable onPress={onClose} style={styles.closeButton}>
                        <IconSymbol name="xmark" size={24} color={colors.text} />
                    </Pressable>
                    <ThemedText style={styles.title}>
                        {accommodation ? 'Unterkunft bearbeiten' : 'Unterkunft hinzufügen'}
                    </ThemedText>
                    <Pressable onPress={handleSave} style={styles.saveButton}>
                        <ThemedText style={[styles.saveText, { color: colors.primary }]}>
                            Speichern
                        </ThemedText>
                    </Pressable>
                </View>

                {/* Form */}
                <ScrollView style={styles.form} contentContainerStyle={styles.formContent}>
                    {/* Name */}
                    <View style={styles.field}>
                        <ThemedText style={styles.label}>Name *</ThemedText>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                            value={name}
                            onChangeText={setName}
                            placeholder="z.B. Hotel Alpenblick"
                            placeholderTextColor={colors.textSecondary}
                        />
                    </View>

                    {/* Address */}
                    <View style={styles.field}>
                        <ThemedText style={styles.label}>Adresse</ThemedText>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                            value={address}
                            onChangeText={setAddress}
                            placeholder="Bergstrasse 123, 9000 St. Gallen"
                            placeholderTextColor={colors.textSecondary}
                            multiline
                        />
                    </View>

                    {/* Link */}
                    <View style={styles.field}>
                        <ThemedText style={styles.label}>Link</ThemedText>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                            value={link}
                            onChangeText={setLink}
                            placeholder="https://booking.com/..."
                            placeholderTextColor={colors.textSecondary}
                            keyboardType="url"
                            autoCapitalize="none"
                        />
                    </View>

                    {/* Check-in Date */}
                    <View style={styles.field}>
                        <ThemedText style={styles.label}>Check-in *</ThemedText>
                        <DateTimePicker
                            value={new Date(checkInDate)}
                            mode="date"
                            onChange={(date) => setCheckInDate(date.toISOString().split('T')[0])}
                        />
                    </View>

                    {/* Check-out Date */}
                    <View style={styles.field}>
                        <ThemedText style={styles.label}>Check-out *</ThemedText>
                        <DateTimePicker
                            value={new Date(checkOutDate)}
                            mode="date"
                            onChange={(date) => setCheckOutDate(date.toISOString().split('T')[0])}
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
    closeButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
    },
    saveButton: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
    },
    saveText: {
        fontSize: 16,
        fontWeight: '600',
    },
    form: {
        flex: 1,
    },
    formContent: {
        padding: Spacing.lg,
        gap: Spacing.lg,
    },
    field: {
        gap: Spacing.xs,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
    },
    input: {
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        fontSize: 16,
    },
});
