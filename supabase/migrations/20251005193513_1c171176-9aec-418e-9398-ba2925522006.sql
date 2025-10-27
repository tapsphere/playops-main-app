-- Create storage bucket for validator preview images
INSERT INTO storage.buckets (id, name, public)
VALUES ('validator-previews', 'validator-previews', true);

-- RLS policies for validator previews
CREATE POLICY "Anyone can view validator previews"
ON storage.objects FOR SELECT
USING (bucket_id = 'validator-previews');

CREATE POLICY "Creators can upload validator previews"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'validator-previews' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Creators can update their own validator previews"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'validator-previews' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create storage bucket for brand logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-logos', 'brand-logos', true);

-- RLS policies for brand logos
CREATE POLICY "Anyone can view brand logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'brand-logos');

CREATE POLICY "Brands can upload their logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'brand-logos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Brands can update their own logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'brand-logos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Add brand color fields to brand_customizations
ALTER TABLE brand_customizations
ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#00FF00',
ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#9945FF',
ADD COLUMN IF NOT EXISTS logo_url TEXT;