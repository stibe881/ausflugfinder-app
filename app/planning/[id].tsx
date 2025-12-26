import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import {
    View,
    StyleSheet,
    ActivityIndicator,
    useWindowDimensions,
    Pressable,
} from "react-native";
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { Colors, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { PlanHeader } from "@/components/planning/PlanHeader";
import {
    TimelineTab,
    RouteTab,
    PackingListTab,
    BudgetTab,
    ChecklistTab,
    TicketsTab,
    BookingsTab
} from "@/components/planning/tabs";
import { getPlan, getCostSummary, type Plan, type PlanTask } from "@/lib/planning-api";
import { supabase } from "@/lib/supabase";

export default function PlanDetailScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? "light"];
    const layout = useWindowDimensions();

    const [plan, setPlan] = useState<Plan | null>(null);
    const [tasks, setTasks] = useState<PlanTask[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [budgetSummary, setBudgetSummary] = useState({ total: 0, perPerson: 0, participantCount: 1 });

    // Tab navigation state
    const [index, setIndex] = useState(0);
    const [routes] = useState([
        { key: 'timeline', title: 'Timeline' },
        { key: 'route', title: 'Route' },
        { key: 'packing', title: 'Packliste' },
        { key: 'budget', title: 'Budget' },
        { key: 'checklist', title: 'Checkliste' },
        { key: 'tickets', title: 'Tickets' },
        { key: 'bookings', title: 'Buchungen' },
    ]);

    useEffect(() => {
        loadPlan();
    }, [id]);

    const loadPlan = async () => {
        if (!id) return;

        setIsLoading(true);

        // Load plan
        const result = await getPlan(id);
        if (result.success && result.plan) {
            setPlan(result.plan);
        }

        // Load tasks
        const { data: tasksData } = await supabase
            .from("plan_tasks")
            .select("*")
            .eq("plan_id", id)
            .order("created_at", { ascending: false });

        if (tasksData) {
            setTasks(tasksData as PlanTask[]);
        }

        // Load budget summary
        const costResult = await getCostSummary(id);
        if (costResult.success && costResult.summary) {
            setBudgetSummary({
                total: costResult.summary.total,
                perPerson: costResult.summary.per_person,
                participantCount: 1,
            });
        }

        setIsLoading(false);
    };

    const renderScene = SceneMap({
        timeline: () => <TimelineTab planId={id!} />,
        route: () => <RouteTab planId={id!} />,
        packing: () => <PackingListTab planId={id!} />,
        budget: () => <BudgetTab planId={id!} />,
        checklist: () => <ChecklistTab planId={id!} />,
        tickets: () => <TicketsTab planId={id!} />,
        bookings: () => <BookingsTab planId={id!} />,
    });

    const renderTabBar = (props: any) => (
        <TabBar
            {...props}
            scrollEnabled
            indicatorStyle={{ backgroundColor: colors.primary }}
            style={{ backgroundColor: colors.surface }}
            tabStyle={{ width: 'auto', minWidth: 100 }}
            labelStyle={{ fontSize: 13, fontWeight: '600', textTransform: 'none' }}
            activeColor={colors.primary}
            inactiveColor={colors.textSecondary}
        />
    );

    if (isLoading || !plan) {
        return (
            <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <ThemedText style={styles.loadingText}>Plan wird geladen...</ThemedText>
                </View>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
            {/* Plan Header - Always visible */}
            <PlanHeader
                plan={plan}
                participantCount={budgetSummary.participantCount}
                totalBudget={budgetSummary.total}
                taskProgress={{ completed: tasks.filter(t => t.is_completed).length, total: tasks.length }}
            />

            {/* Tab View */}
            <TabView
                navigationState={{ index, routes }}
                renderScene={renderScene}
                renderTabBar={renderTabBar}
                onIndexChange={setIndex}
                initialLayout={{ width: layout.width }}
            />
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.md,
    },
    loadingText: {
        fontSize: 16,
        opacity: 0.6,
    },
});
