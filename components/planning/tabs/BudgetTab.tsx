import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable, TextInput, Alert, Modal } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { BudgetSummary } from '@/components/planning/BudgetSummary';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Spacing, Colors, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getCostSummary, addPlanCost } from '@/lib/planning-api';
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

const COST_CATEGORIES = [
    'Transport',
    'Unterkunft',
    'Verpflegung',
    'Aktivitäten',
    'Eintritte',
    'Sonstiges'
];

export function BudgetTab({ planId }: BudgetTabProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const [summary, setSummary] = useState({ total: 0, perPerson: 0, participantCount: 1, byCategory: {} });
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [costs, setCosts] = useState<CostItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showDetails, setShowDetails] = useState(false);

    // Add cost dialog state
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(COST_CATEGORIES[0]);

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

    const handleAddCost = async () => {
        if (!description.trim()) {
            Alert.alert('Fehler', 'Bitte Beschreibung eingeben');
            return;
        }

        const amountNumber = parseFloat(amount);
        if (isNaN(amountNumber) || amountNumber <= 0) {
            Alert.alert('Fehler', 'Bitte gültigen Betrag eingeben');
            return;
        }

        const result = await addPlanCost(planId, {
            description: description.trim(),
            amount: amountNumber,
            category: selectedCategory
        });

        if (result.success) {
            setDescription('');
            setAmount('');
            setSelectedCategory(COST_CATEGORIES[0]);
            setShowAddDialog(false);
            loadBudgetData();
        } else {
            Alert.alert('Fehler', 'Ausgabe konnte nicht hinzugefügt werden');
        }
    };

    const totalPersons = participants.reduce((sum, p) => sum + p.adults_count + p.children_count, 0) || 1;
    const costPerPerson = summary.total / totalPersons;

    return (
        <>
            <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 80 }}>
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

                {/* Empty State */}
                {costs.length === 0 && (
                    <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
                        <IconSymbol name="banknote" size={48} color={colors.textSecondary} />
                        <ThemedText style={styles.emptyTitle}>Noch keine Ausgaben</ThemedText>
                        <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
                            Füge Ausgaben über das + hinzu
                        </ThemedText>
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

            {/* FAB */}
            <Pressable
                style={[styles.fab, { backgroundColor: colors.primary }]}
                onPress={() => setShowAddDialog(true)}
            >
                <IconSymbol name="plus" size={24} color="#FFF" />
            </Pressable>

            {/* Add Cost Dialog */}
            <Modal
                visible={showAddDialog}
                transparent
                animationType="fade"
                onRequestClose={() => setShowAddDialog(false)}
            >
                <View style={styles.dialogOverlay}>
                    <View style={[styles.dialogContent, { backgroundColor: colors.surface }]}>
                        <ThemedText style={styles.dialogTitle}>Ausgabe hinzufügen</ThemedText>

                        <ThemedText style={[styles.label, { color: colors.textSecondary }]}>Beschreibung</ThemedText>
                        <TextInput
                            style={[styles.input, {
                                backgroundColor: colors.background,
                                color: colors.text,
                                borderColor: colors.border
                            }]}
                            placeholder="z.B. Benzin, Hotel, Tickets..."
                            placeholderTextColor={colors.textSecondary}
                            value={description}
                            onChangeText={setDescription}
                        />

                        <ThemedText style={[styles.label, { color: colors.textSecondary }]}>Betrag (CHF)</ThemedText>
                        <TextInput
                            style={[styles.input, {
                                backgroundColor: colors.background,
                                color: colors.text,
                                borderColor: colors.border
                            }]}
                            placeholder="0.00"
                            placeholderTextColor={colors.textSecondary}
                            value={amount}
                            onChangeText={setAmount}
                            keyboardType="decimal-pad"
                        />

                        <ThemedText style={[styles.label, { color: colors.textSecondary }]}>Kategorie</ThemedText>
                        <View style={styles.categoryGrid}>
                            {COST_CATEGORIES.map(category => (
                                <Pressable
                                    key={category}
                                    style={[
                                        styles.categoryChip,
                                        {
                                            backgroundColor: selectedCategory === category ? colors.primary : colors.background,
                                            borderColor: selectedCategory === category ? colors.primary : colors.border
                                        }
                                    ]}
                                    onPress={() => setSelectedCategory(category)}
                                >
                                    <ThemedText
                                        style={[
                                            styles.categoryText,
                                            { color: selectedCategory === category ? '#FFF' : colors.text }
                                        ]}
                                    >
                                        {category}
                                    </ThemedText>
                                </Pressable>
                            ))}
                        </View>

                        <View style={styles.dialogButtons}>
                            <Pressable
                                onPress={() => {
                                    setShowAddDialog(false);
                                    setDescription('');
                                    setAmount('');
                                    setSelectedCategory(COST_CATEGORIES[0]);
                                }}
                                style={[styles.dialogButton, { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }]}
                            >
                                <ThemedText>Abbrechen</ThemedText>
                            </Pressable>
                            <Pressable
                                onPress={handleAddCost}
                                style={[styles.dialogButton, { backgroundColor: colors.primary }]}
                            >
                                <ThemedText style={{ color: '#FFF', fontWeight: '600' }}>
                                    Hinzufügen
                                </ThemedText>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </>
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
    emptyState: {
        alignItems: 'center',
        padding: Spacing.xl * 2,
        borderRadius: 12,
        marginVertical: Spacing.xl,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: Spacing.md,
    },
    emptyText: {
        fontSize: 14,
        marginTop: Spacing.xs,
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
    fab: {
        position: 'absolute',
        right: Spacing.lg,
        bottom: Spacing.lg,
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    dialogOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.lg,
    },
    dialogContent: {
        width: '100%',
        maxWidth: 400,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
    },
    dialogTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: Spacing.lg,
    },
    label: {
        fontSize: 13,
        fontWeight: '500',
        marginBottom: Spacing.xs,
        marginTop: Spacing.sm,
    },
    input: {
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        fontSize: 15,
        marginBottom: Spacing.sm,
    },
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
        marginBottom: Spacing.lg,
    },
    categoryChip: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
    },
    categoryText: {
        fontSize: 13,
        fontWeight: '500',
    },
    dialogButtons: {
        flexDirection: 'row',
        gap: Spacing.sm,
        marginTop: Spacing.md,
    },
    dialogButton: {
        flex: 1,
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
    },
});
