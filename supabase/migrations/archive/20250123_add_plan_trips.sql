-- Add plan_trips table for managing trips within plans
CREATE TABLE IF NOT EXISTS public.plan_trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
    trip_id INTEGER REFERENCES public.ausfluege(id) ON DELETE SET NULL,
    custom_location TEXT,
    planned_date TIMESTAMPTZ NOT NULL,
    sequence INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT trip_or_custom CHECK (
        (trip_id IS NOT NULL AND custom_location IS NULL) OR
        (trip_id IS NULL AND custom_location IS NOT NULL)
    )
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_plan_trips_plan_id ON public.plan_trips(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_trips_trip_id ON public.plan_trips(trip_id);

-- RLS Policies for plan_trips
ALTER TABLE public.plan_trips ENABLE ROW LEVEL SECURITY;

-- Users can view trips for plans they have access to
-- Users can view trips for plans they have access to
DROP POLICY IF EXISTS "Users can view trips for their plans" ON public.plan_trips;
CREATE POLICY "Users can view trips for their plans"
    ON public.plan_trips
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.plans
            WHERE plans.id = plan_trips.plan_id
            AND plans.creator_id IN (
                SELECT id FROM public.users WHERE open_id = auth.uid()::text
            )
        )
    );

-- Users can insert trips to their plans
DROP POLICY IF EXISTS "Users can insert trips to their plans" ON public.plan_trips;
CREATE POLICY "Users can insert trips to their plans"
    ON public.plan_trips
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.plans
            WHERE plans.id = plan_trips.plan_id
            AND plans.creator_id IN (
                SELECT id FROM public.users WHERE open_id = auth.uid()::text
            )
        )
    );

-- Users can update trips in their plans
DROP POLICY IF EXISTS "Users can update trips in their plans" ON public.plan_trips;
CREATE POLICY "Users can update trips in their plans"
    ON public.plan_trips
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.plans
            WHERE plans.id = plan_trips.plan_id
            AND plans.creator_id IN (
                SELECT id FROM public.users WHERE open_id = auth.uid()::text
            )
        )
    );

-- Users can delete trips from their plans
DROP POLICY IF EXISTS "Users can delete trips from their plans" ON public.plan_trips;
CREATE POLICY "Users can delete trips from their plans"
    ON public.plan_trips
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.plans
            WHERE plans.id = plan_trips.plan_id
            AND plans.creator_id IN (
                SELECT id FROM public.users WHERE open_id = auth.uid()::text
            )
        )
    );

-- Trigger for updated_at
CREATE TRIGGER update_plan_trips_updated_at
    BEFORE UPDATE ON public.plan_trips
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
