-- Add price and participant tracking to bookings

ALTER TABLE plan_bookings
ADD COLUMN price NUMERIC(10, 2),
ADD COLUMN participant_ids TEXT[];

-- Add comments
COMMENT ON COLUMN plan_bookings.price IS 'Booking price in CHF';
COMMENT ON COLUMN plan_bookings.participant_ids IS 'Array of plan_participant IDs this booking is for';

-- Trigger to automatically create budget entry when booking is added/updated with price
CREATE OR REPLACE FUNCTION sync_booking_to_budget()
RETURNS TRIGGER AS $$
BEGIN
    -- Only sync if price is set
    IF NEW.price IS NOT NULL AND NEW.price > 0 THEN
        -- Delete old budget entry if exists (for updates)
        DELETE FROM plan_costs 
        WHERE description LIKE 'Unterkunft:%' 
        AND description LIKE '%' || OLD.id::text || '%'
        AND plan_id = NEW.plan_id;
        
        -- Insert new budget entry
        INSERT INTO plan_costs (
            plan_id,
            description,
            amount,
            category,
            split_type,
            split_participant_ids
        ) VALUES (
            NEW.plan_id,
            'Unterkunft: ' || NEW.provider || COALESCE(' (' || NEW.time_slot || ')', '') || ' (ID: ' || NEW.id || ')',
            NEW.price,
            'Unterkunft',
            CASE 
                WHEN NEW.participant_ids IS NOT NULL AND array_length(NEW.participant_ids, 1) > 0 
                THEN 'specific'::cost_split_type
                ELSE 'all'::cost_split_type
            END,
            NEW.participant_ids
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER booking_budget_sync
AFTER INSERT OR UPDATE ON plan_bookings
FOR EACH ROW
EXECUTE FUNCTION sync_booking_to_budget();

-- Trigger to delete budget entry when booking is deleted
CREATE OR REPLACE FUNCTION delete_booking_budget()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM plan_costs 
    WHERE description LIKE 'Unterkunft:%' 
    AND description LIKE '%' || OLD.id::text || '%'
    AND plan_id = OLD.plan_id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER booking_budget_delete
AFTER DELETE ON plan_bookings
FOR EACH ROW
EXECUTE FUNCTION delete_booking_budget();
