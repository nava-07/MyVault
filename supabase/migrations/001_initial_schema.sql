-- ==============================================================================
-- MyVault Database Schema Migration (Supabase PostgreSQL + Supabase Storage)
-- Migration: 001_initial_schema.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. EXTENSIONS
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ------------------------------------------------------------------------------
-- 2. TABLES DEFINITION
-- ------------------------------------------------------------------------------

-- Profiles Table: Extends auth.users with full_name, email, unique phone
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text UNIQUE,
  avatar_url text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Categories Table: User-specific categories
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  is_default boolean DEFAULT false,
  icon text,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT categories_user_id_name_key UNIQUE (user_id, name)
);

-- Documents Table: Uploaded files metadata referencing Supabase Storage file_path
CREATE TABLE IF NOT EXISTS public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  file_path text NOT NULL,
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_size bigint NOT NULL,
  issue_date date,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- ------------------------------------------------------------------------------
-- 3. INDEXES
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_category_id ON public.documents(category_id);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON public.documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- GIN index for full-text search across document title and description
CREATE INDEX IF NOT EXISTS idx_documents_fts ON public.documents 
  USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- Trigram index for fast ILIKE substring matching on document titles
CREATE INDEX IF NOT EXISTS idx_documents_title_trgm ON public.documents 
  USING gin(title gin_trgm_ops);

-- ------------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- 4.1 Profiles RLS Policies
CREATE POLICY "Users can view own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can delete own profile" 
  ON public.profiles FOR DELETE 
  USING (auth.uid() = id);

-- 4.2 Categories RLS Policies
CREATE POLICY "Users can view own categories" 
  ON public.categories FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories" 
  ON public.categories FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories" 
  ON public.categories FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories" 
  ON public.categories FOR DELETE 
  USING (auth.uid() = user_id);

-- 4.3 Documents RLS Policies
CREATE POLICY "Users can view own documents" 
  ON public.documents FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents" 
  ON public.documents FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents" 
  ON public.documents FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents" 
  ON public.documents FOR DELETE 
  USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 5. SECURE RPC: PHONE NUMBER EMAIL LOOKUP
-- ------------------------------------------------------------------------------
-- Allows users to login with Phone + Password by resolving phone to email on the server.
-- Returns ONLY the email string, without revealing any other columns or table access.
-- Runs with SECURITY DEFINER to bypass RLS safely within this function scope.
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

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.get_email_by_phone(text) TO anon, authenticated;

-- ------------------------------------------------------------------------------
-- 6. FUNCTIONS AND TRIGGERS
-- ------------------------------------------------------------------------------

-- 6.1 Trigger: Auto-create Profile row when auth.users row is inserted
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

-- 6.2 Trigger: Auto-seed Default Categories when new profile is created
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

-- 6.3 Trigger: Update updated_at timestamp on documents table
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_documents_updated_at ON public.documents;
CREATE TRIGGER set_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ------------------------------------------------------------------------------
-- 7. SUPABASE STORAGE: BUCKET 'myvault-files' (PRIVATE) & STORAGE POLICIES
-- ------------------------------------------------------------------------------

-- Ensure the private storage bucket 'myvault-files' exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('myvault-files', 'myvault-files', false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

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

-- Storage Policy: Users can delete own files in myvault-files
CREATE POLICY "Users can delete own files from myvault-files"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'myvault-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
