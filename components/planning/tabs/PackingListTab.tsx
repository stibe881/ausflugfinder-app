import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable, TextInput } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getPackingList, addPackingItem, togglePackingItem, deletePackingItem, type PackingItem, type PackingCategory } from '@/lib/planning-api';
import { InputDialog } from '@/components/InputDialog';

interface PackingListTabProps {
    planId: string;
}

const CATEGORIES: { key: PackingCategory; label: string; icon: string }[] = [
    { key: 'clothing', label: 'Kleidung', icon: 'tshirt' },
    { key: 'documents', label: 'Dokumente', icon: 'doc.text' },
    { key: 'toiletries', label: 'Toilettenartikel', icon: 'drop' },
    { key: 'electronics', label: 'Elektronik', icon: 'bolt' },
    { key: 'medication', label: 'Medikamente', icon: 'cross.case' },
    { key: 'other', label: 'Sonstiges', icon: 'ellipsis' },
];

export function PackingListTab({ planId }: PackingListTabProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const [items, setItems] = useState<PackingItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showInputDialog, setShowInputDialog] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<PackingCategory>('other');

    useEffect(() => {
        loadItems();
    }, [planId]);

    const loadItems = async () => {
        const result = await getPackingList(planId);
        if (result.success && result.items) {
            setItems(result.items);
        }
        setLoading(false);
    };

    const handleAddItem = (category: PackingCategory) => {
        setSelectedCategory(category);
        setShowInputDialog(true);
    };

    const handleConfirmAdd = async (text: string) => {
        if (text && text.trim()) {
            const result = await addPackingItem(planId, selectedCategory, text.trim());
            if (result.success) loadItems();
        }
        setShowInputDialog(false);
    };

    const handleToggle = async (item: PackingItem) => {
        await togglePackingItem(item.id, !item.is_packed);
        loadItems();
    };

    const handleDelete = async (item: PackingItem) => {
        await deletePackingItem(item.id);
        loadItems();
    };

    const groupedItems = items.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
    }, {} as Record<string, PackingItem[]>);

    const packedCount = items.filter(i => i.is_packed).length;

    return (
        <ScrollView style={styles.container}>
            {/* Progress */}
            <View style={[styles.progress, { backgroundColor: colors.surface }]}>
                <ThemedText style={styles.progressText}>
                    {packedCount}/{items.length} eingepackt
                </ThemedText>
                <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                    <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${items.length ? (packedCount / items.length) * 100 : 0}%` }]} />
                </View>
            </View>

            {/* Categories */}
            {CATEGORIES.map(cat => {
                const catItems = groupedItems[cat.key] || [];
                return (
                    <View key={cat.key} style={[styles.category, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <View style={styles.categoryHeader}>
                            <View style={styles.categoryTitle}>
                                <IconSymbol name={cat.icon as any} size={20} color={colors.primary} />
                                <ThemedText style={styles.categoryLabel}>{cat.label}</ThemedText>
                                <ThemedText style={[styles.categoryCount, { color: colors.textSecondary }]}>
                                    ({catItems.filter(i => i.is_packed).length}/{catItems.length})
                                </ThemedText>
                            </View>
                            <Pressable onPress={() => handleAddItem(cat.key)} style={[styles.addButton, { backgroundColor: colors.primary }]}>
                                <IconSymbol name="plus" size={16} color="#FFF" />
                            </Pressable>
                        </View>

                        {catItems.map(item => (
                            <Pressable key={item.id} onPress={() => handleToggle(item)} style={styles.item}>
                                <IconSymbol
                                    name={item.is_packed ? 'checkmark.circle.fill' : 'circle'}
                                    size={20}
                                    color={item.is_packed ? colors.primary : colors.textSecondary}
                                />
                                <ThemedText style={[styles.itemText, item.is_packed && styles.itemPacked]}>
                                    {item.item_name} {item.quantity > 1 && `(${item.quantity}x)`}
                                </ThemedText>
                                <Pressable onPress={() => handleDelete(item)} style={styles.deleteButton}>
                                    <IconSymbol name="trash" size={16} color="#FF3B30" />
                                </Pressable>
                            </Pressable>
                        ))}
                    </View>
                );
            })}

            <InputDialog
                visible={showInputDialog}
                title="Item hinzufügen"
                message="Was möchtest du einpacken?"
                placeholder="z.B. T-Shirt"
                onConfirm={handleConfirmAdd}
                onCancel={() => setShowInputDialog(false)}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: Spacing.md,
    },
    progress: {
        padding: Spacing.md,
        borderRadius: 12,
        marginBottom: Spacing.md,
    },
    progressText: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: Spacing.sm,
    },
    progressBar: {
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
    },
    category: {
        borderRadius: 12,
        borderWidth: 1,
        padding: Spacing.md,
        marginBottom: Spacing.md,
    },
    categoryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    categoryTitle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    categoryLabel: {
        fontSize: 16,
        fontWeight: '600',
    },
    categoryCount: {
        fontSize: 14,
    },
    addButton: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.xs,
    },
    itemText: {
        flex: 1,
        fontSize: 15,
    },
    itemPacked: {
        textDecorationLine: 'line-through',
        opacity: 0.5,
    },
    deleteButton: {
        padding: Spacing.xs,
    },
});
