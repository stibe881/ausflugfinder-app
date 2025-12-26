import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { TimelineVisualization } from './TimelineVisualization';
import { BudgetSummary } from './BudgetSummary';
import { IconSymbol } from '@/components/ui/icon-symbol';

import { PlanWithDetails, PlanTimelineItem } from '@/lib/planning-api';

// --- Types ---
interface TabProps {
    planId: string;
    plan: PlanWithDetails;
    budgetSummary: {
        total: number;
        perPerson: number;
        participantCount: number;
    };
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
export function TimelineTab({ plan }: TabProps) {
    // Map PlanTimelineItem to the expected format for TimelineVisualization
    // Note: This is a simplified mapping. In a full implementation, you might want to 
    // align the types between PlanTimelineItem and TripActivity more closely.
    const activities = plan.timeline.map(item => ({
        id: item.id,
        plan_trip_id: item.plan_id, // fallback
        name: item.title,
        description: item.location,
        start_time: item.start_time,
        end_time: item.end_time || item.start_time,
        location: item.location,
        category: mapTimelineTypeToCategory(item.type),
        sequence: item.sequence,
        created_at: item.created_at,
        updated_at: item.created_at
    }));

    return (
        <View style={styles.container}>
            <TimelineVisualization
                activities={activities}
                departureTime={plan.departure_lat ? plan.start_date : undefined} // Example mapping 
            />
        </View>
    );
}

function mapTimelineTypeToCategory(type: string): 'activity' | 'meal' | 'transport' | 'break' {
    switch (type) {
        case 'meal': return 'meal';
        case 'break': return 'break';
        case 'travel': return 'transport';
        default: return 'activity';
    }
}

// --- Budget Tab ---
export function BudgetTab({ plan, budgetSummary }: TabProps) {
    return (
        <View style={[styles.container, { padding: Spacing.md }]}>
            <BudgetSummary
                total={budgetSummary.total}
                perPerson={budgetSummary.perPerson}
                participantCount={budgetSummary.participantCount}
            />

            <ScrollView style={{ marginTop: Spacing.md, flex: 1 }}>
                <ThemedText type="subtitle" style={{ marginBottom: Spacing.sm }}>Ausgaben</ThemedText>
                {plan.costs.length === 0 ? (
                    <ThemedText style={{ color: '#888', fontStyle: 'italic' }}>Keine Ausgaben erfasst.</ThemedText>
                ) : (
                    plan.costs.map(cost => (
                        <View key={cost.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
                            <View>
                                <ThemedText>{cost.description}</ThemedText>
                                <ThemedText style={{ fontSize: 12, color: '#666' }}>{cost.category} • {cost.paid_by || 'Unbekannt'}</ThemedText>
                            </View>
                            <ThemedText style={{ fontWeight: '600' }}>{cost.amount.toFixed(2)} CHF</ThemedText>
                        </View>
                    ))
                )}
            </ScrollView>
        </View>
    );
}

// --- Other Tabs (Placeholders) ---
import { MapViewComponent } from '@/components/map-view-component';

// --- Route Tab ---
export function RouteTab({ plan }: TabProps) {
    // Map plan trips to the format expected by MapViewComponent
    const mapTrips = plan.trips.filter(t => t.trip && t.trip.lat && t.trip.lng).map(t => ({
        id: t.trip!.id,
        name: t.trip!.title,
        lat: t.trip!.lat || null,
        lng: t.trip!.lng || null,
        kosten_stufe: null, // Optional, fetch if available in trip join
        region: null,
        primaryPhotoUrl: null // Could add this to the fetch if needed
    }));

    return (
        <View style={styles.container}>
            <MapViewComponent trips={mapTrips} />
        </View>
    );
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
