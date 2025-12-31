import { Stack, useFocusEffect } from "expo-router";
import { StyleSheet, Switch, View, Pressable, Platform, Linking, Alert } from "react-native";
import { useState, useEffect, useCallback } from "react";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Spacing, BorderRadius, BrandColors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useLocation, DISTANCE_OPTIONS } from "@/hooks/use-location";

function SettingToggle({
    icon,
    iconColor,
    title,
    description,
    value,
    onValueChange,
}: {
    icon: any;
    iconColor: string;
    title: string;
    description: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
}) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? "light"];

    return (
        <View style={[styles.settingItem, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <View style={[styles.settingIcon, { backgroundColor: iconColor + "20" }]}>
                <IconSymbol name={icon} size={22} color={iconColor} />
            </View>
            <View style={styles.settingContent}>
                <ThemedText style={styles.settingTitle}>{title}</ThemedText>
                <ThemedText style={[styles.settingDescription, { color: colors.textSecondary }]}>
                    {description}
                </ThemedText>
            </View>
            <Switch
                value={value}
                onValueChange={onValueChange}
                trackColor={{ false: colors.border, true: BrandColors.primary }}
                thumbColor={"#FFF"}
            />
        </View>
    );
}

function DistanceSelector({
    value,
    onValueChange,
    disabled,
}: {
    value: number;
    onValueChange: (value: number) => void;
    disabled: boolean;
}) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? "light"];

    return (
        <View style={[styles.distanceContainer, { borderColor: colors.border, opacity: disabled ? 0.5 : 1 }]}>
            <View style={styles.distanceHeader}>
                <IconSymbol name="ruler" size={20} color={colors.textSecondary} />
                <ThemedText style={[styles.distanceHeaderText, { color: colors.textSecondary }]}>
                    Benachrichtigungsradius
                </ThemedText>
            </View>
            <View style={styles.distanceOptions}>
                {DISTANCE_OPTIONS.map((option) => (
                    <Pressable
                        key={option.value}
                        onPress={() => !disabled && onValueChange(option.value)}
                        style={[
                            styles.distanceOption,
                            {
                                borderColor: value === option.value ? BrandColors.primary : colors.border,
                                backgroundColor: value === option.value ? BrandColors.primary + "15" : "transparent",
                            },
                        ]}
                    >
                        <ThemedText
                            style={[
                                styles.distanceOptionText,
                                {
                                    color: value === option.value ? BrandColors.primary : colors.text,
                                    fontWeight: value === option.value ? "600" : "400",
                                },
                            ]}
                        >
                            {option.label}
                        </ThemedText>
                    </Pressable>
                ))}
            </View>
        </View>
    );
}


export default function LocationSettingsScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? "light"];
    const {
        settings,
        isLoading,
        permissionGranted,
        toggleLocationEnabled,
        toggleProximityNotifications,
        updateProximityDistance,
        requestPermission,
    } = useLocation();

    const handleLocationToggle = async (enabled: boolean) => {
        if (enabled && Platform.OS !== "web") {
            const success = await toggleLocationEnabled(true);
            if (!success) {
                Alert.alert(
                    "Berechtigung erforderlich",
                    "Bitte erlaube den Standortzugriff in den Systemeinstellungen, um diese Funktion zu nutzen.",
                    [
                        { text: "Abbrechen", style: "cancel" },
                        {
                            text: "Einstellungen öffnen",
                            onPress: () => Linking.openSettings(),
                        },
                    ]
                );
            }
        } else {
            await toggleLocationEnabled(enabled);
        }
    };

    const handleProximityToggle = async (enabled: boolean) => {
        if (enabled && !settings.locationEnabled) {
            Alert.alert(
                "Standort erforderlich",
                "Bitte aktiviere zuerst die Standortfreigabe, um Nähe-Benachrichtigungen zu erhalten."
            );
            return;
        }
        await toggleProximityNotifications(enabled);
    };

    if (Platform.OS === "web") {
        return (
            <>
                <Stack.Screen options={{ headerShown: true, headerTitle: "Standort", headerBackTitle: "Zurück" }} />
                <ThemedView style={styles.container}>
                    <View style={styles.content}>
                        <View style={[styles.infoBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <IconSymbol name="info.circle.fill" size={20} color={colors.textSecondary} />
                            <ThemedText style={[styles.infoText, { color: colors.textSecondary }]}>
                                Standort-Funktionen sind nur in der mobilen App verfügbar.
                            </ThemedText>
                        </View>
                    </View>
                </ThemedView>
            </>
        );
    }

    return (
        <>
            <Stack.Screen options={{ headerShown: true, headerTitle: "Standort", headerBackTitle: "Zurück" }} />
            <ThemedView style={styles.container}>
                <View style={styles.content}>
                    {/* Location Permission */}
                    <View style={styles.section}>
                        <ThemedText style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                            STANDORT
                        </ThemedText>
                        <SettingToggle
                            icon="location.fill"
                            iconColor={BrandColors.accent}
                            title="Standortfreigabe"
                            description="Standort für Karte und Nähe-Funktionen nutzen"
                            value={settings.locationEnabled}
                            onValueChange={handleLocationToggle}
                        />
                    </View>



                    {/* Distance Selector */}
                    <View style={styles.section}>
                        <ThemedText style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                            ENTFERNUNG
                        </ThemedText>
                        <DistanceSelector
                            value={settings.proximityDistance}
                            onValueChange={updateProximityDistance}
                            disabled={!settings.locationEnabled || !settings.proximityNotificationsEnabled}
                        />
                    </View>

                    {/* Info Box */}
                    <View style={[styles.infoBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <IconSymbol name="info.circle.fill" size={20} color={colors.textSecondary} />
                        <ThemedText style={[styles.infoText, { color: colors.textSecondary }]}>
                            Du wirst benachrichtigt, wenn du dich einem Ausflugsziel näherst. Die Benachrichtigung erfolgt einmalig pro Ausflug.
                        </ThemedText>
                    </View>
                </View>
            </ThemedView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: Spacing.lg,
    },
    section: {
        marginBottom: Spacing.xl,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: "600",
        marginBottom: Spacing.md,
        marginLeft: Spacing.sm,
    },
    settingItem: {
        flexDirection: "row",
        alignItems: "center",
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        gap: Spacing.md,
    },
    settingIcon: {
        width: 40,
        height: 40,
        borderRadius: BorderRadius.md,
        justifyContent: "center",
        alignItems: "center",
    },
    settingContent: {
        flex: 1,
    },
    settingTitle: {
        fontSize: 15,
        fontWeight: "500",
    },
    settingDescription: {
        fontSize: 12,
        marginTop: 2,
    },
    distanceContainer: {
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
    },
    distanceHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.md,
        marginBottom: Spacing.md,
    },
    distanceHeaderText: {
        flex: 1,
    },
    distanceOptions: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: Spacing.sm,
    },
    distanceOption: {
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        minWidth: 60,
        alignItems: "center",
    },
    distanceOptionText: {
        fontSize: 14,
        fontWeight: "500",
    },
    infoBox: {
        flexDirection: "row",
        alignItems: "flex-start",
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        gap: Spacing.sm,
        marginTop: Spacing.md,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 18,
    },
});
