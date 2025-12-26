import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';
import type { PlanTask } from '@/lib/planning-api';

interface ChecklistTabProps {
    planId: string;
}

export function ChecklistTab({ planId }: ChecklistTabProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const [tasks, setTasks] = useState<PlanTask[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTasks();
    }, [planId]);

    const loadTasks = async () => {
        const { data } = await supabase
            .from('plan_tasks')
            .select('*')
            .eq('plan_id', planId)
            .order('created_at', { ascending: false });

        if (data) setTasks(data as PlanTask[]);
        setLoading(false);
    };

    const handleToggle = async (taskId: string) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        await supabase
            .from('plan_tasks')
            .update({ is_completed: !task.is_completed })
            .eq('id', taskId);

        loadTasks();
    };

    const completedCount = tasks.filter(t => t.is_completed).length;

    return (
        <ScrollView style={styles.container}>
            {/* Progress */}
            <View style={[styles.progress, { backgroundColor: colors.surface }]}>
                <ThemedText style={styles.progressText}>
                    Fortschritt: {completedCount}/{tasks.length} Aufgaben
                </ThemedText>
                <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                    <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${tasks.length ? (completedCount / tasks.length) * 100 : 0}%` }]} />
                </View>
            </View>

            {tasks.length === 0 ? (
                <View style={[styles.empty, { backgroundColor: colors.surface }]}>
                    <IconSymbol name="checklist" size={48} color={colors.textSecondary} />
                    <ThemedText style={styles.emptyText}>Noch keine Aufgaben</ThemedText>
                </View>
            ) : (
                tasks.map(task => (
                    <View key={task.id} style={[styles.taskCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Pressable onPress={() => handleToggle(task.id)} style={styles.taskContent}>
                            <IconSymbol
                                name={task.is_completed ? 'checkmark.circle.fill' : 'circle'}
                                size={24}
                                color={task.is_completed ? colors.primary : colors.textSecondary}
                            />
                            <View style={styles.taskInfo}>
                                <ThemedText style={[styles.taskTitle, task.is_completed && styles.completedTask]}>
                                    {task.title}
                                </ThemedText>
                                {task.due_date && (
                                    <View style={styles.dueDateRow}>
                                        <IconSymbol name="calendar" size={12} color={colors.textSecondary} />
                                        <ThemedText style={[styles.dueDate, { color: colors.textSecondary }]}>
                                            {new Date(task.due_date).toLocaleDateString('de-CH', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                        </ThemedText>
                                    </View>
                                )}
                            </View>
                        </Pressable>
                    </View>
                ))
            )}
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
    empty: {
        padding: Spacing.xl,
        borderRadius: 12,
        alignItems: 'center',
        gap: Spacing.md,
    },
    emptyText: {
        fontSize: 16,
        opacity: 0.6,
    },
    taskCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: Spacing.sm,
    },
    taskContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        flex: 1,
    },
    taskInfo: {
        flex: 1,
    },
    taskTitle: {
        fontSize: 15,
        marginBottom: Spacing.xs,
    },
    completedTask: {
        textDecorationLine: 'line-through',
        opacity: 0.5,
    },
    dueDateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    dueDate: {
        fontSize: 12,
    },
});
