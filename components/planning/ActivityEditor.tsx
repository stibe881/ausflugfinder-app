import React, { useState } from 'react';
import {
    View,
    Modal,
    StyleSheet,
    Pressable,
    TextInput,
    ScrollView,
    FlatList,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { TripActivity } from '@/lib/planning-api';

interface ActivityEditorProps {
    visible: boolean;
    planTripId: string;
    activities: TripActivity[];
    onAddActivity: (activity: Omit<TripActivity, 'id' | 'plan_trip_id' | 'created_at' | 'updated_at' | 'sequence'>) => void;
    onUpdateActivity: (activityId: string, updates: Partial<TripActivity>) => void;
    onDeleteActivity: (activityId: string) => void;
    onClose: () => void;
}

const ACTIVITY_CATEGORIES = [
    { value: 'activity', label: 'Aktivität', icon: 'star.fill' },
    { value: 'meal', label: 'Essen', icon: 'fork.knife' },
    { value: 'transport', label: 'Transport', icon: 'car.fill' },
    { value: 'break', label: 'Pause', icon: 'pause.fill' },
] as const;

export function ActivityEditor({
    visible,
    planTripId,
    activities,
    onAddActivity,
    onUpdateActivity,
    onDeleteActivity,
    onClose,
}: ActivityEditorProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [startTime, setStartTime] = useState(new Date());
    const [endTime, setEndTime] = useState(new Date());
    const [location, setLocation] = useState('');
    const [category, setCategory] = useState<'activity' | 'meal' | 'transport' | 'break'>('activity');

    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    const resetForm = () => {
        setName('');
        setDescription('');
        setStartTime(new Date());
        setEndTime(new Date());
        setLocation('');
        setCategory('activity');
        setIsAdding(false);
        setEditingId(null);
    };

    const handleStartEdit = (activity: TripActivity) => {
        setEditingId(activity.id);
        setName(activity.name);
        setDescription(activity.description || '');
        setStartTime(new Date(activity.start_time));
        setEndTime(new Date(activity.end_time));
        setLocation(activity.location || '');
        setCategory(activity.category);
        setIsAdding(true);
    };

    const handleSave = () => {
        if (!name.trim()) return;

        const activityData = {
            name: name.trim(),
            description: description.trim() || undefined,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            location: location.trim() || undefined,
            category,
        };

        if (editingId) {
            onUpdateActivity(editingId, activityData);
        } else {
            onAddActivity(activityData);
        }

        resetForm();
    };

    const handleDelete = (activityId: string) => {
        onDeleteActivity(activityId);
        if (editingId === activityId) {
            resetForm();
        }
    };

    const formatTime = (date: Date | string) => {
        const d = typeof date === 'string' ? new Date(date) : date;
        return d.toLocaleTimeString('de-CH', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getCategoryIcon = (cat: string) => {
        return ACTIVITY_CATEGORIES.find(c => c.value === cat)?.icon || 'star.fill';
    };

    const getCategoryLabel = (cat: string) => {
        return ACTIVITY_CATEGORIES.find(c => c.value === cat)?.label || cat;
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
                        <ThemedText style={styles.title}>Aktivitäten</ThemedText>
                        <Pressable onPress={onClose} style={styles.closeButton}>
                            <IconSymbol name="xmark" size={24} color={colors.text} />
                        </Pressable>
                    </View>

                    {!isAdding ? (
                        <>
                            {/* Activity List */}
                            <FlatList
                                data={activities}
                                keyExtractor={(item) => item.id}
                                style={{ flex: 1 }}
                                contentContainerStyle={{ paddingBottom: Spacing.md }}
                                ListEmptyComponent={
                                    <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
                                        Noch keine Aktivitäten
                                    </ThemedText>
                                }
                                renderItem={({ item }) => (
                                    <View style={[styles.activityCard, { backgroundColor: colors.card }]}>
                                        <View style={styles.activityContent}>
                                            <View style={styles.activityHeader}>
                                                <IconSymbol
                                                    name={getCategoryIcon(item.category)}
                                                    size={20}
                                                    color={colors.tint}
                                                />
                                                <View style={{ flex: 1 }}>
                                                    <ThemedText style={styles.activityName}>{item.name}</ThemedText>
                                                    <ThemedText style={[styles.activityTime, { color: colors.textSecondary }]}>
                                                        {formatTime(item.start_time)} - {formatTime(item.end_time)} · {getCategoryLabel(item.category)}
                                                    </ThemedText>
                                                </View>
                                            </View>
                                            {item.description && (
                                                <ThemedText style={[styles.activityDescription, { color: colors.textSecondary }]}>
                                                    {item.description}
                                                </ThemedText>
                                            )}
                                            {item.location && (
                                                <ThemedText style={[styles.activityLocation, { color: colors.textSecondary }]}>
                                                    📍 {item.location}
                                                </ThemedText>
                                            )}
                                        </View>
                                        <View style={styles.activityActions}>
                                            <Pressable onPress={() => handleStartEdit(item)} style={styles.iconButton}>
                                                <IconSymbol name="pencil" size={18} color={colors.tint} />
                                            </Pressable>
                                            <Pressable onPress={() => handleDelete(item.id)} style={styles.iconButton}>
                                                <IconSymbol name="trash" size={18} color="#FF3B30" />
                                            </Pressable>
                                        </View>
                                    </View>
                                )}
                            />

                            {/* Add Button */}
                            <Pressable
                                style={[styles.addButton, { backgroundColor: colors.tint }]}
                                onPress={() => setIsAdding(true)}
                            >
                                <IconSymbol name="plus" size={20} color="#FFFFFF" />
                                <ThemedText style={[styles.addButtonText, { color: '#FFFFFF' }]}>
                                    Aktivität hinzufügen
                                </ThemedText>
                            </Pressable>
                        </>
                    ) : (
                        <ScrollView style={styles.form}>
                            {/* Name */}
                            <View style={styles.formSection}>
                                <ThemedText style={styles.label}>Name *</ThemedText>
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                                    value={name}
                                    onChangeText={setName}
                                    placeholder="z.B. Mittagessen, Wanderung..."
                                    placeholderTextColor={colors.textSecondary}
                                />
                            </View>

                            {/* Category */}
                            <View style={styles.formSection}>
                                <ThemedText style={styles.label}>Kategorie</ThemedText>
                                <View style={styles.categoryButtons}>
                                    {ACTIVITY_CATEGORIES.map((cat) => (
                                        <Pressable
                                            key={cat.value}
                                            style={[
                                                styles.categoryButton,
                                                {
                                                    backgroundColor: category === cat.value ? colors.tint : colors.card,
                                                },
                                            ]}
                                            onPress={() => setCategory(cat.value)}
                                        >
                                            <IconSymbol
                                                name={cat.icon}
                                                size={16}
                                                color={category === cat.value ? '#FFFFFF' : colors.text}
                                            />
                                            <ThemedText
                                                style={[
                                                    styles.categoryLabel,
                                                    { color: category === cat.value ? '#FFFFFF' : colors.text },
                                                ]}
                                            >
                                                {cat.label}
                                            </ThemedText>
                                        </Pressable>
                                    ))}
                                </View>
                            </View>

                            {/* Times */}
                            <View style={styles.timeRow}>
                                <View style={[styles.formSection, { flex: 1 }]}>
                                    <ThemedText style={styles.label}>Start</ThemedText>
                                    <Pressable
                                        style={[styles.timeButton, { backgroundColor: colors.card }]}
                                        onPress={() => setShowStartPicker(true)}
                                    >
                                        <ThemedText>{formatTime(startTime)}</ThemedText>
                                    </Pressable>
                                </View>
                                <View style={[styles.formSection, { flex: 1 }]}>
                                    <ThemedText style={styles.label}>Ende</ThemedText>
                                    <Pressable
                                        style={[styles.timeButton, { backgroundColor: colors.card }]}
                                        onPress={() => setShowEndPicker(true)}
                                    >
                                        <ThemedText>{formatTime(endTime)}</ThemedText>
                                    </Pressable>
                                </View>
                            </View>

                            {/* Location */}
                            <View style={styles.formSection}>
                                <ThemedText style={styles.label}>Ort (optional)</ThemedText>
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                                    value={location}
                                    onChangeText={setLocation}
                                    placeholder="Genauer Ort..."
                                    placeholderTextColor={colors.textSecondary}
                                />
                            </View>

                            {/* Description */}
                            <View style={styles.formSection}>
                                <ThemedText style={styles.label}>Beschreibung (optional)</ThemedText>
                                <TextInput
                                    style={[styles.textArea, { backgroundColor: colors.card, color: colors.text }]}
                                    value={description}
                                    onChangeText={setDescription}
                                    multiline
                                    numberOfLines={3}
                                    placeholder="Details..."
                                    placeholderTextColor={colors.textSecondary}
                                />
                            </View>

                            {/* Buttons */}
                            <View style={styles.buttons}>
                                <Pressable
                                    style={[styles.button, styles.cancelButton, { backgroundColor: colors.card }]}
                                    onPress={resetForm}
                                >
                                    <ThemedText>Abbrechen</ThemedText>
                                </Pressable>
                                <Pressable
                                    style={[styles.button, styles.saveButton, { backgroundColor: colors.tint }]}
                                    onPress={handleSave}
                                    disabled={!name.trim()}
                                >
                                    <ThemedText style={{ color: '#FFFFFF' }}>
                                        {editingId ? 'Aktualisieren' : 'Hinzufügen'}
                                    </ThemedText>
                                </Pressable>
                            </View>
                        </ScrollView>
                    )}

                    {/* Time Pickers */}
                    {showStartPicker && (
                        <DateTimePicker
                            value={startTime}
                            mode="time"
                            is24Hour={true}
                            onChange={(event, date) => {
                                setShowStartPicker(false);
                                if (date) setStartTime(date);
                            }}
                        />
                    )}
                    {showEndPicker && (
                        <DateTimePicker
                            value={endTime}
                            mode="time"
                            is24Hour={true}
                            onChange={(event, date) => {
                                setShowEndPicker(false);
                                if (date) setEndTime(date);
                            }}
                        />
                    )}
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
        maxHeight: '90%',
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
    emptyText: {
        textAlign: 'center',
        marginTop: Spacing.xl,
        fontSize: 14,
    },
    activityCard: {
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        marginBottom: Spacing.sm,
        flexDirection: 'row',
        gap: Spacing.md,
    },
    activityContent: {
        flex: 1,
        gap: Spacing.xs,
    },
    activityHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.sm,
    },
    activityName: {
        fontSize: 15,
        fontWeight: '600',
    },
    activityTime: {
        fontSize: 13,
        marginTop: 2,
    },
    activityDescription: {
        fontSize: 13,
        marginTop: 4,
    },
    activityLocation: {
        fontSize: 13,
        marginTop: 2,
    },
    activityActions: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    iconButton: {
        padding: Spacing.xs,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        gap: Spacing.sm,
        marginTop: Spacing.sm,
    },
    addButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    form: {
        flex: 1,
    },
    formSection: {
        marginBottom: Spacing.md,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: Spacing.sm,
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
        minHeight: 80,
        textAlignVertical: 'top',
    },
    categoryButtons: {
        flexDirection: 'row',
        gap: Spacing.sm,
        flexWrap: 'wrap',
    },
    categoryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.md,
    },
    categoryLabel: {
        fontSize: 14,
        fontWeight: '500',
    },
    timeRow: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    timeButton: {
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
    },
    buttons: {
        flexDirection: 'row',
        gap: Spacing.md,
        marginTop: Spacing.md,
    },
    button: {
        flex: 1,
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
    },
    cancelButton: {},
    saveButton: {},
});

