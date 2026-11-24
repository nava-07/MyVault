-- ==============================================================================
-- MyVault: Add missing icon and is_default columns to categories
-- Run this in your Supabase SQL Editor:
-- ==============================================================================

-- 1. Add missing columns to categories table if they don't exist
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS icon text;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS is_default boolean DEFAULT false;

-- 2. Populate default icons for existing categories
UPDATE public.categories SET icon = 'Award' WHERE name = 'Certificates' AND icon IS NULL;
UPDATE public.categories SET icon = 'BookOpen' WHERE name = 'Published Papers' AND icon IS NULL;
UPDATE public.categories SET icon = 'FileText' WHERE name = 'Reports' AND icon IS NULL;
UPDATE public.categories SET icon = 'Image' WHERE name = 'Achievement Photos' AND icon IS NULL;
UPDATE public.categories SET icon = 'FolderOpen' WHERE name = 'Other' AND icon IS NULL;
