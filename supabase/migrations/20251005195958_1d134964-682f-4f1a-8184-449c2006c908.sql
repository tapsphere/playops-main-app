-- Add wallet_address column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN wallet_address TEXT UNIQUE;

-- Add index for faster wallet lookups
CREATE INDEX idx_profiles_wallet_address ON public.profiles(wallet_address);