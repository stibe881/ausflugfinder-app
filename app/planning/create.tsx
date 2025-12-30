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
    custom_address?: string;
    planned_date: Date;
    trip?: Ausflug;
    notes?: string;
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
    const [tripSearchQuery, setTripSearchQuery] = useState("");
    const [expandedTrip, setExpandedTrip] = useState<string | null>(null);

    useEffect(() => {
        loadAvailableTrips();
    }, []);

    const loadAvailableTrips = async () => {
        const data = await getAllAusfluege();
        setAvailableTrips(data);
    };

    // Filter trips based on search query
    const filteredAvailableTrips = availableTrips.filter((trip) => {
        if (!tripSearchQuery) return true;
        const query = tripSearchQuery.toLowerCase();
        return (
            trip.name.toLowerCase().includes(query) ||
            trip.adresse?.toLowerCase().includes(query) ||
            trip.region?.toLowerCase().includes(query)
        );
    });



    const updateTripNotes = (tripId: string, notes: string) => {
        setTrips(
            trips.map((t) =>
                t.id === tripId ? { ...t, notes } : t
            )
        );
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
                    text: "Weiter",
                    onPress: (customLocation?: string) => {
                        if (customLocation && customLocation.trim()) {
                            // After getting location name, prompt for address
                            Alert.prompt(
                                "Adresse eingeben",
                                "Adresse (optional):",
                                [
                                    {
                                        text: "Überspringen", onPress: () => {
                                            const newTrip: TripSelection = {
                                                id: Math.random().toString(),
                                                custom_location: customLocation.trim(),
                                                planned_date: new Date(),
                                            };
                                            setTrips([...trips, newTrip]);
                                        }
                                    },
                                    {
                                        text: "Hinzufügen",
                                        onPress: (customAddress?: string) => {
                                            const newTrip: TripSelection = {
                                                id: Math.random().toString(),
                                                custom_location: customLocation.trim(),
                                                custom_address: customAddress?.trim() || undefined,
                                                planned_date: new Date(),
                                            };
                                            setTrips([...trips, newTrip]);
                                        },
                                    },
                                ],
                                "plain-text"
                            );
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

    const moveTripUp = (index: number) => {
        if (index > 0) {
            const newTrips = [...trips];
            [newTrips[index - 1], newTrips[index]] = [newTrips[index], newTrips[index - 1]];
            setTrips(newTrips);
        }
    };

    const moveTripDown = (index: number) => {
        if (index < trips.length - 1) {
            const newTrips = [...trips];
            [newTrips[index], newTrips[index + 1]] = [newTrips[index + 1], newTrips[index]];
            setTrips(newTrips);
        }
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
                custom_address: t.custom_address,
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
                {/* Budget Summary */}
                {trips.length > 0 && (
                    <View style={[styles.budgetCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <View style={styles.budgetHeader}>
                            <IconSymbol name="dollarsign.circle.fill" size={20} color={colors.primary} />
                            <ThemedText style={styles.budgetTitle}>Geschätztes Budget</ThemedText>
                        </View>
                        <ThemedText style={[styles.budgetAmount, { color: colors.primary }]}>
                            {(() => {
                                const costLabels = ["Gratis", "Günstig (CHF 10-30)", "Mittel (CHF 30-60)", "Teuer (CHF 60-100)", "Sehr teuer (CHF 100+)"];
                                const tripCosts = trips.map(t => t.trip?.kosten_stufe ?? 0);
                                const maxCost = Math.max(...tripCosts, 0);
                                const minCost = Math.min(...tripCosts.filter(c => c > 0), 0);

                                if (tripCosts.every(c => c === 0)) {
                                    return "Gratis";
                                } else if (minCost === maxCost) {
                                    return costLabels[maxCost];
                                } else {
                                    return `${costLabels[minCost]} - ${costLabels[maxCost]}`;
                                }
                            })()}
                        </ThemedText>
                        <ThemedText style={[styles.budgetSubtitle, { color: colors.textSecondary }]}>
                            Basierend auf {trips.length} Ausflug{trips.length > 1 ? "en" : ""}
                        </ThemedText>
                    </View>
                )}

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

                    {trips.map((trip, index) => (
                        <View key={trip.id}>
                            <View
                                style={[
                                    styles.tripItem,
                                    { backgroundColor: colors.surface, borderColor: colors.border },
                                ]}
                            >
                                <View style={styles.tripInfo}>
                                    <View style={styles.tripMainRow}>
                                        <Pressable
                                            onPress={() => setExpandedTrip(expandedTrip === trip.id ? null : trip.id)}
                                            style={styles.tripNameRow}
                                        >
                                            <IconSymbol
                                                name={expandedTrip === trip.id ? "chevron.down" : "chevron.right"}
                                                size={16}
                                                color={colors.textSecondary}
                                            />
                                            <ThemedText style={styles.tripTitle}>
                                                {trip.trip ? trip.trip.name : trip.custom_location || "Eigener Ort"}
                                            </ThemedText>
                                        </Pressable>
                                        <View style={styles.tripActions}>
                                            {/* Reorder Buttons */}
                                            <Pressable
                                                onPress={() => moveTripUp(index)}
                                                disabled={index === 0}
                                                style={[styles.reorderButton, index === 0 && styles.reorderButtonDisabled]}
                                            >
                                                <IconSymbol
                                                    name="chevron.up"
                                                    size={16}
                                                    color={index === 0 ? colors.border : colors.textSecondary}
                                                />
                                            </Pressable>
                                            <Pressable
                                                onPress={() => moveTripDown(index)}
                                                disabled={index === trips.length - 1}
                                                style={[styles.reorderButton, index === trips.length - 1 && styles.reorderButtonDisabled]}
                                            >
                                                <IconSymbol
                                                    name="chevron.down"
                                                    size={16}
                                                    color={index === trips.length - 1 ? colors.border : colors.textSecondary}
                                                />
                                            </Pressable>
                                            <Pressable onPress={() => removeTrip(trip.id)} style={styles.removeButton}>
                                                <IconSymbol name="trash" size={18} color="#EF4444" />
                                            </Pressable>
                                        </View>
                                    </View>

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

                            {/* Expanded Section */}
                            {expandedTrip === trip.id && (
                                <View style={[styles.expandedSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>

                                    {/* Notes */}
                                    <View style={styles.expandedGroup}>
                                        <View style={styles.expandedHeader}>
                                            <IconSymbol name="note.text" size={16} color={colors.text} />
                                            <ThemedText style={styles.expandedLabel}>Notizen</ThemedText>
                                        </View>
                                        <TextInput
                                            style={[
                                                styles.notesInput,
                                                {
                                                    backgroundColor: colors.background,
                                                    borderColor: colors.border,
                                                    color: colors.text,
                                                },
                                            ]}
                                            placeholder="Notizen zu diesem Ausflug..."
                                            placeholderTextColor={colors.textSecondary}
                                            value={trip.notes || ""}
                                            onChangeText={(text) => updateTripNotes(trip.id, text)}
                                            multiline
                                            numberOfLines={2}
                                            textAlignVertical="top"
                                        />
                                    </View>
                                </View>
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
                            {/* Search Input */}
                            <View style={[styles.searchContainer, { borderBottomColor: colors.border }]}>
                                <IconSymbol name="magnifyingglass" size={18} color={colors.textSecondary} />
                                <TextInput
                                    style={[styles.searchInput, { color: colors.text }]}
                                    placeholder="Suche nach Name, Ort oder Region..."
                                    placeholderTextColor={colors.textSecondary}
                                    value={tripSearchQuery}
                                    onChangeText={setTripSearchQuery}
                                />
                                {tripSearchQuery.length > 0 && (
                                    <Pressable onPress={() => setTripSearchQuery("")}>
                                        <IconSymbol name="xmark.circle.fill" size={18} color={colors.textSecondary} />
                                    </Pressable>
                                )}
                            </View>

                            {/* Trip List */}
                            <ScrollView style={styles.tripPickerScroll}>
                                {filteredAvailableTrips.length === 0 ? (
                                    <View style={styles.noResults}>
                                        <IconSymbol name="magnifyingglass" size={32} color={colors.textSecondary} />
                                        <ThemedText style={[styles.noResultsText, { color: colors.textSecondary }]}>
                                            Keine Ausflüge gefunden
                                        </ThemedText>
                                    </View>
                                ) : (
                                    filteredAvailableTrips.map((ausflug) => {
                                        const costLabels = ["Gratis", "Günstig", "Mittel", "Teuer", "Sehr teuer"];
                                        const costColors = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#DC2626"];
                                        const costLabel = costLabels[ausflug.kosten_stufe ?? 0];
                                        const costColor = costColors[ausflug.kosten_stufe ?? 0];

                                        return (
                                            <Pressable
                                                key={ausflug.id}
                                                onPress={() => addTripFromDatabase(ausflug)}
                                                style={({ pressed }) => [
                                                    styles.tripPickerCard,
                                                    { backgroundColor: colors.surface, opacity: pressed ? 0.8 : 1 }
                                                ]}
                                            >
                                                <View style={styles.tripPickerInfo}>
                                                    <ThemedText style={styles.tripPickerTitle}>
                                                        {ausflug.name}
                                                    </ThemedText>
                                                    <View style={styles.tripPickerMeta}>
                                                        <IconSymbol name="mappin" size={12} color={colors.textSecondary} />
                                                        <ThemedText style={[styles.tripPickerLocation, { color: colors.textSecondary }]}>
                                                            {ausflug.adresse}
                                                        </ThemedText>
                                                    </View>
                                                    <View style={[styles.costBadge, { backgroundColor: costColor }]}>
                                                        <ThemedText style={styles.costBadgeText}>{costLabel}</ThemedText>
                                                    </View>
                                                </View>
                                                <IconSymbol name="chevron.right" size={16} color={colors.textSecondary} />
                                            </Pressable>
                                        );
                                    })
                                )}
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
    budgetCard: {
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        marginBottom: Spacing.lg,
    },
    budgetHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.sm,
        marginBottom: Spacing.sm,
    },
    budgetTitle: {
        fontSize: 16,
        fontWeight: "600",
    },
    budgetAmount: {
        fontSize: 20,
        fontWeight: "700",
        marginBottom: Spacing.xs,
    },
    budgetSubtitle: {
        fontSize: 13,
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
    tripMainRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: Spacing.sm,
    },
    tripNameRow: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.xs,
    },
    tripActions: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.xs,
    },
    reorderButton: {
        padding: Spacing.xs,
    },
    reorderButtonDisabled: {
        opacity: 0.3,
    },
    participantBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: BorderRadius.sm,
        marginTop: Spacing.xs,
        alignSelf: "flex-start",
    },
    participantBadgeText: {
        fontSize: 11,
        fontWeight: "600",
    },
    expandedSection: {
        borderWidth: 1,
        borderTopWidth: 0,
        borderRadius: BorderRadius.md,
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        padding: Spacing.md,
        marginBottom: Spacing.sm,
    },
    expandedGroup: {
        marginBottom: Spacing.md,
    },
    expandedHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.xs,
        marginBottom: Spacing.sm,
    },
    expandedLabel: {
        fontSize: 14,
        fontWeight: "600",
    },
    participantList: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: Spacing.xs,
        marginBottom: Spacing.sm,
    },
    participantChip: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.xs,
        paddingVertical: Spacing.xs,
        paddingHorizontal: Spacing.sm,
        borderRadius: BorderRadius.sm,
    },
    participantName: {
        fontSize: 13,
    },
    addParticipantButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: Spacing.xs,
        paddingVertical: Spacing.sm,
        borderWidth: 1,
        borderStyle: "dashed",
        borderRadius: BorderRadius.md,
    },
    addParticipantText: {
        fontSize: 13,
        fontWeight: "500",
    },
    notesInput: {
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        fontSize: 14,
        minHeight: 60,
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
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.sm,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderBottomWidth: 1,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        paddingVertical: Spacing.xs,
    },
    noResults: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: Spacing.xxl,
        gap: Spacing.sm,
    },
    noResultsText: {
        fontSize: 14,
    },
    tripPickerCard: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(0,0,0,0.05)",
    },
    tripPickerInfo: {
        flex: 1,
        gap: Spacing.xs,
    },
    tripPickerMeta: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    tripPickerLocation: {
        fontSize: 12,
    },
    costBadge: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: BorderRadius.sm,
        alignSelf: "flex-start",
        marginTop: Spacing.xs,
    },
    costBadgeText: {
        color: "#FFFFFF",
        fontSize: 11,
        fontWeight: "600",
    },
    tripPicker: {
        maxHeight: 300,
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        marginTop: Spacing.sm,
        overflow: "hidden",
    },
    tripPickerScroll: {
        maxHeight: 250,
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
        fontSize: 15,
        fontWeight: "600",
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
