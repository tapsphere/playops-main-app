-- Add company profile fields to profiles table for brands
ALTER TABLE public.profiles 
ADD COLUMN company_name TEXT,
ADD COLUMN company_description TEXT,
ADD COLUMN company_logo_url TEXT;

-- Add index for faster brand lookups
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);