import { View, FlatList, Pressable, StyleSheet, Modal } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

interface TripPickerModalProps {
    visible: boolean;
    trips: any[];
    onSelectTrip: (tripId: number) => void;
    onAddCustom?: () => void;
    onClose: () => void;
}

export function TripPickerModal({ visible, trips, onSelectTrip, onAddCustom, onClose }: TripPickerModalProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? "light"];

    console.log('[TripPickerModal] Rendering with trips:', trips?.length || 0);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                    <View style={styles.modalHeader}>
                        <ThemedText style={styles.modalTitle}>Ausflug hinzufügen</ThemedText>
                        <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                            {onAddCustom && (
                                <Pressable
                                    onPress={onAddCustom}
                                    style={[styles.customButton, { backgroundColor: colors.primary }]}
                                >
                                    <IconSymbol name="plus.circle.fill" size={20} color="#FFF" />
                                    <ThemedText style={styles.customButtonText}>Eigener</ThemedText>
                                </Pressable>
                            )}
                            <Pressable onPress={onClose} style={styles.closeButton}>
                                <IconSymbol name="xmark.circle.fill" size={28} color={colors.textSecondary} />
                            </Pressable>
                        </View>
                    </View>

                    <FlatList
                        data={trips}
                        keyExtractor={(item) => item.id.toString()}
                        style={{ flex: 1 }}
                        contentContainerStyle={{ paddingBottom: Spacing.lg }}
                        ListEmptyComponent={
                            <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
                                Keine Ausflüge verfügbar
                            </ThemedText>
                        }
                        renderItem={({ item, index }) => {
                            if (index === 0) console.log('[TripPickerModal] Rendering first item:', item);
                            return (
                                <Pressable
                                    onPress={() => {
                                        console.log('[TripPickerModal] Selected trip:', item.id, item.name);
                                        onSelectTrip(item.id);
                                    }}
                                    style={[
                                        styles.tripItem,
                                        { borderBottomColor: colors.border },
                                    ]}
                                >
                                    <View style={{ flex: 1 }}>
                                        <ThemedText style={styles.tripTitle}>{item.name || 'Unbenannt'}</ThemedText>
                                        {item.beschreibung && (
                                            <ThemedText
                                                style={[styles.tripDescription, { color: colors.textSecondary }]}
                                                numberOfLines={1}
                                            >
                                                {item.beschreibung}
                                            </ThemedText>
                                        )}
                                    </View>
                                    <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
                                </Pressable>
                            );
                        }}
                    />
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "flex-end",
    },
    modalContent: {
        height: "80%",
        borderTopLeftRadius: BorderRadius.xl,
        borderTopRightRadius: BorderRadius.xl,
        padding: Spacing.lg,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: Spacing.md,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "600",
    },
    closeButton: {
        padding: Spacing.xs,
    },
    tripItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
    },
    tripTitle: {
        fontSize: 16,
        fontWeight: "500",
        marginBottom: 4,
    },
    tripDescription: {
        fontSize: 14,
    },
    emptyText: {
        textAlign: "center",
        padding: Spacing.xl,
    },
    customButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.md,
    },
    customButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
    },
});
