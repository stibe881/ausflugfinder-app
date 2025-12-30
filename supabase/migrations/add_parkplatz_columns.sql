-- Add parkplatz_anzahl column (text/enum)
ALTER TABLE ausfluege ADD COLUMN IF NOT EXISTS parkplatz_anzahl text;

-- Add parkplatz_kostenlos column (boolean) if it doesn't exist
ALTER TABLE ausfluege ADD COLUMN IF NOT EXISTS parkplatz_kostenlos boolean DEFAULT false;

-- Comment on columns
COMMENT ON COLUMN ausfluege.parkplatz_anzahl IS 'Anzahl Parkplätze: genuegend, maessig, keine';
COMMENT ON COLUMN ausfluege.parkplatz_kostenlos IS 'Ob Parkplätze kostenlos sind';
