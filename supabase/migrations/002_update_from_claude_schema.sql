-- ==============================================================================
-- MyVault: Migration Patch from Claude's Schema to Supabase Storage Schema
-- Run this in your Supabase SQL Editor if you previously executed Claude's queries:
-- ==============================================================================

-- 1. Ensure required extensions exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 2. Add 'file_path' column to documents if missing (and migrate from r2_key if present)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'documents' AND column_name = 'file_path'
  ) THEN
    ALTER TABLE public.documents ADD COLUMN file_path text;
    
    -- If Claude created r2_key, copy any values over and drop NOT NULL
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'documents' AND column_name = 'r2_key'
    ) THEN
      UPDATE public.documents SET file_path = r2_key WHERE file_path IS NULL;
      ALTER TABLE public.documents ALTER COLUMN r2_key DROP NOT NULL;
    END IF;
  END IF;
END $$;

-- 3. Ensure profiles has phone column and unique constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'phone'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN phone text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_phone_key'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_phone_key UNIQUE (phone);
  END IF;
EXCEPTION
  WHEN others THEN NULL;
END $$;

-- 4. Create or replace secure RPC for phone login
CREATE OR REPLACE FUNCTION public.get_email_by_phone(phone_input text)
RETURNS text AS $$
DECLARE
  digits_only text;
  last_10 text;
  found_email text;
BEGIN
  -- Strip all non-digit characters
  digits_only := regexp_replace(COALESCE(phone_input, ''), '[^0-9]', '', 'g');
  
  IF digits_only = '' THEN
    RETURN NULL;
  END IF;

  -- If at least 10 digits provided, match the last 10 digits against stored phone numbers
  IF length(digits_only) >= 10 THEN
    last_10 := right(digits_only, 10);
    
    SELECT email INTO found_email
    FROM public.profiles
    WHERE right(regexp_replace(COALESCE(phone, ''), '[^0-9]', '', 'g'), 10) = last_10
    LIMIT 1;
  ELSE
    SELECT email INTO found_email
    FROM public.profiles
    WHERE regexp_replace(COALESCE(phone, ''), '[^0-9]', '', 'g') = digits_only
    LIMIT 1;
  END IF;

  RETURN found_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_email_by_phone(text) TO anon, authenticated;

-- 5. Auto-seed default categories & auto-create profile triggers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'User'),
    NEW.email,
    NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'phone', '')), ''),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    email = EXCLUDED.email,
    phone = COALESCE(EXCLUDED.phone, profiles.phone);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_profile_categories()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.categories (user_id, name, is_default, icon)
  VALUES
    (NEW.id, 'Certificates', true, 'Award'),
    (NEW.id, 'Published Papers', true, 'BookOpen'),
    (NEW.id, 'Reports', true, 'FileText'),
    (NEW.id, 'Achievement Photos', true, 'Image'),
    (NEW.id, 'Other', true, 'FolderOpen')
  ON CONFLICT (user_id, name) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created_categories ON public.profiles;
CREATE TRIGGER on_profile_created_categories
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_profile_categories();

-- 6. Setup Supabase Storage bucket 'myvault-files' (PRIVATE) and RLS policies
INSERT INTO storage.buckets (id, name, public)
VALUES ('myvault-files', 'myvault-files', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing storage policies if already created to avoid duplication errors
DROP POLICY IF EXISTS "Users can upload own files to myvault-files" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own files from myvault-files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files in myvault-files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files from myvault-files" ON storage.objects;

-- Storage Policy: Users can upload files to their own user_id folder: {user_id}/*
CREATE POLICY "Users can upload own files to myvault-files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'myvault-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage Policy: Users can read own files in myvault-files
CREATE POLICY "Users can read own files from myvault-files"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'myvault-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage Policy: Users can update own files in myvault-files
CREATE POLICY "Users can update own files in myvault-files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'myvault-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage Policy: Users can delete own files from myvault-files
CREATE POLICY "Users can delete own files from myvault-files"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'myvault-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
