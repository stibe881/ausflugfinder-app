import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { TimelineVisualization } from './TimelineVisualization';
import { BudgetSummary } from './BudgetSummary';
import { IconSymbol } from '@/components/ui/icon-symbol';

// --- Types ---
interface TabProps {
    planId: string;
}

// --- Placeholder Component for Empty Tabs ---
function PlaceholderTab({ title, icon }: { title: string; icon: string }) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.emptyState}>
                <IconSymbol name={icon as any} size={48} color={colors.textSecondary} />
                <ThemedText type="subtitle" style={{ marginTop: Spacing.md }}>{title}</ThemedText>
                <ThemedText style={{ color: colors.textSecondary, textAlign: 'center', marginTop: Spacing.xs }}>
                    Diese Funktion ist noch in Entwicklung.
                </ThemedText>
            </View>
        </View>
    );
}

// --- Timeline Tab ---
export function TimelineTab({ planId }: TabProps) {
    // In a real implementation, we would fetch data here based on planId
    // For now, passing empty data to render the empty state of the visualization
    return (
        <View style={styles.container}>
            <TimelineVisualization activities={[]} />
        </View>
    );
}

// --- Budget Tab ---
export function BudgetTab({ planId }: TabProps) {
    return (
        <View style={[styles.container, { padding: Spacing.md }]}>
            <BudgetSummary total={0} perPerson={0} participantCount={1} />
            <PlaceholderTab title="Budget Details" icon="dollarsign.circle" />
        </View>
    );
}

// --- Other Tabs (Placeholders) ---
export function RouteTab({ planId }: TabProps) {
    return <PlaceholderTab title="Route & Karte" icon="map" />;
}

export function PackingListTab({ planId }: TabProps) {
    return <PlaceholderTab title="Packliste" icon="bag" />;
}

export function ChecklistTab({ planId }: TabProps) {
    return <PlaceholderTab title="Checkliste" icon="checklist" />;
}

export function TicketsTab({ planId }: TabProps) {
    return <PlaceholderTab title="Tickets & Dokumente" icon="ticket" />;
}

export function BookingsTab({ planId }: TabProps) {
    return <PlaceholderTab title="Buchungen" icon="calendar" />;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.xl,
    },
});
