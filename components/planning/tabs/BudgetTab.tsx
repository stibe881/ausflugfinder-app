import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { BudgetSummary } from '@/components/planning/BudgetSummary';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Spacing, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getCostSummary } from '@/lib/planning-api';
import { supabase } from '@/lib/supabase';

interface BudgetTabProps {
    planId: string;
}

interface Participant {
    id: string;
    email: string;
    adults_count: number;
    children_count: number;
}

interface CostItem {
    id: string;
    description: string;
    amount: number;
    category: string;
    created_at: string;
}

export function BudgetTab({ planId }: BudgetTabProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const [summary, setSummary] = useState({ total: 0, perPerson: 0, participantCount: 1, byCategory: {} });
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [costs, setCosts] = useState<CostItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showDetails, setShowDetails] = useState(false);

    useEffect(() => {
        loadBudgetData();
    }, [planId]);

    const loadBudgetData = async () => {
        // Load summary
        const summaryResult = await getCostSummary(planId);
        if (summaryResult.success && summaryResult.summary) {
            setSummary({
                total: summaryResult.summary.total,
                perPerson: summaryResult.summary.per_person,
                participantCount: 1,
                byCategory: summaryResult.summary.by_category || {}
            });
        }

        // Load participants
        const { data: participantData } = await supabase
            .from('plan_participants')
            .select('*')
            .eq('plan_id', planId);

        if (participantData) {
            setParticipants(participantData as Participant[]);
        }

        // Load all costs
        const { data: costData } = await supabase
            .from('plan_costs')
            .select('*')
            .eq('plan_id', planId)
            .order('created_at', { ascending: false });

        if (costData) {
            setCosts(costData as CostItem[]);
        }

        setLoading(false);
    };

    const totalPersons = participants.reduce((sum, p) => sum + p.adults_count + p.children_count, 0) || 1;
    const costPerPerson = summary.total / totalPersons;

    return (
        <ScrollView style={styles.container}>
            {/* Budget Summary */}
            <BudgetSummary
                total={summary.total}
                perPerson={costPerPerson}
                participantCount={totalPersons}
                byCategory={summary.byCategory}
            />

            {/* Per Participant Breakdown */}
            {participants.length > 0 && (
                <View style={[styles.section, { backgroundColor: colors.surface }]}>
                    <View style={styles.sectionHeader}>
                        <IconSymbol name="person.2.fill" size={20} color={colors.primary} />
                        <ThemedText style={styles.sectionTitle}>Kosten pro Teilnehmer</ThemedText>
                    </View>

                    {participants.map(participant => {
                        const personCount = participant.adults_count + participant.children_count;
                        const participantCost = costPerPerson * personCount;

                        return (
                            <View key={participant.id} style={[styles.participantCard, { borderColor: colors.border }]}>
                                <View style={styles.participantInfo}>
                                    <ThemedText style={styles.participantEmail}>
                                        {participant.email}
                                    </ThemedText>
                                    <ThemedText style={[styles.participantCount, { color: colors.textSecondary }]}>
                                        {participant.adults_count} Erwachsene{participant.children_count > 0 && `, ${participant.children_count} Kinder`}
                                    </ThemedText>
                                </View>
                                <ThemedText style={styles.participantCost}>
                                    CHF {participantCost.toFixed(2)}
                                </ThemedText>
                            </View>
                        );
                    })}
                </View>
            )}

            {/* Cost Details (Expandable) */}
            {costs.length > 0 && (
                <View style={[styles.section, { backgroundColor: colors.surface }]}>
                    <Pressable
                        style={styles.sectionHeader}
                        onPress={() => setShowDetails(!showDetails)}
                    >
                        <IconSymbol name="list.bullet.rectangle" size={20} color={colors.primary} />
                        <ThemedText style={styles.sectionTitle}>
                            Alle Kosten ({costs.length})
                        </ThemedText>
                        <IconSymbol
                            name={showDetails ? 'chevron.up' : 'chevron.down'}
                            size={16}
                            color={colors.textSecondary}
                            style={{ marginLeft: 'auto' }}
                        />
                    </Pressable>

                    {showDetails && (
                        <View style={styles.costList}>
                            {costs.map(cost => (
                                <View key={cost.id} style={[styles.costItem, { borderColor: colors.border }]}>
                                    <View style={styles.costInfo}>
                                        <ThemedText style={styles.costDescription}>
                                            {cost.description}
                                        </ThemedText>
                                        <ThemedText style={[styles.costCategory, { color: colors.textSecondary }]}>
                                            {cost.category} · {new Date(cost.created_at).toLocaleDateString('de-CH')}
                                        </ThemedText>
                                    </View>
                                    <ThemedText style={styles.costAmount}>
                                        CHF {cost.amount.toFixed(2)}
                                    </ThemedText>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            )}

            {/* Info Note */}
            <View style={[styles.infoNote, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
                <IconSymbol name="info.circle" size={16} color={colors.primary} />
                <ThemedText style={[styles.infoText, { color: colors.textSecondary }]}>
                    Kosten werden gleichmäßig auf alle Personen aufgeteilt. Erweiterte Split-Optionen kommen bald!
                </ThemedText>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: Spacing.md,
    },
    section: {
        borderRadius: 12,
        padding: Spacing.md,
        marginBottom: Spacing.md,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.md,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    participantCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        borderRadius: 8,
        borderWidth: 1,
        marginBottom: Spacing.sm,
    },
    participantInfo: {
        flex: 1,
    },
    participantEmail: {
        fontSize: 15,
        fontWeight: '500',
        marginBottom: Spacing.xs / 2,
    },
    participantCount: {
        fontSize: 12,
    },
    participantCost: {
        fontSize: 16,
        fontWeight: '700',
    },
    costList: {
        gap: Spacing.sm,
    },
    costItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        borderRadius: 8,
        borderWidth: 1,
    },
    costInfo: {
        flex: 1,
    },
    costDescription: {
        fontSize: 14,
        marginBottom: Spacing.xs / 2,
    },
    costCategory: {
        fontSize: 11,
    },
    costAmount: {
        fontSize: 14,
        fontWeight: '600',
    },
    infoNote: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.sm,
        padding: Spacing.md,
        borderRadius: 8,
        borderWidth: 1,
        marginTop: Spacing.md,
    },
    infoText: {
        flex: 1,
        fontSize: 12,
        lineHeight: 16,
    },
});
