import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

interface DistanceBadgeProps {
    durationText: string;
    distanceText: string;
    mode?: 'car' | 'walk' | 'transit';
}

export function DistanceBadge({ durationText, distanceText, mode = 'car' }: DistanceBadgeProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const iconName = {
        car: 'car.fill',
        walk: 'figure.walk',
        transit: 'bus.fill'
    }[mode];

    return (
        <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <IconSymbol name={iconName} size={16} color={colors.primary} />
            <ThemedText style={styles.text}>
                {durationText}
            </ThemedText>
            <ThemedText style={[styles.distance, { color: colors.textSecondary }]}>
                ({distanceText})
            </ThemedText>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.sm,
        borderWidth: 1,
        alignSelf: 'flex-start',
    },
    text: {
        fontSize: 13,
        fontWeight: '600',
    },
    distance: {
        fontSize: 12,
    },
});
