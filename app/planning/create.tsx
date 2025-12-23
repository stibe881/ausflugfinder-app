import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import {
    View,
    ScrollView,
    TextInput,
    Pressable,
    StyleSheet,
    Alert,
    ActivityIndicator,
    Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { createPlan } from "@/lib/planning-api";
import { getAllAusfluege, type Ausflug } from "@/lib/supabase-api";

interface TripSelection {
    id: string;
    trip_id?: number;
    custom_location?: string;
    planned_date: Date;
    trip?: Ausflug;
}

export default function CreatePlanScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? "light"];

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [trips, setTrips] = useState<TripSelection[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [availableTrips, setAvailableTrips] = useState<Ausflug[]>([]);
    const [showTripPicker, setShowTripPicker] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState<string | null>(null);

    useEffect(() => {
        loadAvailableTrips();
    }, []);

    const loadAvailableTrips = async () => {
        const data = await getAllAusfluege();
        setAvailableTrips(data);
    };

    const addTrip = () => {
        const newTrip: TripSelection = {
            id: Math.random().toString(),
            planned_date: new Date(),
        };
        setTrips([...trips, newTrip]);
    };

    const addTripFromDatabase = (ausflug: Ausflug) => {
        const newTrip: TripSelection = {
            id: Math.random().toString(),
            trip_id: ausflug.id,
            trip: ausflug,
            planned_date: new Date(),
        };
        setTrips([...trips, newTrip]);
        setShowTripPicker(false);
    };

    const addCustomTrip = () => {
        Alert.prompt(
            "Eigener Ort",
            "Gib einen Ortsnamen ein:",
            [
                { text: "Abbrechen", style: "cancel" },
                {
                    text: "Hinzufügen",
                    onPress: (customLocation) => {
                        if (customLocation && customLocation.trim()) {
                            const newTrip: TripSelection = {
                                id: Math.random().toString(),
                                custom_location: customLocation.trim(),
                                planned_date: new Date(),
                            };
                            setTrips([...trips, newTrip]);
                        }
                    },
                },
            ],
            "plain-text"
        );
    };

    const removeTrip = (id: string) => {
        setTrips(trips.filter((t) => t.id !== id));
    };

    const updateTripDate = (id: string, date: Date) => {
        setTrips(
            trips.map((t) => (t.id === id ? { ...t, planned_date: date } : t))
        );
        setShowDatePicker(null);
    };

    const handleCreate = async () => {
        if (!title.trim()) {
            Alert.alert("Fehler", "Bitte gib einen Titel ein");
            return;
        }

        if (trips.length === 0) {
            Alert.alert("Fehler", "Bitte füge mindestens einen Ausflug hinzu");
            return;
        }

        setIsLoading(true);
        const result = await createPlan({
            title: title.trim(),
            description: description.trim() || undefined,
            trips: trips.map((t) => ({
                trip_id: t.trip_id,
                custom_location: t.custom_location,
                planned_date: t.planned_date.toISOString(),
            })),
        });
        setIsLoading(false);

        if (result.success && result.plan) {
            // Navigate back with refresh parameter
            router.replace("/planning");
        } else {
            Alert.alert("Fehler", result.error || "Plan konnte nicht erstellt werden");
        }
    };

    return (
        <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <IconSymbol name="chevron.left" size={24} color={colors.text} />
                </Pressable>
                <ThemedText style={styles.headerTitle}>Neuer Plan</ThemedText>
                <View style={styles.placeholder} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Title */}
                <View style={styles.inputGroup}>
                    <ThemedText style={styles.label}>Titel *</ThemedText>
                    <TextInput
                        style={[
                            styles.input,
                            {
                                backgroundColor: colors.surface,
                                borderColor: colors.border,
                                color: colors.text,
                            },
                        ]}
                        placeholder="z.B. Wochenendausflug ins Emmental"
                        placeholderTextColor={colors.textSecondary}
                        value={title}
                        onChangeText={setTitle}
                    />
                </View>

                {/* Description */}
                <View style={styles.inputGroup}>
                    <ThemedText style={styles.label}>Beschreibung (optional)</ThemedText>
                    <TextInput
                        style={[
                            styles.input,
                            styles.textArea,
                            {
                                backgroundColor: colors.surface,
                                borderColor: colors.border,
                                color: colors.text,
                            },
                        ]}
                        placeholder="Beschreibe deinen Ausflug..."
                        placeholderTextColor={colors.textSecondary}
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                    />
                </View>

                {/* Trips */}
                <View style={styles.inputGroup}>
                    <ThemedText style={styles.label}>Ausflüge *</ThemedText>

                    {trips.map((trip) => (
                        <View
                            key={trip.id}
                            style={[
                                styles.tripItem,
                                { backgroundColor: colors.surface, borderColor: colors.border },
                            ]}
                        >
                            <View style={styles.tripInfo}>
                                <ThemedText style={styles.tripTitle}>
                                    {trip.trip ? trip.trip.title : trip.custom_location || "Eigener Ort"}
                                </ThemedText>
                                <Pressable
                                    onPress={() => setShowDatePicker(trip.id)}
                                    style={[styles.dateButton, { borderColor: colors.border }]}
                                >
                                    <IconSymbol name="calendar" size={16} color={colors.primary} />
                                    <ThemedText style={[styles.dateText, { color: colors.text }]}>
                                        {trip.planned_date.toLocaleDateString("de-DE", {
                                            day: "2-digit",
                                            month: "short",
                                            year: "numeric",
                                        })}
                                    </ThemedText>
                                </Pressable>
                            </View>
                            <Pressable onPress={() => removeTrip(trip.id)} style={styles.removeButton}>
                                <IconSymbol name="trash" size={18} color="#EF4444" />
                            </Pressable>

                            {/* DatePicker */}
                            {showDatePicker === trip.id && (
                                <DateTimePicker
                                    value={trip.planned_date}
                                    mode="date"
                                    display={Platform.OS === "ios" ? "spinner" : "default"}
                                    onChange={(event, selectedDate) => {
                                        if (selectedDate) {
                                            updateTripDate(trip.id, selectedDate);
                                        } else {
                                            setShowDatePicker(null);
                                        }
                                    }}
                                />
                            )}
                        </View>
                    ))}

                    {/* Add Trip Buttons */}
                    <View style={styles.addButtonsRow}>
                        <Pressable
                            onPress={() => setShowTripPicker(!showTripPicker)}
                            style={[styles.addButton, { backgroundColor: colors.primary }]}
                        >
                            <IconSymbol name="plus.circle.fill" size={20} color="#FFFFFF" />
                            <ThemedText style={styles.addButtonText}>Aus Datenbank</ThemedText>
                        </Pressable>

                        <Pressable
                            onPress={addCustomTrip}
                            style={[styles.addButton, { backgroundColor: colors.textSecondary + "CC" }]}
                        >
                            <IconSymbol name="pencil.circle.fill" size={20} color="#FFFFFF" />
                            <ThemedText style={styles.addButtonText}>Eigener Ort</ThemedText>
                        </Pressable>
                    </View>

                    {/* Trip Picker */}
                    {showTripPicker && (
                        <View
                            style={[
                                styles.tripPicker,
                                { backgroundColor: colors.card, borderColor: colors.border },
                            ]}
                        >
                            <ScrollView style={styles.tripPickerScroll}>
                                {availableTrips.map((ausflug) => (
                                    <Pressable
                                        key={ausflug.id}
                                        onPress={() => addTripFromDatabase(ausflug)}
                                        style={styles.tripPickerItem}
                                    >
                                        <ThemedText style={styles.tripPickerTitle}>
                                            {ausflug.name}
                                        </ThemedText>
                                        <IconSymbol name="chevron.right" size={16} color={colors.textSecondary} />
                                    </Pressable>
                                ))}
                            </ScrollView>
                        </View>
                    )}
                </View>

                {/* Create Button */}
                <Pressable
                    onPress={handleCreate}
                    disabled={isLoading}
                    style={[
                        styles.createButton,
                        { backgroundColor: isLoading ? colors.border : colors.primary },
                    ]}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <>
                            <IconSymbol name="checkmark.circle.fill" size={20} color="#FFFFFF" />
                            <ThemedText style={styles.createButtonText}>Plan erstellen</ThemedText>
                        </>
                    )}
                </Pressable>
            </ScrollView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
    },
    backButton: {
        width: 44,
        height: 44,
        justifyContent: "center",
        alignItems: "center",
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "600",
    },
    placeholder: {
        width: 44,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: Spacing.lg,
    },
    inputGroup: {
        marginBottom: Spacing.lg,
    },
    label: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: Spacing.sm,
    },
    input: {
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        fontSize: 16,
    },
    textArea: {
        minHeight: 80,
        paddingTop: Spacing.md,
    },
    tripItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        marginBottom: Spacing.sm,
    },
    tripInfo: {
        flex: 1,
    },
    tripTitle: {
        fontSize: 14,
        fontWeight: "600",
        marginBottom: Spacing.xs,
    },
    dateButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.xs,
        paddingVertical: Spacing.xs,
        paddingHorizontal: Spacing.sm,
        borderWidth: 1,
        borderRadius: BorderRadius.sm,
        alignSelf: "flex-start",
    },
    dateText: {
        fontSize: 12,
    },
    removeButton: {
        padding: Spacing.sm,
    },
    addButtonsRow: {
        flexDirection: "row",
        gap: Spacing.sm,
        marginTop: Spacing.sm,
    },
    addButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: Spacing.xs,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
    },
    addButtonText: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "600",
    },
    tripPicker: {
        maxHeight: 300,
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        marginTop: Spacing.sm,
    },
    tripPickerScroll: {
        maxHeight: 300,
    },
    tripPickerItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(0,0,0,0.05)",
    },
    tripPickerTitle: {
        fontSize: 14,
    },
    createButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: Spacing.sm,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.lg,
        marginTop: Spacing.xl,
    },
    createButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
    },
});
