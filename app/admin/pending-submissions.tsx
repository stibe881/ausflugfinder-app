import { Stack, useRouter } from "expo-router";
import { useState, useCallback } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
    getPendingSubmissions,
    approveSubmission,
    rejectSubmission,
    type Ausflug,
} from "@/lib/supabase-api";

export default function PendingSubmissionsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? "light"];

    const [submissions, setSubmissions] = useState<Ausflug[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    useFocusEffect(
        useCallback(() => {
            loadSubmissions();
        }, [])
    );

    async function loadSubmissions() {
        setLoading(true);
        const data = await getPendingSubmissions();
        setSubmissions(data);
        setLoading(false);
    }

    async function handleApprove(trip: Ausflug) {
        Alert.alert(
            "Genehmigen",
            `Möchtest du "${trip.name}" wirklich genehmigen?`,
            [
                { text: "Abbrechen", style: "cancel" },
                {
                    text: "Genehmigen",
                    onPress: async () => {
                        setActionLoading(trip.id);
                        const result = await approveSubmission(trip.id);
                        setActionLoading(null);
                        if (result.success) {
                            setSubmissions((prev) =>
                                prev.filter((s) => s.id !== trip.id)
                            );
                            Alert.alert("✅ Genehmigt", `"${trip.name}" ist jetzt sichtbar.`);
                        } else {
                            Alert.alert("Fehler", result.error || "Unbekannter Fehler");
                        }
                    },
                },
            ]
        );
    }

    async function handleReject(trip: Ausflug) {
        Alert.alert(
            "Ablehnen",
            `Möchtest du "${trip.name}" wirklich ablehnen?`,
            [
                { text: "Abbrechen", style: "cancel" },
                {
                    text: "Ablehnen",
                    style: "destructive",
                    onPress: async () => {
                        setActionLoading(trip.id);
                        const result = await rejectSubmission(trip.id);
                        setActionLoading(null);
                        if (result.success) {
                            setSubmissions((prev) =>
                                prev.filter((s) => s.id !== trip.id)
                            );
                            Alert.alert("❌ Abgelehnt", `"${trip.name}" wurde abgelehnt.`);
                        } else {
                            Alert.alert("Fehler", result.error || "Unbekannter Fehler");
                        }
                    },
                },
            ]
        );
    }

    return (
        <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
            <Stack.Screen
                options={{
                    headerShown: true,
                    title: "Eingereichte Ausflüge",
                    headerBackTitle: "Zurück",
                }}
            />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
            >
                {loading ? (
                    <View style={styles.centered}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <ThemedText style={{ marginTop: 12, color: colors.textSecondary }}>
                            Lade eingereichte Ausflüge...
                        </ThemedText>
                    </View>
                ) : submissions.length === 0 ? (
                    <View style={styles.centered}>
                        <ThemedText style={{ fontSize: 48 }}>📭</ThemedText>
                        <ThemedText
                            style={{
                                fontSize: 18,
                                fontWeight: "600",
                                marginTop: 12,
                            }}
                        >
                            Keine ausstehenden Einreichungen
                        </ThemedText>
                        <ThemedText
                            style={{
                                fontSize: 14,
                                color: colors.textSecondary,
                                marginTop: 4,
                                textAlign: "center",
                            }}
                        >
                            Alle eingereichten Ausflüge wurden bearbeitet.
                        </ThemedText>
                    </View>
                ) : (
                    submissions.map((trip) => (
                        <View
                            key={trip.id}
                            style={[
                                styles.card,
                                {
                                    backgroundColor: colors.surface,
                                    borderColor: colors.border,
                                },
                            ]}
                        >
                            {/* Trip info */}
                            <Pressable
                                onPress={() => router.push(`/trip/${trip.id}` as any)}
                                style={styles.cardHeader}
                            >
                                <View style={{ flex: 1 }}>
                                    <ThemedText style={styles.tripName}>
                                        {trip.name}
                                    </ThemedText>
                                    <ThemedText
                                        style={[
                                            styles.tripMeta,
                                            { color: colors.textSecondary },
                                        ]}
                                    >
                                        📍 {trip.adresse}
                                    </ThemedText>
                                    {trip.kategorie_alt && (
                                        <ThemedText
                                            style={[
                                                styles.tripMeta,
                                                { color: colors.textSecondary },
                                            ]}
                                        >
                                            🏷️ {trip.kategorie_alt}
                                        </ThemedText>
                                    )}
                                    {trip.submitted_by_email && (
                                        <ThemedText
                                            style={[
                                                styles.tripMeta,
                                                { color: colors.primary },
                                            ]}
                                        >
                                            👤 {trip.submitted_by_email}
                                        </ThemedText>
                                    )}
                                    <ThemedText
                                        style={[
                                            styles.tripMeta,
                                            { color: colors.textSecondary },
                                        ]}
                                    >
                                        🕐{" "}
                                        {new Date(trip.created_at).toLocaleDateString(
                                            "de-CH",
                                            {
                                                day: "2-digit",
                                                month: "2-digit",
                                                year: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            }
                                        )}
                                    </ThemedText>
                                </View>
                                <IconSymbol
                                    name="chevron.right"
                                    size={20}
                                    color={colors.textSecondary}
                                />
                            </Pressable>

                            {/* Action buttons */}
                            <View style={styles.actions}>
                                {actionLoading === trip.id ? (
                                    <ActivityIndicator
                                        size="small"
                                        color={colors.primary}
                                    />
                                ) : (
                                    <>
                                        <Pressable
                                            onPress={() => handleApprove(trip)}
                                            style={[
                                                styles.actionButton,
                                                styles.approveButton,
                                            ]}
                                        >
                                            <IconSymbol
                                                name="checkmark"
                                                size={16}
                                                color="#FFFFFF"
                                            />
                                            <ThemedText
                                                style={styles.actionButtonText}
                                            >
                                                Genehmigen
                                            </ThemedText>
                                        </Pressable>
                                        <Pressable
                                            onPress={() => handleReject(trip)}
                                            style={[
                                                styles.actionButton,
                                                styles.rejectButton,
                                            ]}
                                        >
                                            <IconSymbol
                                                name="xmark"
                                                size={16}
                                                color="#FFFFFF"
                                            />
                                            <ThemedText
                                                style={styles.actionButtonText}
                                            >
                                                Ablehnen
                                            </ThemedText>
                                        </Pressable>
                                    </>
                                )}
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: Spacing.md,
        paddingBottom: 40,
    },
    centered: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingTop: 100,
    },
    card: {
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        marginBottom: Spacing.md,
        overflow: "hidden",
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        padding: Spacing.md,
    },
    tripName: {
        fontSize: 16,
        fontWeight: "700",
        marginBottom: 4,
    },
    tripMeta: {
        fontSize: 13,
        marginTop: 2,
    },
    actions: {
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: 8,
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.md,
    },
    actionButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: BorderRadius.md,
    },
    approveButton: {
        backgroundColor: "#22C55E",
    },
    rejectButton: {
        backgroundColor: "#EF4444",
    },
    actionButtonText: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "600",
    },
});
