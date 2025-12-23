import { Pressable, View, StyleSheet } from "react-native";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { StatusBadge } from "./StatusBadge";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { Plan } from "@/lib/planning-api";

interface SwipeablePlanCardProps {
    plan: Plan;
    onPress: () => void;
    onDelete: (planId: string) => void;
}

const SWIPE_THRESHOLD = -80;
const DELETE_BUTTON_WIDTH = 80;
const GAP = 8; // Spacing between card and button

export function SwipeablePlanCard({ plan, onPress, onDelete }: SwipeablePlanCardProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? "light"];
    const translateX = useSharedValue(0);

    const handleDeletePress = () => {
        // Animate card out before deleting
        translateX.value = withTiming(-300, { duration: 200 }, () => {
            runOnJS(onDelete)(plan.id);
        });
    };

    const panGesture = Gesture.Pan()
        .activeOffsetX([-10, 10])
        .onUpdate((event) => {
            if (event.translationX < 0) {
                // Limit swipe to reveal button + gap
                translateX.value = Math.max(event.translationX, -(DELETE_BUTTON_WIDTH + GAP + 20));
            }
        })
        .onEnd(() => {
            // Snap to either open or closed
            if (translateX.value < SWIPE_THRESHOLD) {
                translateX.value = withTiming(-(DELETE_BUTTON_WIDTH + GAP));
            } else {
                translateX.value = withTiming(0);
            }
        });

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    const deleteButtonStyle = useAnimatedStyle(() => ({
        opacity: withTiming(translateX.value < -20 ? 1 : 0),
    }));

    return (
        <View style={styles.container}>
            {/* Delete Button Background */}
            <Animated.View style={[styles.deleteBackground, deleteButtonStyle]}>
                <Pressable onPress={handleDeletePress} style={styles.deleteButton}>
                    <IconSymbol name="trash.fill" size={24} color="#FFFFFF" />
                </Pressable>
            </Animated.View>

            {/* Swipeable Card */}
            <GestureDetector gesture={panGesture}>
                <Animated.View style={animatedStyle}>
                    <Pressable
                        onPress={onPress}
                        style={[
                            styles.card,
                            {
                                backgroundColor: colors.card,
                                borderColor: colors.border,
                            },
                        ]}
                    >
                        <View style={styles.header}>
                            <View style={styles.headerLeft}>
                                <ThemedText style={styles.title} numberOfLines={1}>
                                    {plan.title}
                                </ThemedText>
                                {plan.description && (
                                    <ThemedText
                                        style={[styles.description, { color: colors.textSecondary }]}
                                        numberOfLines={1}
                                    >
                                        {plan.description}
                                    </ThemedText>
                                )}
                            </View>
                            <StatusBadge status={plan.status} />
                        </View>

                        <View style={styles.footer}>
                            <View style={styles.dateContainer}>
                                <IconSymbol name="calendar" size={16} color={colors.primary} />
                                <ThemedText style={[styles.date, { color: colors.text }]}>
                                    {new Date(plan.created_at).toLocaleDateString("de-DE", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                    })}
                                </ThemedText>
                            </View>
                        </View>
                    </Pressable>
                </Animated.View>
            </GestureDetector>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: Spacing.md,
        marginHorizontal: Spacing.md,
        position: "relative",
    },
    deleteBackground: {
        position: "absolute",
        right: 0,
        top: 0,
        bottom: 0,
        width: DELETE_BUTTON_WIDTH,
        backgroundColor: "#FF3B30",
        borderRadius: BorderRadius.lg,
        justifyContent: "center",
        alignItems: "center",
    },
    deleteButton: {
        width: "100%",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
    },
    card: {
        borderWidth: 1,
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        marginRight: GAP, // This creates the gap
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: Spacing.sm,
    },
    headerLeft: {
        flex: 1,
        marginRight: Spacing.sm,
    },
    title: {
        fontSize: 18,
        fontWeight: "600",
        marginBottom: 4,
    },
    description: {
        fontSize: 14,
    },
    footer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    dateContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    date: {
        fontSize: 14,
        fontWeight: "500",
    },
});
