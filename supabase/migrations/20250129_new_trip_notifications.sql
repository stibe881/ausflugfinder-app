-- Add notification preference for new trips
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS notify_new_trip BOOLEAN DEFAULT true;

-- Function to handle new trip notifications
-- This function will be triggered after a new trip is inserted
CREATE OR REPLACE FUNCTION public.handle_new_trip_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- This function will be called by the trigger
    -- In a real production environment with Edge Functions, we would call the function here via pg_net
    -- For now, we are just marking the preference availability
    
    -- Example of what we would do if pg_net is enabled:
    -- PERFORM net.http_post(
    --     url := 'https://project-ref.supabase.co/functions/v1/notify-new-trip',
    --     headers := '{"Content-Type": "application/json", "Authorization": "Bearer KEY"}'::jsonb,
    --     body := jsonb_build_object('record', row_to_json(NEW))
    -- );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new trips
DROP TRIGGER IF EXISTS on_new_trip_created ON public.ausfluege;
CREATE TRIGGER on_new_trip_created
    AFTER INSERT ON public.ausfluege
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_trip_notification();
