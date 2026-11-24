-- ==============================================================================
-- MyVault: Grant Table Permissions & Fix Category Access
-- Fixes: "permission denied for table categories" (PostgreSQL Error 42501)
-- Run this in your Supabase SQL Editor:
-- ==============================================================================

-- 1. Ensure schema usage is granted
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- 2. Grant table permissions to authenticated, anon, and service_role
GRANT ALL ON TABLE public.profiles TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.categories TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.documents TO anon, authenticated, service_role;

-- 3. Grant permissions on sequences
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- 4. Ensure future tables also inherit permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- 5. Ensure categories SELECT policy allows viewing user-owned or system-wide categories
DROP POLICY IF EXISTS "Users can view own categories" ON public.categories;
CREATE POLICY "Users can view own categories" 
  ON public.categories FOR SELECT 
  TO authenticated
  USING (auth.uid() = user_id OR user_id IS NULL);
