-- Disable RLS temporarily for development (or create permissive policies)
-- Option 1: Disable RLS completely (NOT recommended for production)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE trips DISABLE ROW LEVEL SECURITY;
ALTER TABLE trip_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE trip_photos DISABLE ROW LEVEL SECURITY;
ALTER TABLE trip_videos DISABLE ROW LEVEL SECURITY;
ALTER TABLE trip_comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE trip_journal DISABLE ROW LEVEL SECURITY;
ALTER TABLE trip_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE trip_attributes DISABLE ROW LEVEL SECURITY;
ALTER TABLE muffles DISABLE ROW LEVEL SECURITY;
ALTER TABLE destinations DISABLE ROW LEVEL SECURITY;
ALTER TABLE friendships DISABLE ROW LEVEL SECURITY;
ALTER TABLE day_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE day_plan_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE packing_list_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens DISABLE ROW LEVEL SECURITY;

-- Option 2: Create permissive policies (recommended for development)
-- Uncomment these if you want to keep RLS enabled but allow all access

-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow all access to users" ON users FOR ALL USING (true);

-- ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow all access to trips" ON trips FOR ALL USING (true);

-- (Repeat for all tables...)
