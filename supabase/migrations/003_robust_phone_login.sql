-- ==============================================================================
-- MyVault: Robust Mobile Number & Email Login Function (Fix for p_phone parameter)
-- Run this in your Supabase SQL Editor:
-- ==============================================================================

-- 1. Ensure phone column exists on public.profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'phone'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN phone text;
  END IF;
END $$;

-- 2. Drop existing function to resolve parameter name mismatch (ERROR 42P13)
DROP FUNCTION IF EXISTS public.get_email_by_phone(text);
DROP FUNCTION IF EXISTS public.get_email_by_phone();

-- 3. Create or replace get_email_by_phone supporting both phone_input & p_phone
CREATE OR REPLACE FUNCTION public.get_email_by_phone(
  phone_input text DEFAULT NULL,
  p_phone text DEFAULT NULL
)
RETURNS text AS $$
DECLARE
  raw_input text;
  digits_only text;
  last_10 text;
  found_email text;
BEGIN
  -- Take whichever parameter was supplied
  raw_input := COALESCE(phone_input, p_phone, '');
  
  -- Strip all non-digit characters
  digits_only := regexp_replace(raw_input, '[^0-9]', '', 'g');
  
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

-- 4. Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_email_by_phone(text, text) TO anon, authenticated;
