-- Add price and participant tracking to tickets

ALTER TABLE plan_tickets
ADD COLUMN price NUMERIC(10, 2),
ADD COLUMN participant_ids TEXT[]; -- Array of participant IDs this ticket is for

-- Add comment
COMMENT ON COLUMN plan_tickets.price IS 'Ticket price in CHF';
COMMENT ON COLUMN plan_tickets.participant_ids IS 'Array of plan_participant IDs this ticket is for';

-- Trigger to automatically create budget entry when ticket is added/updated with price
CREATE OR REPLACE FUNCTION sync_ticket_to_budget()
RETURNS TRIGGER AS $$
BEGIN
    -- Only sync if price is set
    IF NEW.price IS NOT NULL AND NEW.price > 0 THEN
        -- Delete old budget entry if exists (for updates)
        DELETE FROM plan_costs 
        WHERE description LIKE 'Ticket:%' 
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
            'Ticket: ' || NEW.departure_location || ' → ' || NEW.arrival_location || ' (ID: ' || NEW.id || ')',
            NEW.price,
            'Transport',
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

CREATE TRIGGER ticket_budget_sync
AFTER INSERT OR UPDATE ON plan_tickets
FOR EACH ROW
EXECUTE FUNCTION sync_ticket_to_budget();

-- Trigger to delete budget entry when ticket is deleted
CREATE OR REPLACE FUNCTION delete_ticket_budget()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM plan_costs 
    WHERE description LIKE 'Ticket:%' 
    AND description LIKE '%' || OLD.id::text || '%'
    AND plan_id = OLD.plan_id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ticket_budget_delete
AFTER DELETE ON plan_tickets
FOR EACH ROW
EXECUTE FUNCTION delete_ticket_budget();
