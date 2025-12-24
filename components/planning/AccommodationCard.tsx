import { View, StyleSheet, Pressable } from "react-native";
import { ThemedText } from "@/components themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

interface AccommodationCardProps {
    accommodation: {
        id: string;
        name: string;
        address?: string;
        link?: string;
        check_in_date: string;
        check_out_date: string;
    };
    onEdit: () => void;
    onDelete?: () => void;
    distanceFromPrevious?: {
        durationText: string;
        distanceText: string;
    };
    distanceToNext?: {
        durationText: string;
        distanceText: string;
    };
}

export function AccommodationCard({
    accommodation,
    onEdit,
    onDelete,
    distanceFromPrevious,
    distanceToNext
}: AccommodationCardProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    return (
        <ThemedView style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {/* Distance from previous location */}
            {distanceFromPrevious && (
                <View style={[styles.distanceBadge, { backgroundColor: colors.card }]}>
                    <IconSymbol name="car.fill" size={14} color={colors.primary} />
                    <ThemedText style={styles.distanceText}>
                        {distanceFromPrevious.durationText} ({distanceFromPrevious.distanceText})
                    </ThemedText>
                </View>
            )}

            {/* Accommodation Info */}
            <View style={styles.content}>
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <IconSymbol name="bed.double.fill" size={24} color={colors.primary} />
                    </View>
                    <View style={styles.info}>
                        <ThemedText style={styles.name}>{accommodation.name}</ThemedText>
                        {accommodation.address && (
                            <View style={styles.addressRow}>
                                <IconSymbol name="mappin.circle" size={14} color={colors.textSecondary} />
                                <ThemedText style={[styles.address, { color: colors.textSecondary }]}>
                                    {accommodation.address}
                                </ThemedText>
                            </View>
                        )}
                        <View style={styles.datesRow}>
                            <IconSymbol name="calendar" size={14} color={colors.textSecondary} />
                            <ThemedText style={[styles.dates, { color: colors.textSecondary }]}>
                                {new Date(accommodation.check_in_date).toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })}
                                {' → '}
                                {new Date(accommodation.check_out_date).toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })}
                            </ThemedText>
                        </View>
                    </View>
                </View>

                {/* Actions */}
                <View style={styles.actions}>
                    {accommodation.link && (
                        <Pressable style={styles.actionButton}>
                            <IconSymbol name="link" size={18} color={colors.tint} />
                        </Pressable>
                    )}
                    <Pressable onPress={onEdit} style={styles.actionButton}>
                        <IconSymbol name="pencil" size={18} color={colors.tint} />
                    </Pressable>
                    {onDelete && (
                        <Pressable onPress={onDelete} style={styles.actionButton}>
                            <IconSymbol name="trash" size={18} color="#FF3B30" />
                        </Pressable>
                    )}
                </View>
            </View>

            {/* Distance to next location */}
            {distanceToNext && (
                <View style={[styles.distanceBadge, styles.distanceBadgeBottom, { backgroundColor: colors.card }]}>
                    <IconSymbol name="arrow.down" size={14} color={colors.primary} />
                    <ThemedText style={styles.distanceText}>
                        {distanceToNext.durationText} ({distanceToNext.distanceText})
                    </ThemedText>
                </View>
            )}
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        marginVertical: Spacing.sm,
        overflow: 'hidden',
    },
    distanceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        paddingVertical: Spacing.xs,
        paddingHorizontal: Spacing.sm,
        justifyContent: 'center',
    },
    distanceBadgeBottom: {
        borderTopWidth: 1,
        borderTopColor: '#E5E5E5',
    },
    distanceText: {
        fontSize: 12,
        fontWeight: '500',
    },
    content: {
        padding: Spacing.md,
    },
    header: {
        flexDirection: 'row',
        gap: Spacing.sm,
        flex: 1,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: BorderRadius.md,
        backgroundColor: '#F0F0F0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    info: {
        flex: 1,
        gap: Spacing.xs,
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    address: {
        fontSize: 13,
        flex: 1,
    },
    datesRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    dates: {
        fontSize: 13,
        fontWeight: '500',
    },
    actions: {
        flexDirection: 'row',
        gap: Spacing.sm,
        marginTop: Spacing.sm,
        justifyContent: 'flex-end',
    },
    actionButton: {
        padding: Spacing.sm,
    },
});
