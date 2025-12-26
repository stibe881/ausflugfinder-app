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
import { getPlan, getCostSummary, updatePlan, addPlanTrip, type Plan, type PlanWithDetails, type PlanTask } from "@/lib/planning-api";
import { supabase } from "@/lib/supabase";
import DateTimePicker from '@react-native-community/datetimepicker';
import { TripPickerModal } from "@/components/planning/TripPickerModal";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Platform, Alert, Modal } from "react-native";

export default function PlanDetailScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? "light"];
    const layout = useWindowDimensions();

    const [plan, setPlan] = useState<PlanWithDetails | null>(null);
    const [tasks, setTasks] = useState<PlanTask[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [budgetSummary, setBudgetSummary] = useState({ total: 0, perPerson: 0, participantCount: 1 });

    // Editing State
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [dateMode, setDateMode] = useState<'start' | 'end'>('start');
    const [tempDate, setTempDate] = useState(new Date());

    // Trip Picker State
    const [showTripPicker, setShowTripPicker] = useState(false);
    const [availableTrips, setAvailableTrips] = useState<any[]>([]);

    // Participant Modal State (Placeholder)
    const [showParticipantsModal, setShowParticipantsModal] = useState(false);

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
        setIsLoading(false);
    };

    // --- Date Editing Handlers ---
    const handleEditDate = () => {
        if (!plan) return;
        setTempDate(new Date(plan.start_date || new Date()));
        setDateMode('start');
        setShowDatePicker(true);
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || tempDate;

        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }

        if (dateMode === 'start') {
            // First pick start date, then immediately pick end date (simplified flow)
            // In a real app, you might want two separate pickers or a range picker
            const newStartDate = currentDate.toISOString();

            // For simplicity, just update the start date now. 
            // Ideally we would ask for end date next.
            updatePlanDate(newStartDate);
        }
    };

    const updatePlanDate = async (newStartDate: string) => {
        if (!id) return;
        const res = await updatePlan(id, { start_date: newStartDate });
        if (res.success) {
            loadPlan(); // Reload to refresh UI
        } else {
            Alert.alert("Fehler", "Datum konnte nicht aktualisiert werden.");
        }
    };

    // --- Participant Management ---
    const handleManageParticipants = () => {
        setShowParticipantsModal(true);
    };

    // --- Add Excursion Logic ---
    const handleAddExcursion = async () => {
        // Fetch available trips first
        const { data: trips } = await supabase.from('trips').select('*');
        if (trips) {
            setAvailableTrips(trips);
            setShowTripPicker(true);
        }
    };

    const onSelectTrip = async (tripId: number) => {
        if (!id || !plan) return;

        setShowTripPicker(false);

        // Add trip to plan
        const res = await addPlanTrip(id, {
            trip_id: tripId,
            planned_date: plan.start_date || new Date().toISOString()
        });

        if (res.success) {
            loadPlan(); // Reload
            Alert.alert("Erfolg", "Ausflug wurde hinzugefügt.");
        } else {
            Alert.alert("Fehler", "Ausflug konnte nicht hinzugefügt werden.");
        }
    };

    const renderScene = SceneMap({
        timeline: () => <TimelineTab planId={id!} plan={plan!} budgetSummary={budgetSummary} />,
        route: () => <RouteTab planId={id!} plan={plan!} budgetSummary={budgetSummary} />,
        packing: () => <PackingListTab planId={id!} plan={plan!} budgetSummary={budgetSummary} />,
        budget: () => <BudgetTab planId={id!} plan={plan!} budgetSummary={budgetSummary} />,
        checklist: () => <ChecklistTab planId={id!} plan={plan!} budgetSummary={budgetSummary} />,
        tickets: () => <TicketsTab planId={id!} plan={plan!} budgetSummary={budgetSummary} />,
        bookings: () => <BookingsTab planId={id!} plan={plan!} budgetSummary={budgetSummary} />,
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
                onEditDate={handleEditDate}
                onManageParticipants={handleManageParticipants}
            />

            {/* Tab View */}
            <TabView
                navigationState={{ index, routes }}
                renderScene={renderScene}
                renderTabBar={renderTabBar}
                onIndexChange={setIndex}
                style={{ flex: 1 }}
                initialLayout={{ width: layout.width }}
            />

            {/* FAB for adding excursions (only visible on Timeline/Route) */}
            {(index === 0 || index === 1) && (
                <Pressable
                    style={[styles.fab, { backgroundColor: colors.primary }]}
                    onPress={handleAddExcursion}
                >
                    <IconSymbol name="plus" size={24} color="#FFFFFF" />
                </Pressable>
            )}

            {/* Date Picker (Platform specific) */}
            {showDatePicker && (
                Platform.OS === 'ios' ? (
                    <Modal transparent animationType="fade">
                        <View style={styles.modalOverlay}>
                            <View style={[styles.datePickerContainer, { backgroundColor: colors.card }]}>
                                <View style={styles.datePickerHeader}>
                                    <Pressable onPress={() => setShowDatePicker(false)}>
                                        <ThemedText style={{ color: colors.primary }}>Abbrechen</ThemedText>
                                    </Pressable>
                                    <ThemedText type="defaultSemiBold">Startdatum wählen</ThemedText>
                                    <Pressable onPress={() => {
                                        setShowDatePicker(false);
                                        updatePlanDate(tempDate.toISOString());
                                    }}>
                                        <ThemedText style={{ color: colors.primary, fontWeight: 'bold' }}>Fertig</ThemedText>
                                    </Pressable>
                                </View>
                                <DateTimePicker
                                    value={tempDate}
                                    mode="date"
                                    display="spinner"
                                    onChange={(_, date) => date && setTempDate(date)}
                                    style={{ height: 200 }}
                                />
                            </View>
                        </View>
                    </Modal>
                ) : (
                    <DateTimePicker
                        value={tempDate}
                        mode="date"
                        display="default"
                        onChange={onDateChange}
                    />
                )
            )}

            {/* Trip Picker Modal */}
            <TripPickerModal
                visible={showTripPicker}
                trips={availableTrips}
                onSelectTrip={onSelectTrip}
                onClose={() => setShowTripPicker(false)}
            />

            {/* Participant Modal (Placeholder) */}
            <Modal
                visible={showParticipantsModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowParticipantsModal(false)}
            >
                <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
                    <View style={styles.modalHeader}>
                        <ThemedText type="title">Teilnehmer</ThemedText>
                        <Pressable onPress={() => setShowParticipantsModal(false)}>
                            <ThemedText style={{ color: colors.primary }}>Schließen</ThemedText>
                        </Pressable>
                    </View>
                    <View style={{ padding: Spacing.lg, alignItems: 'center' }}>
                        <ThemedText>Hier können Teilnehmer verwaltet werden.</ThemedText>
                        <ThemedText style={{ color: colors.textSecondary, marginTop: Spacing.sm }}>
                            (Funktion noch in Entwicklung)
                        </ThemedText>
                    </View>
                </View>
            </Modal>
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
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 4.5,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    datePickerContainer: {
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        overflow: 'hidden',
    },
    datePickerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#ccc',
    },
    modalContainer: {
        flex: 1,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.lg,
    }
});
