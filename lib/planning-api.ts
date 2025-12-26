import { supabase } from "./supabase";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type PlanStatus = 'idea' | 'planning' | 'confirmed' | 'completed' | 'cancelled';
export type PlanDateType = 'fullday' | 'timeslots';
export type ParticipantRole = 'organizer' | 'co_planner' | 'participant';
export type InvitationStatus = 'pending' | 'accepted' | 'declined';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskType = 'general' | 'packing' | 'booking';
export type CostCategory = 'entrance' | 'parking' | 'transport' | 'food' | 'other';
export type CostSplitMode = 'self_pay' | 'organizer_pays';
export type TimelineType = 'departure' | 'arrival' | 'activity' | 'break' | 'return';
export type CommentThreadType = 'general' | 'travel' | 'food' | 'timeline' | 'booking';
export type TransportMode = 'car' | 'public_transport' | 'bike' | 'walk';

export interface Plan {
    id: string;
    creator_id: number;
    title: string;
    description?: string;
    status: PlanStatus;
    departure_location?: string;
    departure_address?: string;
    departure_lat?: number;
    departure_lng?: number;
    home_location?: string;
    home_address?: string;
    home_lat?: number;
    home_lng?: number;
    created_at: string;
    updated_at: string;
}

export interface PlanTrip {
    id: string;
    plan_id: string;
    trip_id?: number;
    custom_location?: string;
    planned_date: string;
    sequence: number;
    created_at: string;
    // Joined data
    trip?: {
        id: number;
        title: string;
        lat?: string;
        lng?: string;
    };
}

export interface PlanParticipant {
    id: string;
    plan_id: string;
    user_id?: number;
    email?: string;
    role: ParticipantRole;
    adults_count: number;
    children_count: number;
    children_ages: number[];
    invitation_status: InvitationStatus;
    invitation_token?: string;
    created_at: string;
    // Joined data
    user?: {
        id: number;
        name: string;
        email: string;
        profile_photo_url?: string;
    };
}

export interface PlanTask {
    id: string;
    plan_id: string;
    title: string;
    description?: string;
    assigned_to?: string;
    due_date?: string;
    priority: TaskPriority;
    task_type: TaskType;
    is_completed: boolean;
    created_at: string;
    updated_at: string;
}

export interface PlanCost {
    id: string;
    plan_id: string;
    category: CostCategory;
    description: string;
    amount: number;
    per_person: boolean;
    split_mode: CostSplitMode;
    paid_by?: string;
    created_at: string;
}

export interface PlanTimelineItem {
    id: string;
    plan_id: string;
    sequence: number;
    type: TimelineType;
    title: string;
    location?: string;
    start_time: string;
    end_time?: string;
    buffer_minutes: number;
    created_at: string;
}

export interface PlanBooking {
    id: string;
    plan_id: string;
    provider: string;
    booking_number?: string;
    time_slot?: string;
    notes?: string;
    created_at: string;
}

export interface PlanDocument {
    id: string;
    plan_id: string;
    booking_id?: string;
    file_name: string;
    file_path: string;
    file_type: string;
    file_size?: number;
    uploaded_by?: string;
    created_at: string;
}

export interface PlanComment {
    id: string;
    plan_id: string;
    participant_id: string;
    thread_type: CommentThreadType;
    message: string;
    created_at: string;
    // Joined data
    participant?: PlanParticipant;
}

export interface PlanTransport {
    id: string;
    plan_id: string;
    mode: TransportMode;
    parking_info?: string;
    ticket_links: string[];
    public_transport_stops: Array<{
        name: string;
        time?: string;
    }>;
    created_at: string;
}

// Composite types for full plan details
export interface PlanWithDetails extends Plan {
    participants: PlanParticipant[];
    tasks: PlanTask[];
    costs: PlanCost[];
    timeline: PlanTimelineItem[];
    bookings: PlanBooking[];
    documents: PlanDocument[];
    transport?: PlanTransport;
}

export interface CostSummary {
    total: number;
    per_person: number;
    fixed_costs: number;
    variable_costs: number;
    breakdown_by_category: Record<CostCategory, number>;
}

// ============================================================================
// PLAN MANAGEMENT
// ============================================================================

/**
 * Create a new plan with trips
 */
export async function createPlan(data: {
    title: string;
    description?: string;
    trips: Array<{
        trip_id?: number;
        custom_location?: string;
        planned_date: string;
    }>;
}): Promise<{ success: boolean; plan?: Plan; error?: string }> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        // Get user ID from users table
        const { data: userData } = await supabase
            .from('users')
            .select('id')
            .eq('open_id', user.id)
            .single();

        if (!userData) {
            return { success: false, error: 'User not found' };
        }

        const { data: plan, error } = await supabase
            .from('plans')
            .insert({
                title: data.title,
                description: data.description,
                creator_id: userData.id,
                status: 'idea',
                // Temporary: use first trip's date for start_date (old schema compatibility)
                start_date: data.trips[0]?.planned_date || new Date().toISOString(),
            })
            .select()
            .single();

        if (error) {
            console.error('[createPlan] Error:', error);
            return { success: false, error: error.message };
        }

        // Automatically add creator as organizer participant
        await supabase.from('plan_participants').insert({
            plan_id: plan.id,
            user_id: userData.id,
            role: 'organizer',
            invitation_status: 'accepted',
        });

        // Add trips
        if (data.trips && data.trips.length > 0) {
            const tripInserts = data.trips.map((trip, index) => ({
                plan_id: plan.id,
                trip_id: trip.trip_id,
                custom_location: trip.custom_location,
                planned_date: trip.planned_date,
                sequence: index,
            }));

            await supabase.from('plan_trips').insert(tripInserts);
        }

        return { success: true, plan };
    } catch (error: any) {
        console.error('[createPlan] Exception:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get all plans for a user
 */
export async function getPlans(): Promise<Plan[]> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data: userData } = await supabase
            .from('users')
            .select('id')
            .eq('open_id', user.id)
            .single();

        if (!userData) return [];

        const { data, error } = await supabase
            .from('plans')
            .select('*')
            .eq('creator_id', userData.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[getPlans] Error:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('[getPlans] Exception:', error);
        return [];
    }
}

/**
 * Get plan with all details
 */
export async function getPlan(planId: string): Promise<{ success: boolean; plan?: PlanWithDetails; error?: string }> {
    try {
        const { data: plan, error: planError } = await supabase
            .from('plans')
            .select('*')
            .eq('id', planId)
            .single();

        if (planError) {
            return { success: false, error: planError.message };
        }

        // Fetch all related data in parallel
        const [
            { data: participants },
            { data: tasks },
            { data: costs },
            { data: timeline },
            { data: bookings },
            { data: documents },
            { data: transport },
        ] = await Promise.all([
            supabase.from('plan_participants').select('*').eq('plan_id', planId),
            supabase.from('plan_tasks').select('*').eq('plan_id', planId).order('created_at'),
            supabase.from('plan_costs').select('*').eq('plan_id', planId),
            supabase.from('plan_timeline').select('*').eq('plan_id', planId).order('sequence'),
            supabase.from('plan_bookings').select('*').eq('plan_id', planId),
            supabase.from('plan_documents').select('*').eq('plan_id', planId),
            supabase.from('plan_transport').select('*').eq('plan_id', planId).single(),
        ]);

        // Fetch user details for participants
        const participantsWithUsers = await Promise.all(
            (participants || []).map(async (p) => {
                if (p.user_id) {
                    const { data: user } = await supabase
                        .from('users')
                        .select('id, name, email, profile_photo_url')
                        .eq('id', p.user_id)
                        .single();
                    return { ...p, user };
                }
                return p;
            })
        );

        const planWithDetails: PlanWithDetails = {
            ...plan,
            participants: participantsWithUsers,
            tasks: tasks || [],
            costs: costs || [],
            timeline: timeline || [],
            bookings: bookings || [],
            documents: documents || [],
            transport: transport || undefined,
        };

        return { success: true, plan: planWithDetails };
    } catch (error: any) {
        console.error('[getPlan] Exception:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Update plan
 */
export async function updatePlan(
    planId: string,
    updates: Partial<Plan>
): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase
            .from('plans')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', planId);

        if (error) {
            console.error('[updatePlan] Error:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error: any) {
        console.error('[updatePlan] Exception:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Update plan status
 */
export async function updatePlanStatus(
    planId: string,
    status: PlanStatus
): Promise<{ success: boolean; error?: string }> {
    return updatePlan(planId, { status });
}

/**
 * Update plan start location
 */
export async function updatePlanLocation(
    planId: string,
    location: {
        departure_location?: string;
        departure_address?: string;
        departure_lat?: number;
        departure_lng?: number;
    }
): Promise<{ success: boolean; error?: string }> {
    return updatePlan(planId, location);
}

/**
 * Delete plan
 */
export async function deletePlan(planId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase
            .from('plans')
            .delete()
            .eq('id', planId);

        if (error) {
            console.error('[deletePlan] Error:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error: any) {
        console.error('[deletePlan] Exception:', error);
        return { success: false, error: error.message };
    }
}


/**
 * Add trip to plan
 */
export async function addPlanTrip(
    planId: string,
    tripData: {
        trip_id?: number;
        custom_location?: string;
        planned_date: string;
    }
): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase
            .from('plan_trips')
            .insert({
                plan_id: planId,
                ...tripData,
                sequence: 0, // Will be updated if needed
            });

        if (error) {
            console.error('[addPlanTrip] Error:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error: any) {
        console.error('[addPlanTrip] Exception:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Delete trip from plan
 */
export async function deletePlanTrip(tripId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase
            .from('plan_trips')
            .delete()
            .eq('id', tripId);

        if (error) {
            console.error('[deletePlanTrip] Error:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error: any) {
        console.error('[deletePlanTrip] Exception:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Update plan trip date
 */
export async function updatePlanTripDate(
    tripId: string,
    newDate: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase
            .from('plan_trips')
            .update({ planned_date: newDate })
            .eq('id', tripId);

        if (error) {
            console.error('[updatePlanTripDate] Error:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error: any) {
        console.error('[updatePlanTripDate] Exception:', error);
        return { success: false, error: error.message };
    }
}

// ============================================================================
// PARTICIPANTS
// ============================================================================

/**
 * Add participant to plan
 */
export async function addParticipant(
    planId: string,
    data: {
        user_id?: number;
        email?: string;
        role: ParticipantRole;
        adults_count?: number;
        children_count?: number;
        children_ages?: number[];
    }
): Promise<{ success: boolean; participant?: PlanParticipant; error?: string }> {
    try {
        const { data: participant, error } = await supabase
            .from('plan_participants')
            .insert({
                plan_id: planId,
                ...data,
                invitation_status: data.user_id ? 'accepted' : 'pending',
                // TODO: Add invitation_token after migration
            })
            .select()
            .single();

        if (error) {
            console.error('[addParticipant] Error:', error);
            return { success: false, error: error.message };
        }

        return { success: true, participant };
    } catch (error: any) {
        console.error('[addParticipant] Exception:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Invite participant by email
 */
export async function inviteParticipant(
    planId: string,
    email: string,
    role: ParticipantRole = 'participant'
): Promise<{ success: boolean; invitation_token?: string; error?: string }> {
    try {
        const result = await addParticipant(planId, {
            email,
            role,
            adults_count: 1,
            children_count: 0,
        });

        if (!result.success) {
            return result;
        }

        // TODO: Send email with invitation link
        // const invitationLink = `${APP_URL}/planning/invite/${result.participant.invitation_token}`;

        return {
            success: true,
            invitation_token: result.participant?.invitation_token,
        };
    } catch (error: any) {
        console.error('[inviteParticipant] Exception:', error);
        return { success: false, error: error.message };
    }
}

// ============================================================================
// TASKS
// ============================================================================

/**
 * Add task to plan
 */
export async function addTask(
    planId: string,
    data: {
        title: string;
        description?: string;
        priority: TaskPriority;
        task_type: TaskType;
        due_date?: string;
        assigned_to?: string;
    }
): Promise<{ success: boolean; task?: PlanTask; error?: string }> {
    try {
        const { data: task, error } = await supabase
            .from('plan_tasks')
            .insert({
                plan_id: planId,
                ...data,
                is_completed: false,
            })
            .select()
            .single();

        if (error) {
            console.error('[addTask] Error:', error);
            return { success: false, error: error.message };
        }

        return { success: true, task };
    } catch (error: any) {
        console.error('[addTask] Exception:', error);
        return { success: false, error: error.message };
    }
}

// ============================================================================
// COSTS
// ============================================================================

/**
 * Add cost to plan
 */
export async function addCost(
    planId: string,
    data: {
        category: CostCategory;
        description: string;
        amount: number;
        per_person?: boolean;
        split_mode?: CostSplitMode;
        paid_by?: string;
    }
): Promise<{ success: boolean; cost?: PlanCost; error?: string }> {
    try {
        const { data: cost, error } = await supabase
            .from('plan_costs')
            .insert({
                plan_id: planId,
                ...data,
                per_person: data.per_person ?? false,
                split_mode: data.split_mode ?? 'self_pay',
            })
            .select()
            .single();

        if (error) {
            console.error('[addCost] Error:', error);
            return { success: false, error: error.message };
        }

        return { success: true, cost };
    } catch (error: any) {
        console.error('[addCost] Exception:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get cost summary for plan
 */
export async function getCostSummary(planId: string): Promise<{ success: boolean; summary?: CostSummary; error?: string }> {
    try {
        const { data: costs, error } = await supabase
            .from('plan_costs')
            .select('*')
            .eq('plan_id', planId);

        if (error) {
            return { success: false, error: error.message };
        }

        const { data: participants } = await supabase
            .from('plan_participants')
            .select('adults_count, children_count')
            .eq('plan_id', planId)
            .eq('invitation_status', 'accepted');

        const totalParticipants = participants?.reduce(
            (sum, p) => sum + p.adults_count + p.children_count,
            0
        ) || 1;

        const total = costs?.reduce((sum, c) => sum + Number(c.amount), 0) || 0;
        const fixedCosts = costs?.filter(c => !c.per_person).reduce((sum, c) => sum + Number(c.amount), 0) || 0;
        const variableCosts = costs?.filter(c => c.per_person).reduce((sum, c) => sum + Number(c.amount), 0) || 0;

        const breakdown: Record<CostCategory, number> = {
            entrance: 0,
            parking: 0,
            transport: 0,
            food: 0,
            other: 0,
        };

        costs?.forEach(c => {
            breakdown[c.category] += Number(c.amount);
        });

        return {
            success: true,
            summary: {
                total,
                per_person: (fixedCosts / totalParticipants) + variableCosts,
                fixed_costs: fixedCosts,
                variable_costs: variableCosts,
                breakdown_by_category: breakdown,
            },
        };
    } catch (error: any) {
        console.error('[getCostSummary] Exception:', error);
        return { success: false, error: error.message };
    }
}

// ============================================================================
// TIMELINE & SCHEDULE
// ============================================================================

export interface TripActivity {
    id: string;
    plan_trip_id: string;
    name: string;
    description?: string;
    start_time: string;
    end_time: string;
    location?: string;
    category: 'activity' | 'meal' | 'transport' | 'break';
    sequence: number;
    created_at: string;
    updated_at: string;
}

/**
 * Update trip times (departure, arrival, notes, buffer)
 */
export async function updatePlanTripTimes(
    planTripId: string,
    times: {
        departure_time?: string;
        arrival_time?: string;
        notes?: string;
        buffer_time_minutes?: number;
    }
): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase
            .from('plan_trips')
            .update(times)
            .eq('id', planTripId);

        if (error) throw error;

        return { success: true };
    } catch (error: any) {
        console.error('[updatePlanTripTimes] Error:', error);
        return {
            success: false,
            error: error.message || 'Failed to update trip times'
        };
    }
}

/**
 * Add activity to trip
 */
export async function addTripActivity(
    planTripId: string,
    activity: {
        name: string;
        description?: string;
        start_time: string;
        end_time: string;
        location?: string;
        category: 'activity' | 'meal' | 'transport' | 'break';
        sequence?: number;
    }
): Promise<{ success: boolean; activity?: TripActivity; error?: string }> {
    try {
        // Get current max sequence
        const { data: existingActivities } = await supabase
            .from('trip_activities')
            .select('sequence')
            .eq('plan_trip_id', planTripId)
            .order('sequence', { ascending: false })
            .limit(1);

        const nextSequence = existingActivities && existingActivities.length > 0
            ? existingActivities[0].sequence + 1
            : 0;

        const { data, error } = await supabase
            .from('trip_activities')
            .insert({
                plan_trip_id: planTripId,
                ...activity,
                sequence: activity.sequence ?? nextSequence
            })
            .select()
            .single();

        if (error) throw error;

        return { success: true, activity: data };
    } catch (error: any) {
        console.error('[addTripActivity] Error:', error);
        return {
            success: false,
            error: error.message || 'Failed to add activity'
        };
    }
}

/**
 * Update trip activity
 */
export async function updateTripActivity(
    activityId: string,
    updates: Partial<{
        name: string;
        description: string;
        start_time: string;
        end_time: string;
        location: string;
        category: 'activity' | 'meal' | 'transport' | 'break';
        sequence: number;
    }>
): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase
            .from('trip_activities')
            .update(updates)
            .eq('id', activityId);

        if (error) throw error;

        return { success: true };
    } catch (error: any) {
        console.error('[updateTripActivity] Error:', error);
        return {
            success: false,
            error: error.message || 'Failed to update activity'
        };
    }
}

/**
 * Delete trip activity
 */
export async function deleteTripActivity(
    activityId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase
            .from('trip_activities')
            .delete()
            .eq('id', activityId);

        if (error) throw error;

        return { success: true };
    } catch (error: any) {
        console.error('[deleteTripActivity] Error:', error);
        return {
            success: false,
            error: error.message || 'Failed to delete activity'
        };
    }
}

/**
 * Get activities for a trip
 */
export async function getTripActivities(
    planTripId: string
): Promise<{ success: boolean; activities?: TripActivity[]; error?: string }> {
    try {
        const { data, error } = await supabase
            .from('trip_activities')
            .select('*')
            .eq('plan_trip_id', planTripId)
            .order('start_time', { ascending: true });

        if (error) throw error;

        return { success: true, activities: data || [] };
    } catch (error: any) {
        console.error('[getTripActivities] Error:', error);
        return {
            success: false,
            error: error.message || 'Failed to fetch activities'
        };
    }
}

/**
 * Calculate total trip duration including buffer time
 */
export function calculateTripDuration(
    departureTime: string,
    arrivalTime: string,
    bufferMinutes: number = 0
): { hours: number; minutes: number; totalMinutes: number } {
    const departure = new Date(departureTime);
    const arrival = new Date(arrivalTime);

    const diffMs = arrival.getTime() - departure.getTime();
    const totalMinutes = Math.floor(diffMs / 60000) + bufferMinutes;

    return {
        hours: Math.floor(totalMinutes / 60),
        minutes: totalMinutes % 60,
        totalMinutes
    };
}

/**
 * Check for time conflicts in activities
 */
export function detectTimeConflicts(activities: TripActivity[]): {
    hasConflicts: boolean;
    conflicts: Array<{ activity1: TripActivity; activity2: TripActivity }>;
} {
    const conflicts: Array<{ activity1: TripActivity; activity2: TripActivity }> = [];

    for (let i = 0; i < activities.length; i++) {
        for (let j = i + 1; j < activities.length; j++) {
            const a1Start = new Date(activities[i].start_time).getTime();
            const a1End = new Date(activities[i].end_time).getTime();
            const a2Start = new Date(activities[j].start_time).getTime();
            const a2End = new Date(activities[j].end_time).getTime();

            // Check if times overlap
            if ((a1Start < a2End && a1End > a2Start) ||
                (a2Start < a1End && a2End > a1Start)) {
                conflicts.push({
                    activity1: activities[i],
                    activity2: activities[j]
                });
            }
        }
    }

    return {
        hasConflicts: conflicts.length > 0,
        conflicts
    };
}

// ====================================
// MULTI-DAY TRIP PLANNING
// ====================================

export interface Accommodation {
    id: string;
    plan_id: string;
    name: string;
    address?: string;
    link?: string;
    check_in_date: string;
    check_out_date: string;
    latitude?: number;
    longitude?: number;
    sequence: number;
    created_at: string;
    updated_at: string;
}

export interface DistanceInfo {
    distanceText: string;
    distanceMeters: number;
    durationText: string;
    durationSeconds: number;
}


/**
 * Add accommodation
 */
export async function addAccommodation(
    planId: string,
    accommodation: {
        name: string;
        address?: string;
        link?: string;
        check_in_date: string;
        check_out_date: string;
        latitude?: number;
        longitude?: number;
    }
): Promise<{ success: boolean; accommodation?: Accommodation; error?: string }> {
    try {
        // Get next sequence number
        const { data: trips } = await supabase
            .from('plan_trips')
            .select('sequence')
            .eq('plan_id', planId)
            .order('sequence', { ascending: false })
            .limit(1);

        const nextSequence = trips && trips.length > 0 ? (trips[0].sequence || 0) + 1 : 0;

        const { data, error } = await supabase
            .from('plan_trips')
            .insert({
                plan_id: planId,
                is_accommodation: true,
                accommodation_name: accommodation.name,
                accommodation_address: accommodation.address,
                accommodation_link: accommodation.link,
                accommodation_check_in_date: accommodation.check_in_date,
                accommodation_check_out_date: accommodation.check_out_date,
                latitude: accommodation.latitude,
                longitude: accommodation.longitude,
                planned_date: accommodation.check_in_date,
                sequence: nextSequence
            })
            .select()
            .single();

        if (error) throw error;

        return {
            success: true,
            accommodation: {
                id: data.id,
                plan_id: data.plan_id,
                name: data.accommodation_name!,
                address: data.accommodation_address,
                link: data.accommodation_link,
                check_in_date: data.accommodation_check_in_date!,
                check_out_date: data.accommodation_check_out_date!,
                latitude: data.latitude,
                longitude: data.longitude,
                sequence: data.sequence,
                created_at: data.created_at,
                updated_at: data.updated_at
            }
        };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}

/**
 * Update accommodation
 */
export async function updateAccommodation(
    accommodationId: string,
    updates: {
        name?: string;
        address?: string;
        link?: string;
        check_in_date?: string;
        check_out_date?: string;
        latitude?: number;
        longitude?: number;
    }
): Promise<{ success: boolean; error?: string }> {
    try {
        const updateData: any = {};
        if (updates.name !== undefined) updateData.accommodation_name = updates.name;
        if (updates.address !== undefined) updateData.accommodation_address = updates.address;
        if (updates.link !== undefined) updateData.accommodation_link = updates.link;
        if (updates.check_in_date !== undefined) {
            updateData.accommodation_check_in_date = updates.check_in_date;
            updateData.planned_date = updates.check_in_date; // Keep in sync
        }
        if (updates.check_out_date !== undefined) updateData.accommodation_check_out_date = updates.check_out_date;
        if (updates.latitude !== undefined) updateData.latitude = updates.latitude;
        if (updates.longitude !== undefined) updateData.longitude = updates.longitude;

        const { error } = await supabase
            .from('plan_trips')
            .update(updateData)
            .eq('id', accommodationId);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}

/**
 * Delete accommodation
 */
export async function deleteAccommodation(
    accommodationId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase
            .from('plan_trips')
            .delete()
            .eq('id', accommodationId)
            .eq('is_accommodation', true);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}

/**
 * Get all trips and accommodations for a plan, grouped by date
 */
export async function getPlanTripsGroupedByDay(
    planId: string
): Promise<{ success: boolean; days?: Array<{ date: string; items: any[] }>; error?: string }> {
    try {
        const { data, error } = await supabase
            .from('plan_trips')
            .select(`
                *,
                trip:ausfluege(id, name, beschreibung)
            `)
            .eq('plan_id', planId)
            .order('planned_date', { ascending: true })
            .order('sequence', { ascending: true });

        if (error) throw error;

        // Group by date
        const grouped = new Map<string, any[]>();
        data?.forEach(item => {
            const date = item.planned_date;
            if (!grouped.has(date)) {
                grouped.set(date, []);
            }
            grouped.get(date)!.push(item);
        });

        const days = Array.from(grouped.entries()).map(([date, items]) => ({
            date,
            items
        }));

        return { success: true, days };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}

/**
 * Auto-insert accommodations between different days
 */
export async function autoInsertAccommodations(
    planId: string
): Promise<{ success: boolean; inserted?: number; error?: string }> {
    try {
        const { data: trips, error: fetchError } = await supabase
            .from('plan_trips')
            .select('*')
            .eq('plan_id', planId)
            .eq('is_accommodation', false)
            .order('planned_date', { ascending: true });

        if (fetchError) throw fetchError;
        if (!trips || trips.length < 2) return { success: true, inserted: 0 };

        let insertedCount = 0;
        const uniqueDates = [...new Set(trips.map(t => t.planned_date))].sort();

        for (let i = 0; i < uniqueDates.length - 1; i++) {
            const currentDate = uniqueDates[i];
            const nextDate = uniqueDates[i + 1];

            // Check if accommodation already exists between these dates
            const { data: existing } = await supabase
                .from('plan_trips')
                .select('id')
                .eq('plan_id', planId)
                .eq('is_accommodation', true)
                .eq('accommodation_check_in_date', currentDate)
                .eq('accommodation_check_out_date', nextDate)
                .single();

            if (!existing) {
                // Insert accommodation
                const result = await addAccommodation(planId, {
                    name: `Unterkunft (${currentDate} - ${nextDate})`,
                    check_in_date: currentDate,
                    check_out_date: nextDate
                });

                if (result.success) insertedCount++;
            }
        }

        return { success: true, inserted: insertedCount };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}

/**
 * Get distance between two locations using Google Maps Distance Matrix API
 * with caching to minimize API calls
 */
export async function getDistanceBetweenLocations(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    googleMapsKey: string
): Promise<{ success: boolean; distance?: DistanceInfo; error?: string }> {
    try {
        // Round coordinates for cache matching (6 decimal places ≈ 11cm precision)
        const originLat = Math.round(origin.lat * 1000000) / 1000000;
        const originLng = Math.round(origin.lng * 1000000) / 1000000;
        const destLat = Math.round(destination.lat * 1000000) / 1000000;
        const destLng = Math.round(destination.lng * 1000000) / 1000000;

        // Check cache first
        const { data: cached } = await supabase
            .from('distance_cache')
            .select('*')
            .eq('origin_lat', originLat)
            .eq('origin_lng', originLng)
            .eq('dest_lat', destLat)
            .eq('dest_lng', destLng)
            .gt('expires_at', new Date().toISOString())
            .single();

        if (cached) {
            return {
                success: true,
                distance: {
                    distanceText: cached.distance_text,
                    distanceMeters: cached.distance_meters,
                    durationText: cached.duration_text,
                    durationSeconds: cached.duration_seconds
                }
            };
        }

        // Call Google Maps API
        const url = `https://maps.googleapis.com/maps/api/distancematrix/json?` +
            `origins=${originLat},${originLng}&` +
            `destinations=${destLat},${destLng}&` +
            `key=${googleMapsKey}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.status !== 'OK' || !data.rows?.[0]?.elements?.[0]) {
            throw new Error(`Google Maps API error: ${data.status}`);
        }

        const element = data.rows[0].elements[0];
        if (element.status !== 'OK') {
            throw new Error(`Route not found: ${element.status}`);
        }

        const distanceInfo: DistanceInfo = {
            distanceText: element.distance.text,
            distanceMeters: element.distance.value,
            durationText: element.duration.text,
            durationSeconds: element.duration.value
        };

        // Cache the result
        await supabase
            .from('distance_cache')
            .insert({
                origin_lat: originLat,
                origin_lng: originLng,
                dest_lat: destLat,
                dest_lng: destLng,
                distance_text: distanceInfo.distanceText,
                distance_meters: distanceInfo.distanceMeters,
                duration_text: distanceInfo.durationText,
                duration_seconds: distanceInfo.durationSeconds
            });

        return { success: true, distance: distanceInfo };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}
